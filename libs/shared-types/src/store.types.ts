// Store interfaces
export interface IStore {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  managerUserId?: string;
  status: string;
  createdAt: string;
}

export interface ICreateStorePayload {
  name: string;
  address?: string;
  phone?: string;
}

export interface IUpdateStorePayload {
  name?: string;
  address?: string;
  phone?: string;
}

export type StoreStatus = 'active' | 'inactive';
