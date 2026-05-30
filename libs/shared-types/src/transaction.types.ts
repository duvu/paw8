// Transaction interfaces
export interface ITransaction {
  id: string;
  tenantId: string;
  storeId: string;
  contractId: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface IRecordTransactionPayload {
  contractId: string;
  storeId: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  transactionDate?: string;
  note?: string;
}

export interface IExtendContractPayload {
  contractId: string;
  storeId: string;
  newDueDate: string;
  interestPaidAmount: number;
  feeAmount?: number;
  paymentMethod: string;
  note?: string;
}

export interface ISettlementCalc {
  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  totalAmount: number;
  daysOverdue: number;
}

export type TransactionType =
  | 'disbursement'
  | 'interest_collection'
  | 'fee_collection'
  | 'principal_partial'
  | 'settlement'
  | 'extension'
  | 'adjustment'
  | 'void'
  | 'reversal';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';
