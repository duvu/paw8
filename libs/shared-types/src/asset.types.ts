// Asset interfaces
export interface IAsset {
  id: string;
  tenantId: string;
  storeId: string;
  assetType: string;
  assetName: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  imei?: string;
  licensePlate?: string;
  chassisNumber?: string;
  engineNumber?: string;
  conditionDescription?: string;
  valuationAmount?: number;
  proposedLoanAmount?: number;
  status: string;
  createdAt: string;
}

export interface ICreateAssetPayload {
  assetType: string;
  assetName: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  imei?: string;
  licensePlate?: string;
  chassisNumber?: string;
  engineNumber?: string;
  conditionDescription?: string;
  valuationAmount?: number;
  proposedLoanAmount?: number;
  locationCode?: string;
  locationNote?: string;
}

export type AssetStatus = 'holding' | 'redeemed' | 'overdue' | 'pending_liquidation' | 'liquidated';
export type AssetType = 'motorbike' | 'car' | 'phone' | 'laptop' | 'watch' | 'gold_jewelry' | 'electronics' | 'other';
