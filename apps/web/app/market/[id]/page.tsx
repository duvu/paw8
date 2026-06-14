'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import type { PublicListing } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function PublicListingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tenantCode = searchParams.get('tenant') ?? '';

  const [listing, setListing] = useState<PublicListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inquiryForm, setInquiryForm] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios
      .get<PublicListing>(`${API_BASE}/marketplace/public/listings/${params.id}`)
      .then((res) => setListing(res.data))
      .catch(() => setError('Không tìm thấy tài sản này.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.buyerName.trim() || !inquiryForm.buyerPhone.trim() || !inquiryForm.message.trim()) {
      setInquiryError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSubmitting(true);
    setInquiryError('');
    try {
      await axios.post(`${API_BASE}/marketplace/public/listings/${params.id}/inquiries`, {
        buyerName: inquiryForm.buyerName.trim(),
        buyerPhone: inquiryForm.buyerPhone.trim(),
        buyerEmail: inquiryForm.buyerEmail.trim() || undefined,
        message: inquiryForm.message.trim(),
      });
      setSubmitted(true);
    } catch {
      setInquiryError('Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-neutral-700">{error || 'Không tìm thấy tài sản.'}</p>
          <Link href={tenantCode ? `/marketplace?tenant=${tenantCode}` : '/marketplace'} className="text-primary-600 text-sm mt-2 inline-block hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href={tenantCode ? `/marketplace?tenant=${tenantCode}` : '/marketplace'} className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 mb-6">
          ← Quay lại danh sách
        </Link>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-6">
          {listing.photos && listing.photos.length > 0 ? (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {listing.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Ảnh ${i + 1}`} className="h-48 w-auto rounded-lg object-cover shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <div className="h-48 bg-neutral-100 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}

          <div className="p-6">
            <h1 className="text-xl font-bold text-neutral-900">{listing.title}</h1>
            {listing.assetName && (
              <p className="text-sm text-neutral-500 mt-1">
                {listing.assetType} — {listing.brand} {listing.model}
              </p>
            )}
            <p className="text-2xl font-bold text-primary-600 mt-3">
              {Number(listing.listingPrice).toLocaleString('vi-VN')} ₫
            </p>
            {listing.description && (
              <p className="text-sm text-neutral-600 mt-4 whitespace-pre-line">{listing.description}</p>
            )}
            <p className="text-xs text-neutral-400 mt-4">
              Niêm yết ngày {new Date(listing.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-base font-semibold text-neutral-900 mb-4">Liên hệ tư vấn</h2>

          {submitted ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Yêu cầu của bạn đã được ghi nhận. Cửa hàng sẽ liên hệ sớm.
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-3">
              {inquiryError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {inquiryError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={inquiryForm.buyerName}
                    onChange={(e) => setInquiryForm((p) => ({ ...p, buyerName: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={inquiryForm.buyerPhone}
                    onChange={(e) => setInquiryForm((p) => ({ ...p, buyerPhone: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0912345678"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
                <input
                  type="email"
                  value={inquiryForm.buyerEmail}
                  onChange={(e) => setInquiryForm((p) => ({ ...p, buyerEmail: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Tin nhắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm((p) => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tôi quan tâm đến tài sản này..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
