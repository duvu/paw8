import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateContractDto,
  UpdateContractDto,
  ContractSearchDto,
  ContractResponseDto,
  ContractStatus,
  InterestType,
} from './dto/contract.dto';
import { ContractsRepository } from './contracts.repository';
import { InterestPoliciesRepository } from './interest-policies.repository';
import { validateTransition, getAllowedTransitions } from './contract-state-machine';
import { PdfService } from '../../pdf/src/pdf.service';

@Injectable()
export class ContractsService {
  constructor(
    private readonly contractsRepository: ContractsRepository,
    private readonly interestPoliciesRepository: InterestPoliciesRepository,
    private readonly pdfService: PdfService,
  ) {}

  private async _generateContractCode(
    manager: any,
    tenantId: string,
    storeId: string,
    storeCode?: string,
  ): Promise<string> {
    const lockKey = `${tenantId}:${storeId}:contractseq`;
    await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    let resolvedStoreCode = storeCode;
    if (!resolvedStoreCode) {
      const stores = await manager.query(
        `SELECT code FROM stores WHERE id = $1 AND tenant_id = $2`,
        [storeId, tenantId],
      );
      if (!stores.length) throw new NotFoundException('Store not found');
      resolvedStoreCode = stores[0].code;
    }

    const seqResult = await manager.query(
      `INSERT INTO contract_sequences (tenant_id, store_id, year_month, last_seq)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (tenant_id, store_id, year_month)
       DO UPDATE SET last_seq = contract_sequences.last_seq + 1
       RETURNING last_seq`,
      [tenantId, storeId, yearMonth],
    );

    const seq = seqResult[0].last_seq;
    return `${resolvedStoreCode}-${yearMonth}-${String(seq).padStart(5, '0')}`;
  }

  async generateContractCode(tenantId: string, storeId: string): Promise<string> {
    return this.contractsRepository.transaction(async (manager) => {
      return this._generateContractCode(manager, tenantId, storeId);
    });
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateContractDto,
  ): Promise<ContractResponseDto> {
    return this.contractsRepository.transaction(async (manager) => {
      const store = await this.contractsRepository.findStoreByIdAndTenant(dto.storeId, tenantId, manager);
      if (!store) throw new BadRequestException('Store not found or does not belong to tenant');

      const customer = await this.contractsRepository.findCustomerByIdAndTenant(dto.customerId, tenantId, manager);
      if (!customer) throw new BadRequestException('Customer not found or does not belong to tenant');

      if (dto.assetIds.length > 0) {
        const assets = await this.contractsRepository.findAssetsByIdsForStore(dto.assetIds, tenantId, dto.storeId, manager);
        if (assets.length !== dto.assetIds.length) {
          throw new BadRequestException('Some assets not found or do not belong to tenant/store');
        }
        const alreadyPawned = await this.contractsRepository.findAssetsInActiveContracts(dto.assetIds, tenantId, manager);
        if (alreadyPawned.length > 0) {
          throw new BadRequestException('Some assets are already linked to an active contract');
        }
      }

      let resolvedPolicyId: string | null = dto.policyId ?? null;
      if (!resolvedPolicyId) {
        const defaultPolicy = await this.interestPoliciesRepository.findDefaultByTenant(tenantId);
        resolvedPolicyId = defaultPolicy?.id ?? null;
      }

      const contractCode = await this._generateContractCode(manager, tenantId, dto.storeId, store.code);

      const contract = await this.contractsRepository.insertContract({
        tenantId,
        storeId: dto.storeId,
        customerId: dto.customerId,
        contractCode,
        principalAmount: dto.principalAmount,
        interestRate: dto.interestRate,
        interestType: dto.interestType,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        notes: dto.notes ?? null,
        createdBy: userId,
        policyId: resolvedPolicyId,
      }, manager);

      if (dto.assetIds.length > 0) {
        for (const assetId of dto.assetIds) {
          await this.contractsRepository.insertContractAsset(tenantId, contract.id, assetId, manager);
          await this.contractsRepository.setAssetHolding(assetId, tenantId, manager);
          await this.contractsRepository.setAssetInventoryInStorage(assetId, tenantId, manager);
        }
      }

      await this.contractsRepository.insertStatusHistory(tenantId, contract.id, 'active', userId, manager);

      const savedContract = await this.contractsRepository.findById(tenantId, contract.id, manager);
      const assets = await this.contractsRepository.findContractAssets(contract.id, tenantId, manager);
      return {
        ...savedContract,
        assets: assets.map((a: any) => ({
          id: a.id,
          assetType: a.asset_type,
          assetName: a.asset_name,
          brand: a.brand,
          model: a.model,
          status: a.status,
        })),
        customer: {
          id: savedContract.customer_id,
          fullName: savedContract.customer_full_name,
          phone: savedContract.customer_phone,
          identityNumber: savedContract.customer_identity_number,
        },
      } as any;
    });
  }

  async findAll(tenantId: string, searchDto: ContractSearchDto): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['pc.tenant_id = $1'];
    const params: any[] = [tenantId];

