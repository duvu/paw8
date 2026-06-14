import axios from 'axios';
import {
  clearStoredSession,
  getStoredAccessToken,
  setSessionNotice,
} from '@/lib/auth-storage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url = typeof err.config?.url === 'string' ? err.config.url : '';
      const isPublicAuthRequest =
        url.includes('/auth/login') || url.includes('/auth/refresh');

      if (!isPublicAuthRequest && getStoredAccessToken()) {
        setSessionNotice('expired');
        clearStoredSession();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Marketplace API helpers ───────────────────────────────────────────────

export interface MarketplaceListing {
  id: string;
  tenantId: string;
  storeId: string;
  assetId: string;
  contractId?: string;
  listingPrice: number;
  status: 'draft' | 'active' | 'sold' | 'cancelled';
  title: string;
  description?: string;
  createdBy: string;
  soldAt?: string;
  soldPrice?: number;
  buyerName?: string;
  buyerPhone?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingPayload {
  assetId: string;
  contractId?: string;
  storeId?: string;
  listingPrice: number;
  title: string;
  description?: string;
}

export interface UpdateListingPayload {
  listingPrice?: number;
  title?: string;
  description?: string;
}

export interface SellListingPayload {
  soldPrice: number;
  buyerName: string;
  buyerPhone: string;
  buyerIdNumber?: string;
  paymentMethod: 'cash' | 'transfer' | 'other';
  note?: string;
}

export interface ListingsResponse {
  items: MarketplaceListing[];
  total: number;
}

export interface BuyerInquiry {
  id: string;
  tenantId: string;
  listingId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  message: string;
  createdAt: string;
}

export interface PublicListing {
  id: string;
  listingPrice: number;
  title: string;
  description?: string;
  photos?: string[];
  assetType?: string;
  assetName?: string;
  brand?: string;
  model?: string;
  createdAt: string;
}

export interface PublicListingsResponse {
  items: PublicListing[];
  total: number;
}

// Authenticated marketplace endpoints
export const marketplaceApi = {
  getListings: (params?: {
    status?: string;
    storeId?: string;
    page?: number;
    limit?: number;
  }) => api.get<ListingsResponse>('/marketplace/listings', { params }),

  getListing: (id: string) =>
    api.get<MarketplaceListing>(`/marketplace/listings/${id}`),

  createListing: (data: CreateListingPayload) =>
    api.post<MarketplaceListing>('/marketplace/listings', data),

  updateListing: (id: string, data: UpdateListingPayload) =>
    api.patch<MarketplaceListing>(`/marketplace/listings/${id}`, data),

  publishListing: (id: string) =>
    api.patch<MarketplaceListing>(`/marketplace/listings/${id}/publish`),

  cancelListing: (id: string) =>
    api.patch<MarketplaceListing>(`/marketplace/listings/${id}/cancel`),

  executeSale: (id: string, data: SellListingPayload) =>
    api.post<MarketplaceListing>(`/marketplace/listings/${id}/sell`, data),

  getInquiries: (listingId: string) =>
    api.get<BuyerInquiry[]>(`/marketplace/listings/${listingId}/inquiries`),
};

// Public marketplace endpoints (no auth, uses tenantCode query param)
export const publicMarketplaceApi = {
  getListings: (tenantCode: string, params?: { page?: number; limit?: number; q?: string }) =>
    axios.get<PublicListingsResponse>(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/marketplace/public/listings`,
      { params: { tenant: tenantCode, ...params } }
    ),

  getListing: (id: string) =>
    axios.get<PublicListing>(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/marketplace/public/listings/${id}`
    ),

  submitInquiry: (
    listingId: string,
    data: { buyerName: string; buyerPhone: string; buyerEmail?: string; message: string }
  ) =>
    axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/marketplace/public/listings/${listingId}/inquiries`,
      data
    ),
};

