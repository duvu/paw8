import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  RecordTransactionDto,
  ExtendContractDto,
  TransactionType,
  PaymentMethod,
} from './dto/transaction.dto';
import { InterestType } from '../../contracts/src/dto/contract.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async recordTransaction(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: RecordTransactionDto,
  ): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      // Validate contract belongs to tenant and store
      const contracts = await manager.query(
        `SELECT * FROM pawn_contracts WHERE id = $1 AND tenant_id = $2 AND store_id = $3`,
        [dto.contractId, tenantId, storeId],
      );
      if (!contracts.length) throw new NotFoundException('Contract not found in your store');
      const contract = contracts[0];

      // Validate allowed statuses based on transaction type
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

      // Insert transaction (APPEND-ONLY)
      const txResult = await manager.query(
        `INSERT INTO contract_transactions (
          tenant_id, store_id, contract_id, transaction_type, amount,
          payment_method, transaction_date, note, reference_transaction_id, created_by, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
        RETURNING *`,
        [
          tenantId,
          storeId,
          dto.contractId,
          dto.transactionType,
          dto.amount,
          dto.paymentMethod,
          dto.transactionDate,
          dto.note ?? null,
          dto.referenceTransactionId ?? null,
          userId,
        ],
      );
      const tx = txResult[0];

      // If settlement, update contract and asset statuses
      if (dto.transactionType === TransactionType.SETTLEMENT) {
        await manager.query(
          `UPDATE pawn_contracts SET status = 'settled', updated_at = NOW(), updated_by = $1 WHERE id = $2 AND tenant_id = $3`,
          [userId, dto.contractId, tenantId],
        );
        await manager.query(
          `INSERT INTO contract_status_history (tenant_id, contract_id, status, changed_by, changed_at)
           VALUES ($1,$2,'settled',$3,NOW())`,
          [tenantId, dto.contractId, userId],
        );
        // Update all linked assets to 'redeemed'
        await manager.query(
          `UPDATE assets SET status = 'redeemed', updated_at = NOW()
           WHERE id IN (SELECT asset_id FROM contract_assets WHERE contract_id = $1 AND tenant_id = $2)
             AND tenant_id = $2`,
          [dto.contractId, tenantId],
        );
        await manager.query(
          `UPDATE asset_inventory SET returned_at = NOW(), status = 'returned'
           WHERE asset_id IN (SELECT asset_id FROM contract_assets WHERE contract_id = $1 AND tenant_id = $2)
             AND tenant_id = $2`,
          [dto.contractId, tenantId],
        );
      }

      const updatedContracts = await manager.query(
        `SELECT status FROM pawn_contracts WHERE id = $1`,
        [dto.contractId],
      );

      return { transaction: tx, contractStatus: updatedContracts[0]?.status };
    });
  }

  async calculateSettlement(
    tenantId: string,
    contractId: string,
    toDate: Date,
  ): Promise<any> {
    const contracts = await this.dataSource.query(
      `SELECT * FROM pawn_contracts WHERE id = $1 AND tenant_id = $2`,
      [contractId, tenantId],
    );
    if (!contracts.length) throw new NotFoundException('Contract not found');
    const contract = contracts[0];

    // Sum of previous interest/fee payments
    const paidResult = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid
       FROM contract_transactions
       WHERE contract_id = $1 AND tenant_id = $2
         AND transaction_type IN ('interest_collection','fee_collection')`,
      [contractId, tenantId],
    );
    const alreadyPaid = parseFloat(paidResult[0].total_paid);

    // Calculate interest
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
      case InterestType.TERM:
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
    return this.dataSource.transaction(async (manager) => {
      const contracts = await manager.query(
        `SELECT * FROM pawn_contracts WHERE id = $1 AND tenant_id = $2 AND store_id = $3`,
        [dto.contractId, tenantId, storeId],
      );
      if (!contracts.length) throw new NotFoundException('Contract not found in your store');
      const contract = contracts[0];

      if (!['active', 'near_due', 'overdue'].includes(contract.status)) {
        throw new BadRequestException('Contract cannot be extended in its current status');
      }

      const oldDueDate = contract.due_date;

      // Insert extension transaction
      const txResult = await manager.query(
        `INSERT INTO contract_transactions (
          tenant_id, store_id, contract_id, transaction_type, amount,
          payment_method, transaction_date, note, created_by, created_at
        ) VALUES ($1,$2,$3,'extension',$4,$5,NOW(),$6,$7,NOW())
        RETURNING *`,
        [
          tenantId,
          storeId,
          dto.contractId,
          dto.interestPaid,
          dto.paymentMethod,
          dto.note ?? null,
          userId,
        ],
      );

      // Insert contract_extensions record
      await manager.query(
        `INSERT INTO contract_extensions (
          tenant_id, contract_id, old_due_date, new_due_date,
          interest_paid_amount, fee_amount, created_by, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          tenantId,
          dto.contractId,
          oldDueDate,
          dto.newDueDate,
          dto.interestPaid,
          dto.feeAmount ?? 0,
          userId,
        ],
      );

      // Update contract
      await manager.query(
        `UPDATE pawn_contracts SET due_date = $1, status = 'extended', updated_at = NOW(), updated_by = $2
         WHERE id = $3 AND tenant_id = $4`,
        [dto.newDueDate, userId, dto.contractId, tenantId],
      );

      // Status history
      await manager.query(
        `INSERT INTO contract_status_history (tenant_id, contract_id, status, changed_by, changed_at)
         VALUES ($1,$2,'extended',$3,NOW())`,
        [tenantId, dto.contractId, userId],
      );

      return { transaction: txResult[0], newDueDate: dto.newDueDate };
    });
  }

  async voidTransaction(
    tenantId: string,
    id: string,
    userId: string,
    reason: string,
  ): Promise<any> {
    const transactions = await this.dataSource.query(
      `SELECT * FROM contract_transactions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (!transactions.length) throw new NotFoundException('Transaction not found');
    const original = transactions[0];

    if ([TransactionType.VOID, TransactionType.REVERSAL].includes(original.transaction_type)) {
      throw new BadRequestException('Cannot void a void or reversal transaction');
    }

    // Insert void transaction (APPEND-ONLY, amount = -original)
    const voidResult = await this.dataSource.query(
      `INSERT INTO contract_transactions (
        tenant_id, store_id, contract_id, transaction_type, amount,
        payment_method, transaction_date, note, reference_transaction_id, created_by, created_at
      ) VALUES ($1,$2,$3,'void',$4,$5,NOW(),$6,$7,$8,NOW())
      RETURNING *`,
      [
        tenantId,
        original.store_id,
        original.contract_id,
        -original.amount,
        original.payment_method,
        reason,
        id,
        userId,
      ],
    );

    return voidResult[0];
  }

  async getByContract(tenantId: string, contractId: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT * FROM contract_transactions
       WHERE contract_id = $1 AND tenant_id = $2
       ORDER BY transaction_date DESC, created_at DESC`,
      [contractId, tenantId],
    );
  }
}