    if (searchDto.contractCode) { params.push(`%${searchDto.contractCode}%`); conditions.push(`pc.contract_code ILIKE $${params.length}`); }
    if (searchDto.customerId) { params.push(searchDto.customerId); conditions.push(`pc.customer_id = $${params.length}`); }
    if (searchDto.storeId) { params.push(searchDto.storeId); conditions.push(`pc.store_id = $${params.length}`); }
    if (searchDto.status) { params.push(searchDto.status); conditions.push(`pc.status = $${params.length}`); }
    if (searchDto.dueDateFrom) { params.push(searchDto.dueDateFrom); conditions.push(`pc.due_date >= $${params.length}`); }
    if (searchDto.dueDateTo) { params.push(searchDto.dueDateTo); conditions.push(`pc.due_date <= $${params.length}`); }

    const total = await this.contractsRepository.countAll(tenantId, conditions, params);
    const data = await this.contractsRepository.findAll(tenantId, conditions, params, limit, offset);

    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<ContractResponseDto> {
    const contract = await this.contractsRepository.findById(tenantId, id);
    if (!contract) throw new NotFoundException('Contract not found');

    const assets = await this.contractsRepository.findContractAssets(id, tenantId);

    return {
      ...contract,
      assets: assets.map((a: any) => ({
        id: a.id,
        assetType: a.asset_type,
        assetName: a.asset_name,
        brand: a.brand,
        model: a.model,
        status: a.status,
      })),
      customer: {
        id: contract.customer_id,
        fullName: contract.customer_full_name,
        phone: contract.customer_phone,
        identityNumber: contract.customer_identity_number,
      },
    } as any;
  }

  async update(tenantId: string, id: string, dto: UpdateContractDto): Promise<ContractResponseDto> {
    const existing = await this.contractsRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundException('Contract not found');

    if (dto.dueDate !== undefined) {
      const txCount = await this.contractsRepository.countTransactions(id, tenantId);
      if (txCount > 0) {
        throw new BadRequestException('Cannot update due date after transactions have been recorded');
      }
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [tenantId, id];

    if (dto.notes !== undefined) { params.push(dto.notes); updates.push(`notes = $${params.length}`); }
    if (dto.dueDate !== undefined) { params.push(dto.dueDate); updates.push(`due_date = $${params.length}`); }

    await this.contractsRepository.update(tenantId, id, updates, params);
    return this.findOne(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: ContractStatus,
    userId: string,
    force = false,
  ): Promise<ContractResponseDto> {
    const existing = await this.contractsRepository.findById(tenantId, id);
    if (!existing) throw new NotFoundException('Contract not found');

    validateTransition(existing.status as ContractStatus, status, force);

    await this.contractsRepository.updateStatus(tenantId, id, status);
    await this.contractsRepository.insertStatusHistory(tenantId, id, status, userId);

    return this.findOne(tenantId, id);
  }

  getAllowedTransitions(status: ContractStatus): ContractStatus[] {
    return getAllowedTransitions(status);
  }

  async getAllowedTransitionsForContract(tenantId: string, id: string): Promise<{ currentStatus: ContractStatus; allowed: ContractStatus[] }> {
    const contract = await this.contractsRepository.findById(tenantId, id);
    if (!contract) throw new NotFoundException('Contract not found');
    const currentStatus = contract.status as ContractStatus;
    return { currentStatus, allowed: getAllowedTransitions(currentStatus) };
  }

  async getUpcomingDue(tenantId: string, storeIds?: string[], days: number = 7): Promise<any[]> {
    return this.contractsRepository.findUpcomingDue(tenantId, days, storeIds);
  }

  async getOverdue(tenantId: string, storeIds?: string[]): Promise<any[]> {
    return this.contractsRepository.findOverdue(tenantId, storeIds);
  }

  async generateContractPdf(tenantId: string, id: string): Promise<Buffer> {
    const contract = await this.findOne(tenantId, id);
    const assets = await this.contractsRepository.findContractAssets(id, tenantId);
    const storeRows = await this.contractsRepository.findStoreByIdAndTenant(
      (contract as any).store_id ?? (contract as any).storeId,
      tenantId,
    );
    return this.pdfService.render('contract', {
      contract,
      assets,
      store: storeRows,
    });
  }

  async generateExtensionPdf(tenantId: string, contractId: string): Promise<Buffer> {
    const contract = await this.findOne(tenantId, contractId);
    const extension = await this.contractsRepository.findLatestExtension(tenantId, contractId);
    if (!extension) throw new NotFoundException('No extension found for this contract');
    const storeRows = await this.contractsRepository.findStoreByIdAndTenant(
      (contract as any).store_id ?? (contract as any).storeId,
      tenantId,
    );
    return this.pdfService.render('extension', {
      contract,
      extension,
      store: storeRows,
    });
  }

  calculateInterest(
    principalAmount: number,
    interestRate: number,
    interestType: InterestType,
    startDate: Date,
    toDate: Date,
  ): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.max(0, Math.ceil((new Date(toDate).getTime() - new Date(startDate).getTime()) / msPerDay));

    switch (interestType) {
      case InterestType.DAILY:
        return principalAmount * (interestRate / 100) * days;
      case InterestType.MONTHLY: {
        const months = Math.ceil(days / 30);
        return principalAmount * (interestRate / 100) * months;
      }
      case InterestType.PER_PERIOD:
        return principalAmount * (interestRate / 100);
      default:
        return 0;
    }
  }
}
