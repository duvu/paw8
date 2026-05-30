import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  RecordTransactionDto,
  ExtendContractDto,
  TransactionType,
} from './dto/transaction.dto';
import { InterestType } from '../../contracts/src/dto/contract.dto';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async recordTransaction(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: RecordTransactionDto,
  ): Promise<any> {
    return this.transactionsRepository.transaction(async (manager) => {
      const contract = await this.transactionsRepository.findContractInStore(tenantId, storeId, dto.contractId, manager);
      if (!contract) throw new NotFoundException('Contract not found in your store');

      if (dto.transactionType === TransactionType.DISBURSEMENT) {
        if (!['draft', 'active'].includes(contract.status)) {
          throw new BadRequestException('Disbursement only allowed for draft/active contracts');
        }
      } else if ([
        TransactionType.INTEREST_COLLECTION,
        TransactionType.FEE_COLLECTION,
        TransactionType.SETTLEMENT,
        TransactionType.PARTIAL_PRINCIPAL,
      ].includes(dto.transactionType)) {
        if (!['active', 'near_due', 'overdue', 'extended'].includes(contract.status)) {
          throw new BadRequestException('Transaction not allowed for current contract status');
        }
      }

      const tx = await this.transactionsRepository.insertTransaction(tenantId, storeId, {
        contractId: dto.contractId,
        transactionType: dto.transactionType,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionDate: dto.transactionDate,
        note: dto.note ?? null,
        referenceTransactionId: dto.referenceTransactionId ?? null,
        createdBy: userId,
      }, manager);

      let contractStatus = contract.status;

      if (dto.transactionType === TransactionType.SETTLEMENT) {
        await this.transactionsRepository.updateContractStatus(tenantId, dto.contractId, 'settled', userId, manager);
        await this.transactionsRepository.insertStatusHistory(tenantId, dto.contractId, 'settled', userId, manager);
        await this.transactionsRepository.updateAssetStatus(tenantId, dto.contractId, 'redeemed', manager);
        await this.transactionsRepository.updateAssetInventory(tenantId, dto.contractId, manager);
        contractStatus = 'settled';
      }

      return { transaction: tx, contractStatus };
    });
  }

  async calculateSettlement(
    tenantId: string,
    contractId: string,
    toDate: Date,
  ): Promise<any> {
    const contract = await this.transactionsRepository.findContractByTenant(tenantId, contractId);
    if (!contract) throw new NotFoundException('Contract not found');

    const alreadyPaid = await this.transactionsRepository.sumPaidTransactions(tenantId, contractId);

    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.max(0, Math.ceil((new Date(toDate).getTime() - new Date(contract.start_date).getTime()) / msPerDay));
    let interestDue = 0;

    switch (contract.interest_type as InterestType) {
      case InterestType.DAILY:
        interestDue = contract.principal_amount * (contract.interest_rate / 100) * days;
        break;
      case InterestType.MONTHLY: {
        const months = Math.ceil(days / 30);
        interestDue = contract.principal_amount * (contract.interest_rate / 100) * months;
        break;
      }
      case InterestType.PER_PERIOD:
        interestDue = contract.principal_amount * (contract.interest_rate / 100);
        break;
    }

    const remaining = Math.max(0, contract.principal_amount + interestDue - alreadyPaid);

    return {
      principalAmount: contract.principal_amount,
      interestDue,
      feeDue: 0,
      totalDue: contract.principal_amount + interestDue,
      alreadyPaid,
      remaining,
    };
  }

  async extendContract(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: ExtendContractDto,
  ): Promise<any> {
    return this.transactionsRepository.transaction(async (manager) => {
      const contract = await this.transactionsRepository.findContractInStore(tenantId, storeId, dto.contractId, manager);
      if (!contract) throw new NotFoundException('Contract not found in your store');

      if (!['active', 'near_due', 'overdue'].includes(contract.status)) {
        throw new BadRequestException('Contract cannot be extended in its current status');
      }

      const tx = await this.transactionsRepository.insertTransaction(tenantId, storeId, {
        contractId: dto.contractId,
        transactionType: 'extension',
        amount: dto.interestPaid,
        paymentMethod: dto.paymentMethod,
        transactionDate: new Date().toISOString(),
        note: dto.note ?? null,
        referenceTransactionId: null,
        createdBy: userId,
      }, manager);

      await this.transactionsRepository.insertExtension(tenantId, {
        contractId: dto.contractId,
        oldDueDate: contract.due_date,
        newDueDate: dto.newDueDate,
        interestPaid: dto.interestPaid,
        feeAmount: dto.feeAmount ?? 0,
        createdBy: userId,
      }, manager);

      await this.transactionsRepository.updateContractDueDate(tenantId, dto.contractId, dto.newDueDate, userId, manager);
      await this.transactionsRepository.insertStatusHistory(tenantId, dto.contractId, 'extended', userId, manager);

      return { transaction: tx, newDueDate: dto.newDueDate };
    });
  }

  async voidTransaction(
    tenantId: string,
    id: string,
    userId: string,
    reason: string,
  ): Promise<any> {
    const original = await this.transactionsRepository.findTransactionById(tenantId, id);
    if (!original) throw new NotFoundException('Transaction not found');

    if ([TransactionType.VOID, TransactionType.REVERSAL].includes(original.transaction_type)) {
      throw new BadRequestException('Cannot void a void or reversal transaction');
    }

    return this.transactionsRepository.insertVoidTransaction(tenantId, original, reason, userId);
  }

  async getByContract(tenantId: string, contractId: string): Promise<any[]> {
    return this.transactionsRepository.getByContract(tenantId, contractId);
  }
}
