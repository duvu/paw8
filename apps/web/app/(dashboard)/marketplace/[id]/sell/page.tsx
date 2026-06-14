'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { marketplaceApi } from '@/lib/api';
import {
  Button,
  Input,
  Alert,
  PageHeader,
} from '@/components/ui';

export default function SellListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    soldPrice: '',
    buyerName: '',
    buyerPhone: '',
    buyerIdNumber: '',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'other',
    note: '',
  });

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.soldPrice);
    if (!price || price <= 0) {
      setError('Giá bán phải lớn hơn 0.');
      return;
    }
    if (!form.buyerName.trim() || !form.buyerPhone.trim()) {
      setError('Vui lòng điền đầy đủ thông tin người mua.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await marketplaceApi.executeSale(params.id, {
        soldPrice: price,
        buyerName: form.buyerName.trim(),
        buyerPhone: form.buyerPhone.trim(),
        buyerIdNumber: form.buyerIdNumber.trim() || undefined,
        paymentMethod: form.paymentMethod,
        note: form.note.trim() || undefined,
      });
      router.push(`/marketplace/${params.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Không thể thực hiện bán tài sản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        title="Xác nhận bán tài sản"
        subtitle="Giao dịch thanh lý sẽ được ghi nhận và hợp đồng sẽ được đóng."
      />

      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Giá bán thực tế (VND) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={1}
            value={form.soldPrice}
            onChange={(e) => handleChange('soldPrice', e.target.value)}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Họ tên người mua <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.buyerName}
            onChange={(e) => handleChange('buyerName', e.target.value)}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Số điện thoại người mua <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.buyerPhone}
            onChange={(e) => handleChange('buyerPhone', e.target.value)}
            placeholder="0912345678"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Số CCCD/CMND người mua
          </label>
          <Input
            value={form.buyerIdNumber}
            onChange={(e) => handleChange('buyerIdNumber', e.target.value)}
            placeholder="012345678901"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Phương thức thanh toán <span className="text-red-500">*</span>
          </label>
          <select
            value={form.paymentMethod}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="cash">Tiền mặt</option>
            <option value="transfer">Chuyển khoản</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Ghi chú
          </label>
          <textarea
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="Ghi chú thêm..."
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Đang xử lý...' : 'Xác nhận bán'}
          </Button>
        </div>
      </form>
    </div>
  );
}
