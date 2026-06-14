'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { marketplaceApi } from '@/lib/api';
import {
  Button,
  Input,
  Alert,
  PageHeader,
} from '@/components/ui';

export default function NewListingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    assetId: '',
    contractId: '',
    listingPrice: '',
    title: '',
    description: '',
  });

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetId.trim() || !form.title.trim() || !form.listingPrice) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await marketplaceApi.createListing({
        assetId: form.assetId.trim(),
        contractId: form.contractId.trim() || undefined,
        listingPrice: Number(form.listingPrice),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
      });
      router.push(`/marketplace/${res.data.id}`);
    } catch {
      setError('Không thể tạo niêm yết.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        title="Niêm yết tài sản mới"
        subtitle="Điền thông tin để đăng tài sản lên sàn giao dịch."
      />

      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            ID tài sản <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.assetId}
            onChange={(e) => handleChange('assetId', e.target.value)}
            placeholder="UUID tài sản"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            ID hợp đồng
          </label>
          <Input
            value={form.contractId}
            onChange={(e) => handleChange('contractId', e.target.value)}
            placeholder="UUID hợp đồng (nếu có)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Tiêu đề niêm yết <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="VD: Honda Wave RSX 2020 — màu đỏ đen"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Giá niêm yết (VND) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={1}
            value={form.listingPrice}
            onChange={(e) => handleChange('listingPrice', e.target.value)}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Mô tả
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Mô tả tình trạng, lý do thanh lý..."
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Đang tạo...' : 'Tạo niêm yết'}
          </Button>
        </div>
      </form>
    </div>
  );
}
