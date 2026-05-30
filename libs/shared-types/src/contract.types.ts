// Contract interfaces
export interface IContract {
  id: string;
  tenantId: string;
  storeId: string;
  customerId: string;
  contractCode: string;
  principalAmount: number;
  interestRate: number;
  interestType: string;
  startDate: string;
  dueDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  // Joined fields
  customerFullName?: string;
  customerPhone?: string;
  customerIdentityNumber?: string;
}

export interface ICreateContractPayload {
  storeId: string;
  customerId: string;
  assetIds: string[];
  principalAmount: number;
  interestRate: number;
  interestType: string;
  startDate: string;
  dueDate: string;
  note?: string;
}

export type ContractStatus =
  | 'draft'
  | 'active'
  | 'near_due'
  | 'overdue'
  | 'extended'
  | 'settled'
  | 'cancelled'
  | 'liquidation_pending'
  | 'liquidated';

export type InterestType = 'daily' | 'monthly' | 'per_term';
