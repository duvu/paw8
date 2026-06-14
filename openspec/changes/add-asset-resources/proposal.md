## Why

Ứng dụng đã có customer, contract, transaction, và file workflows trong định hướng MVP1, nhưng phần asset vẫn chưa được đặc tả và gom thành một change hoàn chỉnh để triển khai nhất quán. Cần bổ sung asset resources ngay bây giờ để hoàn thiện chuỗi nghiệp vụ cốt lõi `customer -> asset -> contract -> transaction` của hệ thống cầm đồ multi-tenant.

## What Changes

- Thêm backend asset resources cho tạo mới, cập nhật, tra cứu, xem chi tiết, và đổi trạng thái tài sản theo tenant/store scope.
- Thêm inventory-facing asset views để biết tài sản đang được giữ ở đâu, thuộc store nào, và đang ở trạng thái nào.
- Chuẩn hóa asset request/response contracts để web/mobile có thể dùng chung cho luồng tạo hợp đồng, lookup tài sản, và kiểm kê.
- Gắn các rule multi-tenant, store-scope, và append-only business constraints liên quan đến asset lifecycle vào capability spec thay vì chỉ để trong docs tổng quan.

## Capabilities

### New Capabilities
- `asset-management`: CRUD, search, detail, và status management cho tài sản cầm cố theo tenant/store scope.
- `asset-inventory`: inventory view và location tracking cho tài sản đang giữ hoặc đã trả.

### Modified Capabilities
- None.

## Impact

- Affected code: `apps/api-gateway/`, `libs/assets/`, có thể bao gồm `libs/contracts/`, `libs/files/`, và shared auth/scope helpers trong `libs/common/`.
- Affected APIs: `/assets`, `/assets/:id`, `/assets/:id/status`, `/assets/inventory`.
- Affected clients: `apps/web/` và `apps/mobile/` cho asset lookup, contract creation, và inventory views.
- Affected docs: asset-related sections trong requirements, API reference, và architecture/docs sync nếu contract thay đổi.
