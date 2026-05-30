// Customer interfaces
export interface ICustomer {
  id: string;
  tenantId: string;
  fullName: string;
  phone?: string;
  identityNumber?: string;
  dateOfBirth?: string;
  permanentAddress?: string;
  currentAddress?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: string;
  createdAt: string;
}

export interface ICreateCustomerPayload {
  fullName: string;
  phone?: string;
  identityNumber?: string;
  dateOfBirth?: string;
  permanentAddress?: string;
  currentAddress?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface IUpdateCustomerPayload {
  fullName?: string;
  phone?: string;
  identityNumber?: string;
  dateOfBirth?: string;
  permanentAddress?: string;
  currentAddress?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export type CustomerStatus = 'active' | 'inactive';
