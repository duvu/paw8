## Context

`paw8` được thiết kế theo luồng nghiệp vụ cốt lõi `customer -> asset -> contract -> transaction`, nhưng asset layer cần được gom thành một change rõ ràng để triển khai đồng bộ giữa API, web/mobile clients, và inventory behavior. Hệ thống là multi-tenant SaaS với shared-schema PostgreSQL, store scope là lớp giới hạn thứ hai sau tenant scope, và file uploads đi qua MinIO với permission checks ở backend.

Asset resources không chỉ là CRUD đơn giản. Chúng cần phục vụ ít nhất ba luồng: tạo tài sản trước khi lập hợp đồng, tra cứu tài sản đang được giữ, và cập nhật trạng thái/lưu kho khi hợp đồng thay đổi. Thiết kế cũng phải tôn trọng các current-state caveats đã được tài liệu hóa: tenant/store guard wiring chưa chứng minh đầy đủ, một số enum/column names giữa migrations và runtime chưa đồng nhất, và client/backend contracts vẫn cần sync chặt chẽ.

## Goals / Non-Goals

**Goals:**
- Xác định một capability spec đầy đủ cho asset management và asset inventory của MVP1.
- Chuẩn hóa asset APIs để backend, web, và mobile có cùng contract làm việc.
- Đảm bảo asset workflows luôn tenant-aware và store-aware.
- Ràng buộc rõ asset lifecycle với contract creation, settlement, và inventory visibility.

**Non-Goals:**
- Không giải quyết toàn bộ mismatch runtime/migration trong change này.
- Không thiết kế asset liquidation nâng cao ngoài phạm vi MVP1.
- Không bổ sung OCR, định giá AI, hoặc offline-first mobile flows.
- Không tái thiết kế toàn bộ contracts hoặc files modules ngoài các điểm tích hợp cần thiết.

## Decisions

### 1. Tách capability thành `asset-management` và `asset-inventory`

Asset CRUD/search/status và inventory/location tracking liên quan chặt chẽ nhưng không hoàn toàn giống nhau. Tách thành hai capability giúp sau này có thể implement hoặc verify theo từng concern mà vẫn giữ cùng change umbrella.

**Alternative considered:** gộp tất cả vào một capability `assets`.

**Why not:** spec đó sẽ quá rộng, khó test, và dễ trộn lẫn API behavior với operational inventory rules.

### 2. Dùng asset resource như một tenant/store-scoped application service

Create/update/search/detail/status flows phải derive tenant context từ auth context thay vì nhận `tenant_id` từ client. `store_id` chỉ được dùng như business filter/input hợp lệ sau khi xác minh thuộc `allowedStoreIds`.

**Alternative considered:** cho client truyền đầy đủ tenant/store identifiers và kiểm tra nhẹ ở controller.

**Why not:** trái với kiến trúc multi-tenant bắt buộc của repo và làm tăng rủi ro cross-tenant leakage.

### 3. Xem inventory là projection của asset possession state, không phải subsystem tách biệt

Inventory API nên trả lời câu hỏi “tài sản đang ở đâu và đang được giữ hay đã trả” dựa trên asset + inventory persistence hiện có, thay vì tạo một workflow song song không gắn với contract lifecycle.

**Alternative considered:** xem inventory như module riêng với quy trình cập nhật thủ công.

**Why not:** tăng drift giữa contract settlement/redeem flows và vị trí tài sản thực tế.

### 4. Chuẩn hóa API contract trước khi coding

Spec phải chốt rõ các endpoint `/assets`, `/assets/:id`, `/assets/:id/status`, `/assets/inventory`, các filters chính, và behavior status transitions để web/mobile không phải tự suy diễn.

**Alternative considered:** để contract chi tiết cho implementation phase.

**Why not:** repo hiện đã có nhiều current-state mismatches; thiếu contract rõ từ đầu sẽ lặp lại drift.

## Risks / Trade-offs

- **[Guard wiring chưa đầy đủ]** → Mitigation: spec ghi rõ tenant/store enforcement ở mọi flow để implementation phase có checklist rõ ràng.
- **[Mismatch enum giữa migration và runtime]** → Mitigation: dùng spec ở mức behavior/business wording; implementation phải chọn một source of truth rõ khi code.
- **[Scope lan sang contracts/files]** → Mitigation: chỉ mô tả integration points tối thiểu cần thiết cho asset lifecycle.
- **[Client/backend drift tiếp diễn]** → Mitigation: spec hóa request/response expectations và endpoint names trước khi implement.

## Migration Plan

1. Hoàn tất proposal, design, specs, tasks cho asset resources.
2. Trong implementation phase, thêm/chuẩn hóa backend asset module behavior trước.
3. Sau đó sync web/mobile consumers theo contract đã được chốt.
4. Cuối cùng cập nhật docs liên quan nếu runtime contract khác docs hiện tại.

Rollback: vì đây là change proposal, chưa có runtime migration nào ở bước này. Nếu implementation sau này gây lỗi, rollback theo từng module/API change và giữ nguyên schema source of truth trong migrations.

## Open Questions

- Có cần tách rõ status vocabulary business-level khỏi runtime enum mismatch ngay trong implementation đầu tiên không?
- Inventory location fields hiện nên bắt buộc ở mọi asset đang giữ hay chỉ với các store vận hành kho vật lý?
- Asset search ở mobile có cần subset response riêng hay có thể dùng cùng contract với web?
