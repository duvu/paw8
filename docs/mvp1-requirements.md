# Đặc tả MVP1 hiện trạng — paw8

## 1. Mục đích tài liệu

Tài liệu này là bản **viết lại hoàn toàn** cho MVP1 của `paw8`, nhằm thay thế bản đặc tả planning-era trước đây bằng một tài liệu:

- phản ánh đúng mục tiêu sản phẩm cốt lõi,
- bám sát kiến trúc và tài liệu hiện có trong repo,
- phân biệt rõ **đã triển khai**, **yêu cầu bắt buộc**, và **khoảng trống hiện trạng**.

Tài liệu này không chỉ mô tả “nên xây gì”, mà còn mô tả **MVP1 hiện được repo hướng tới và phần lớn đã hiện diện ở mức code/doc**.

---

## 2. Trạng thái và nguồn sự thật

### 2.1 Trạng thái tài liệu

Repo không còn ở trạng thái “chỉ planning”. Theo [README](file:///home/beou/IdeaProjects/paw8/README.md), hệ thống hiện có:

- API NestJS trong `apps/api-gateway/`
- Web portal Next.js trong `apps/web/`
- Mobile app Flutter trong `apps/mobile/`
- PostgreSQL migrations và seed data
- MinIO integration cho upload/download file
- i18n cho `vi`, `en`, `zh`

Vì vậy, tài liệu này được viết theo hướng **current-state specification**: vừa là đặc tả sản phẩm/kỹ thuật, vừa là bản chuẩn hóa hiện trạng cần duy trì.

### 2.2 Nguồn tham chiếu chính

Khi có mâu thuẫn, ưu tiên tham chiếu theo thứ tự:

1. [README](file:///home/beou/IdeaProjects/paw8/README.md)
2. [ARCHITECTURE.md](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md)
3. [docs/database-schema.md](file:///home/beou/IdeaProjects/paw8/docs/database-schema.md)
4. [docs/api-reference.md](file:///home/beou/IdeaProjects/paw8/docs/api-reference.md)
5. Migrations trong `apps/api-gateway/src/database/migrations/`

### 2.3 Ý nghĩa của tài liệu này

Tài liệu này dùng để:

- thống nhất business scope MVP1,
- giữ đúng nguyên tắc multi-tenant,
- làm baseline cho QA, docs, OpenSpec, và các thay đổi tiếp theo,
- chỉ rõ những chỗ hiện tại đang lệch giữa ý định thiết kế và code/runtime.

---

## 3. Tóm tắt sản phẩm

`paw8` là nền tảng quản lý cửa hàng cầm đồ theo mô hình **multi-tenant SaaS**, hỗ trợ một cửa hàng đơn lẻ hoặc chuỗi cửa hàng.

### 3.1 Mục tiêu MVP1

MVP1 phải cho phép một tenant vận hành nghiệp vụ cầm đồ lõi:

- quản lý tenant, store, user, role và store assignment,
- quản lý khách hàng và giấy tờ,
- quản lý tài sản cầm cố và vị trí lưu kho,
- tạo và theo dõi hợp đồng cầm đồ,
- ghi nhận giải ngân, thu lãi/phí, gia hạn, tất toán, void,
- quản lý file bằng MinIO private bucket,
- cung cấp dashboard, báo cáo cơ bản, audit log,
- đảm bảo tenant isolation ngay từ ngày đầu.

### 3.2 Giá trị cốt lõi

- Một codebase dùng được cho nhiều tenant.
- Dữ liệu được cô lập theo tenant và tiếp tục giới hạn theo store.
- Nghiệp vụ tài chính theo hướng append-only.
- Hệ thống đủ nhỏ để vận hành như modular monolith, nhưng biên domain phải đủ rõ để tách sau này.

---

## 4. Phạm vi hệ thống MVP1

## 4.1 Thành phần triển khai

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L5-L15), hệ thống gồm:

| Thành phần | Vị trí | Vai trò |
| --- | --- | --- |
| API Gateway | `apps/api-gateway/` | Auth, validation, tenant-aware APIs, business orchestration |
| Web Portal | `apps/web/` | Giao diện cho admin, manager, staff |
| Mobile App | `apps/mobile/` | Ứng dụng nhẹ cho nhân viên cửa hàng |
| Domain libs | `libs/*` | Chia domain theo trách nhiệm nghiệp vụ |
| PostgreSQL | runtime DB | Shared-schema multi-tenant data store |
| MinIO | object storage | Private file storage với presigned URLs |

## 4.2 Stack kỹ thuật

Theo [README](file:///home/beou/IdeaProjects/paw8/README.md#L23-L31):

- **API**: NestJS 11, TypeORM, PostgreSQL, `nestjs-i18n`
- **Web**: Next.js 16 App Router, React 19, `next-intl`, Axios
- **Mobile**: Flutter, Riverpod, Dio, GoRouter, Flutter Secure Storage
- **Database**: PostgreSQL 16
- **Storage**: MinIO
- **Auth**: RS256 JWT access token + hashed refresh token
- **Tooling**: pnpm workspaces, Docker Compose, Bun-based agent tooling

---

## 5. Nguyên tắc kiến trúc bắt buộc

## 5.1 Tenant là scope cao nhất

Mọi domain nghiệp vụ đều nằm dưới một `tenant`.

```text
Tenant
 └── Store
      ├── Users
      ├── Customers
      ├── Assets
      ├── Contracts
      ├── Transactions
      ├── Files
      └── Reports
```

Store là chi nhánh của tenant, không phải root scope.

## 5.2 Backend không tin `tenant_id` từ client

Tenant context phải được suy ra từ user đã xác thực:

- JWT payload
- current user context
- allowed store assignments

Không được tin trực tiếp `tenant_id` hoặc `store_id` do frontend/mobile tự khai báo như một authority source.

## 5.3 Mọi truy vấn nghiệp vụ phải tenant-scoped

Mọi read/write liên quan dữ liệu nghiệp vụ phải lọc hoặc gắn `tenant_id` đúng.

Ví dụ đúng:

```sql
SELECT *
FROM pawn_contracts
WHERE id = :id
  AND tenant_id = :currentTenantId;
```

## 5.4 Store scope là lớp bảo vệ thứ hai

Với dữ liệu gắn với cửa hàng, ngoài `tenant_id` còn phải giới hạn theo `store_id` thuộc `currentUser.allowedStoreIds`.

## 5.5 File access phải tenant-aware và permission-aware

Không được phát presigned URL chỉ dựa trên `file_id`.

Backend phải kiểm tra:

- file thuộc tenant của user,
- entity cha thuộc tenant của user,
- nếu entity/store-scoped thì user phải có quyền trong store đó.

## 5.6 Giao dịch tài chính là append-only

Đã ghi nhận giao dịch tài chính thì không sửa/xóa trực tiếp. Cách sửa sai hợp lệ là:

- `void`
- `reversal`
- `adjustment`

## 5.7 API versioning từ ngày đầu

Base path mặc định là `/api/v1` theo [API Reference](file:///home/beou/IdeaProjects/paw8/docs/api-reference.md#L5-L13).

---

## 6. Domain modules và trách nhiệm

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L38-L53), ranh giới domain hiện tại là:

| Module | Trách nhiệm |
| --- | --- |
| `auth` | login, refresh, logout, change password, JWT validation |
| `tenants` | tenant CRUD và status management cho platform admin |
| `stores` | store CRUD, status change, manager assignment |
| `users` | tenant users, role assignment, store assignment |
| `customers` | customer profile và contract history lookup |
| `assets` | tài sản cầm cố và inventory location |
| `contracts` | contract creation, status transition, due-date views, contract code generation |
| `transactions` | disbursement, collection, extension, settlement, void |
| `files` | MinIO presigned URL + file metadata |
| `reports` | dashboard metrics và báo cáo vận hành |
| `audit` | audit log query API và audit service |
| `common` | guards, decorators, filter, interceptor, current-user helpers |

Yêu cầu bắt buộc: không trộn business logic cốt lõi lung tung qua nhiều module; orchestration được phép ở service layer nhưng ownership của rule phải rõ.

---

## 7. Vai trò và phân quyền MVP1

| Role | Phạm vi | Quyền chính |
| --- | --- | --- |
| Platform Admin | Toàn hệ thống | Quản lý tenant, trạng thái tenant, overview vận hành hệ thống |
| Tenant Owner | Một tenant | Toàn quyền trong tenant |
| Tenant Admin | Một tenant | Quản lý user, store, cấu hình tenant, xem báo cáo |
| Store Manager | Một hoặc nhiều store | Quản lý vận hành store, theo dõi hợp đồng, tài sản, thu hồi nợ |
| Staff | Một hoặc nhiều store được gán | Tạo khách hàng, tài sản, hợp đồng, thu tiền cơ bản |
| Accountant | Tenant hoặc store scope | Theo dõi giao dịch, báo cáo, đối soát |

### 7.1 Nguyên tắc phân quyền

- `platform_admin` không mặc định là role để xem dữ liệu nhạy cảm tenant nếu không có luồng nghiệp vụ cần thiết.
- `tenant_owner` và `tenant_admin` có full tenant scope.
- `store_manager`, `staff`, `accountant` phải bị giới hạn thêm bởi allowed stores.
- Endpoint không có role metadata rõ ràng phải được xem là điểm cần rà soát, không phải là “miễn kiểm soát”.

---

## 8. Phạm vi chức năng MVP1

## 8.1 Tenant management

### Mục tiêu

Cho phép platform vận hành nhiều tenant trong cùng hệ thống.

### Năng lực chính

- tạo tenant,
- cập nhật tenant,
- đổi trạng thái tenant,
- thiết lập quota cơ bản,
- gắn tenant owner.

### Dữ liệu cốt lõi

- `name`
- `code`
- `status`
- `plan`
- `maxStores`
- `maxUsers`
- `trialEndDate`

### Phạm vi MVP1

- không có self-service signup,
- platform admin tạo tenant thủ công,
- chưa bao gồm billing/subscription hoàn chỉnh.

## 8.2 Store management

### Mục tiêu

Quản lý nhiều chi nhánh trong cùng một tenant.

### Năng lực chính

- tạo store,
- cập nhật store,
- khóa/mở store,
- gán manager,
- dùng `store.code` trong contract code generation.

### Dữ liệu cốt lõi

- `name`
- `code`
- `address`
- `phone`
- `managerUserId`
- `status`

## 8.3 User và RBAC

### Mục tiêu

Quản lý user theo tenant và store scope.

### Năng lực chính

- login,
- refresh token,
- logout,
- change password,
- tạo user,
- cập nhật user,
- khóa/mở user,
- gán role,
- gán store assignments.

### Quy tắc

- một user business của MVP1 thuộc một tenant,
- platform admin có thể có `tenant_id = NULL`,
- store access phải được materialize qua `user_store_assignments`.

## 8.4 Customer management

### Mục tiêu

Quản lý hồ sơ khách hàng trong phạm vi tenant.

### Năng lực chính

- tạo khách hàng,
- cập nhật khách hàng,
- tìm kiếm theo tên, số điện thoại, CCCD/giấy tờ,
- xem lịch sử hợp đồng của khách hàng,
- cảnh báo trùng phone/identity trong cùng tenant,
- gắn giấy tờ và ảnh nhận diện.

### Dữ liệu cốt lõi

- `full_name`
- `phone`
- `identity_number`
- `date_of_birth`
- `permanent_address`
- `current_address`
- `occupation`
- `emergency_contact_name`
- `emergency_contact_phone`
- `notes`

### Quy tắc unique

Không dùng unique global cho danh tính khách hàng. Phải tenant-scoped:

```sql
UNIQUE (tenant_id, identity_number)
UNIQUE (tenant_id, phone)
```

## 8.5 Asset management

### Mục tiêu

Quản lý tài sản cầm cố và trạng thái lưu giữ.

### Nhóm tài sản

- xe máy
- ô tô
- điện thoại
- laptop
- đồng hồ
- vàng/trang sức
- điện tử khác
- khác

### Năng lực chính

- tạo tài sản,
- cập nhật tài sản,
- tra cứu theo serial/IMEI/biển số,
- gắn tài sản vào hợp đồng,
- cập nhật trạng thái tài sản,
- theo dõi vị trí lưu kho.

### Dữ liệu cốt lõi

- `asset_type`
- `asset_name`
- `brand`
- `model`
- `color`
- `serial_number`
- `imei`
- `license_plate`
- `chassis_number`
- `engine_number`
- `condition_description`
- `valuation_amount`
- `proposed_loan_amount`
- `status`
- `store_id`

## 8.6 Asset inventory

### Mục tiêu

Biết tài sản nào đang được giữ ở đâu.

### Năng lực chính

- liệt kê tài sản đang giữ,
- lưu vị trí (`location_code`, `location_note`),
- lưu thời điểm nhận/trả,
- phục vụ tra cứu vật lý và đối soát.

## 8.7 Contract management

### Mục tiêu

Quản lý hợp đồng cầm đồ từ tạo mới đến đóng vòng đời.

### Năng lực chính

- tạo hợp đồng,
- sinh `contract_code`,
- xem danh sách và chi tiết,
- sửa thông tin hạn chế trước khi có transaction,
- đổi trạng thái có kiểm soát,
- xem upcoming due / overdue,
- lưu status history.

### Dữ liệu cốt lõi

- `tenant_id`
- `store_id`
- `customer_id`
- `contract_code`
- `principal_amount`
- `interest_rate`
- `interest_type`
- `start_date`
- `due_date`
- `status`
- `created_by`

### Loại lãi

Mức đặc tả business mong muốn:

- theo ngày,
- theo tháng,
- theo kỳ.

Lưu ý: tên enum hiện tại giữa docs/migrations/runtime có chỗ chưa đồng nhất, xem mục “Khoảng trống hiện trạng”.

### Quy tắc mã hợp đồng

Contract code không dùng global sequence kiểu `HD000001`.

Mẫu đang được định hướng trong code/doc:

```text
{store_code}-{YYYYMM}-{seq}
```

Ví dụ:

```text
HN01-202605-00001
```

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L109-L117), việc sinh mã dùng `contract_sequences` kết hợp advisory lock.

## 8.8 Transaction management

### Mục tiêu

Ghi nhận đầy đủ dòng tiền liên quan hợp đồng.

### Năng lực chính

- giải ngân,
- thu lãi,
- thu phí,
- thu gốc một phần,
- tất toán,
- gia hạn,
- void,
- adjustment/reversal.

### Trường bắt buộc mức business

- `tenant_id`
- `store_id`
- `contract_id`
- `transaction_type`
- `amount`
- `payment_method`
- `created_by`
- `created_at`

### Quy tắc

- không update/delete trực tiếp transaction đã ghi nhận,
- mọi correction phải để lại một row mới,
- settlement và extension có thể kéo theo update contract status, asset status, inventory, status history.

## 8.9 Extension workflow

### Mục tiêu

Gia hạn hợp đồng mà vẫn giữ được lịch sử rõ ràng.

### Năng lực chính

- tính lãi/phí cần thu trước khi gia hạn,
- lưu ngày đến hạn cũ và mới,
- ghi transaction liên quan,
- lưu `contract_extensions`.

## 8.10 Settlement / redeem workflow

### Mục tiêu

Đóng hợp đồng và trả tài sản cho khách.

### Năng lực chính

- tính số tiền cần trả,
- ghi nhận settlement transaction,
- cập nhật contract sang `settled`,
- cập nhật asset/inventory theo luồng trả tài sản.

## 8.11 Overdue management

### Mục tiêu

Theo dõi hợp đồng sắp đến hạn và quá hạn.

### Năng lực chính

- danh sách sắp đến hạn,
- danh sách quá hạn,
- số ngày quá hạn,
- số tiền tạm tính,
- hỗ trợ nhắc nợ và hành động tiếp theo.

## 8.12 Files

### Mục tiêu

Quản lý upload/download file theo cơ chế direct-to-MinIO nhưng vẫn giữ quyền kiểm soát ở backend.

### Năng lực chính

- cấp presigned upload URL,
- confirm upload,
- lưu file metadata,
- cấp download URL có hạn ngắn,
- liệt kê file theo entity,
- xóa file có quyền.

### Entity types hiện có trong API docs

- `customer`
- `asset`
- `contract`
- `receipt`

## 8.13 Reports và dashboard

### Mục tiêu

Cung cấp view vận hành cơ bản cho tenant và store.

### Chỉ số kỳ vọng

- số hợp đồng active,
- tổng dư nợ,
- tổng giải ngân,
- tổng thu,
- tổng lãi đã thu,
- số hợp đồng near due,
- số hợp đồng overdue,
- số tài sản đang giữ.

### Bộ lọc kỳ vọng

- tenant
- store
- thời gian
- trạng thái hợp đồng
- nhân viên
- loại tài sản

## 8.14 Audit log

### Mục tiêu

Lưu vết thao tác quan trọng để đối soát nghiệp vụ, điều tra sự cố và truy trách nhiệm.

### Sự kiện mong muốn ở MVP1

- login thành công/thất bại,
- logout,
- change password,
- tạo/cập nhật customer,
- upload/delete file,
- tạo/cập nhật hợp đồng,
- đổi trạng thái hợp đồng,
- ghi nhận transaction,
- void/reversal/adjustment,
- thay đổi trạng thái tài sản.

### Dữ liệu cốt lõi

- `tenant_id`
- `store_id`
- `user_id`
- `action`
- `entity_type`
- `entity_id`
- `old_value`
- `new_value`
- `ip_address`
- `user_agent`
- `created_at`

---

## 9. Màn hình và bề mặt sử dụng

## 9.1 Web portal

### Platform Admin

- login
- tenant list/detail
- create/update tenant
- change tenant status
- tenant quota/license overview

### Tenant Admin / Tenant Owner

- dashboard
- stores
- users
- role/store assignments
- tenant settings
- customers
- assets
- contracts
- reports
- audit log

### Store Manager

- store dashboard
- customer lookup
- contract list/detail
- due-soon / overdue lists
- inventory
- collection overview

### Staff

- customer search/create
- asset create/update
- contract create/detail
- thu lãi/phí
- gia hạn
- tất toán
- file upload

## 9.2 Mobile app

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L9-L15) và [README](file:///home/beou/IdeaProjects/paw8/README.md#L16-L21), mobile được giữ nhẹ, tập trung cho nhân viên:

- login
- tra cứu customer
- tra cứu contract
- due soon / overdue lists
- notes
- chụp và upload ảnh/giấy tờ

Không phải mục tiêu MVP1 mobile:

- tenant management
- role administration
- báo cáo phức tạp
- offline mode đầy đủ

---

## 10. API conventions và các route chính

Theo [API Reference](file:///home/beou/IdeaProjects/paw8/docs/api-reference.md):

- Base URL: `/api/v1`
- Local default: `http://localhost:3000/api/v1`
- Auth: bearer JWT
- Validation: whitelist, reject unknown fields, implicit conversion enabled
- Error localization: hỗ trợ qua `nestjs-i18n`

### 10.1 Nhóm endpoint chính

- `/auth/*`
- `/tenants`
- `/stores`
- `/users`
- `/customers`
- `/assets`
- `/contracts`
- `/transactions`
- `/files`
- `/reports/*`
- `/audit/logs`

### 10.2 Luồng API quan trọng

#### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/change-password`

#### Contracts

- `POST /contracts`
- `GET /contracts`
- `GET /contracts/:id`
- `GET /contracts/upcoming-due`
- `GET /contracts/overdue`
- `PATCH /contracts/:id`
- `PATCH /contracts/:id/status`

#### Transactions

- `POST /transactions`
- `GET /transactions/contract/:contractId`
- `POST /transactions/calculate-settlement`
- `POST /transactions/extend`
- `POST /transactions/:id/void`

#### Files

- `POST /files/upload-url`
- `POST /files/confirm`
- `GET /files/:id/download-url`
- `GET /files/entity/:entityType/:entityId`
- `DELETE /files/:id`

---

## 11. Data model tổng quát

## 11.1 Các bảng chính

Theo [database schema](file:///home/beou/IdeaProjects/paw8/docs/database-schema.md#L19-L29), các migration chính tạo ra:

```text
tenants
tenant_settings
stores
users
roles
user_roles
user_store_assignments
customers
customer_documents
assets
asset_inventory
contract_sequences
pawn_contracts
contract_assets
contract_status_history
contract_transactions
contract_extensions
payment_receipts
files
audit_logs
refresh_tokens
interest_policies
```

## 11.2 Quy tắc schema cốt lõi

- phần lớn bảng nghiệp vụ có `tenant_id`,
- bảng store-scoped có thêm `store_id`,
- unique chủ yếu là tenant-scoped,
- DB không thay thế hoàn toàn application logic cho tenant/store consistency,
- migrations là schema source of truth.

## 11.3 Chỉ mục dữ liệu cần có

Các access pattern quan trọng cần được tối ưu theo:

- `(tenant_id, status)`
- `(tenant_id, store_id, status)`
- `(tenant_id, due_date)`
- `(tenant_id, customer_id)`
- `(tenant_id, entity_type, entity_id)`
- `(tenant_id, created_at)`

---

## 12. File storage với MinIO

## 12.1 Nguyên tắc bucket

- dùng private bucket,
- không public bucket,
- object key phải tách theo tenant.

### Ví dụ key structure

```text
tenants/{tenant_id}/customers/{customer_id}/id-front.jpg
tenants/{tenant_id}/customers/{customer_id}/id-back.jpg
tenants/{tenant_id}/assets/{asset_id}/photo-1.jpg
tenants/{tenant_id}/contracts/{contract_id}/contract.pdf
tenants/{tenant_id}/receipts/{receipt_id}/receipt.pdf
```

## 12.2 Upload flow

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L118-L125):

```text
Client
  -> POST /files/upload-url
  -> backend kiểm tra tenant + entity ownership
  -> backend trả presigned PUT URL + object key
  -> client upload trực tiếp lên MinIO
  -> client gọi POST /files/confirm
  -> backend lưu metadata vào files
```

## 12.3 Download flow

```text
Client
  -> GET /files/:id/download-url
  -> backend kiểm tra tenant + permission + store scope
  -> backend trả presigned GET URL ngắn hạn
```

## 12.4 File metadata tối thiểu

- tenant
- store nếu có
- entity type
- entity id
- bucket
- object key
- original filename
- mime type
- file size
- uploaded by
- created at

---

## 13. Quy trình nghiệp vụ chính

## 13.1 Tạo hợp đồng

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L109-L117), luồng cốt lõi là:

1. Staff login và nhận JWT có `tenantId` + `allowedStoreIds`.
2. Tạo hoặc chọn customer.
3. Tạo một hoặc nhiều asset.
4. API validate tenant/store ownership cho store, customer, asset.
5. Service sinh `contract_code` bằng `contract_sequences` + advisory lock.
6. Insert contract.
7. Link assets vào contract.
8. Update asset status phù hợp.
9. Ghi contract status history.

## 13.2 Upload file

1. Client yêu cầu upload URL với `entityType`, `entityId`, tên file, MIME type, size.
2. Backend kiểm tra entity thuộc tenant hiện tại.
3. Backend trả upload URL và object key.
4. Client upload trực tiếp lên MinIO.
5. Client confirm upload để backend lưu metadata.

## 13.3 Ghi nhận transaction tài chính

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L126-L132):

1. Client gọi `POST /transactions` hoặc `POST /transactions/extend`.
2. Service validate tenant/store ownership và current contract state.
3. Insert row mới vào `contract_transactions`.
4. Nếu là settlement/extension thì có thể update status liên quan.
5. Nếu void thì phải tạo row mới, không chỉnh row cũ.

---

## 14. Non-functional requirements

## 14.1 Security

- JWT-based authentication với RS256.
- Password hash an toàn.
- Không trust `tenant_id` từ client.
- API phải enforce tenant scope.
- Store-scoped API phải enforce store scope.
- Presigned URL phải qua permission check.
- Không public MinIO bucket.
- Sensitive operation cần audit trail.

## 14.2 Data isolation

- Tenant này không được truy cập dữ liệu tenant khác.
- Unique constraint dùng tenant scope khi phù hợp.
- Report và audit phải tenant-aware.
- File metadata và file access phải tenant-aware.

## 14.3 Reliability

- Luồng giao dịch tài chính phải nhất quán.
- Contract creation, extension, settlement phải giữ integrity giữa contract/asset/transaction/history.
- Upload confirm không được làm mất metadata.

## 14.4 Performance

- Danh sách phải có pagination.
- Bảng lớn phải có index theo tenant/store/status/due date.
- Upload file nên đi trực tiếp từ client sang MinIO.
- Dashboard MVP1 có thể query trực tiếp PostgreSQL.

## 14.5 Maintainability

- Codebase giữ module boundaries rõ.
- Validation ở DTO/request boundary.
- API versioning ổn định.
- Dùng migrations cho schema change.
- Không hard-code lãi suất rải rác trong code.

## 14.6 Auditability

- Nghiệp vụ quan trọng phải để lại dấu vết.
- Audit log không phải dữ liệu người dùng được sửa thoải mái.
- Financial correction phải truy vết được nguyên nhân và actor.

---

## 15. Khoảng trống và sai khác hiện trạng cần biết

Phần này rất quan trọng: đây là các điểm đã được tài liệu hiện tại của repo nêu rõ là **chưa khớp hoàn toàn** giữa ý định thiết kế, migrations, service SQL, hoặc client integration.

## 15.1 Guard và enforcement chưa được wire rõ ràng

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L64-L76):

- `TenantGuard` tồn tại,
- `StoreScopeGuard` tồn tại,
- nhưng chưa thấy được wire global rõ ràng hoặc gắn rộng rãi vào controllers.

Hệ quả: tenant/store isolation hiện chưa nên được xem là “đã chứng minh đầy đủ chỉ bằng wiring hiện hữu”.

## 15.2 Audit coverage chưa đầy đủ

Theo [Architecture](file:///home/beou/IdeaProjects/paw8/ARCHITECTURE.md#L142-L149):

- `AuditInterceptor` tồn tại nhưng chưa thấy wire rõ,
- actual audit writes hiện tập trung nhiều ở auth flows.

Hệ quả: đặc tả business muốn audit rộng hơn hiện trạng runtime.

## 15.3 Mismatch giữa migrations và runtime/service SQL

Theo [database schema](file:///home/beou/IdeaProjects/paw8/docs/database-schema.md#L9-L17), đang có các mismatch đã biết:

- `asset_status`: migrations dùng `holding`, service dùng `pawned`
- `asset_inventory_status`: migrations dùng `in_storage`, service dùng `in_store`
- `interest_type`: migrations dùng `per_period`, DTO/runtime dùng `term`
- `contract_status_history`: migrations có `from_status`/`to_status`, service có chỗ insert `status`
- `contract_transactions`: migrations có `void_of_id`, service có chỗ dùng `reference_transaction_id`

Hệ quả: mọi thay đổi schema/business sau này phải ưu tiên làm rõ source of truth trước khi mở rộng tính năng.

## 15.4 API contract mismatch giữa backend và clients/docs cũ

Theo [README](file:///home/beou/IdeaProjects/paw8/README.md#L92-L99) và [API Reference](file:///home/beou/IdeaProjects/paw8/docs/api-reference.md#L22-L29):

- backend trả `accessToken`, nhưng web/mobile hiện có chỗ mong đợi `access_token`
- web reports gọi `/reports/by-store`, `/reports/by-staff`, `/reports/inventory`, trong khi backend expose `/reports/stores`, `/reports/staff`, `/reports/assets/inventory`
- web audit page gọi `/audit-logs`, trong khi backend expose `/audit/logs`
- không có `GET /transactions`; endpoint đọc hiện tại là `GET /transactions/contract/:contractId`

## 15.5 Một số enum/docs business cũng chưa đồng nhất hoàn toàn

Ví dụ trong [API Reference](file:///home/beou/IdeaProjects/paw8/docs/api-reference.md):

- tenant plan/status docs có chỗ khác tên với database enum,
- store/user status docs ở tầng API có thể khác wording với migration enum,
- asset type/status naming chưa đồng nhất hoàn toàn giữa business wording và runtime enum.

Điều này không thay đổi mục tiêu nghiệp vụ, nhưng là rủi ro tài liệu/hợp đồng API cần được kiểm soát.

---

## 16. Những gì không thuộc MVP1

Chưa đưa vào MVP1:

- eKYC/OCR tự động
- SMS/Zalo nhắc nợ
- tích hợp ngân hàng / VietQR động
- full double-entry accounting
- asset liquidation nâng cao
- AI định giá tài sản
- risk scoring / fraud detection
- workflow duyệt nhiều cấp
- billing/subscription SaaS đầy đủ
- custom domain theo tenant
- offline-first mobile hoàn chỉnh
- data warehouse / BI nâng cao
- tách microservice vật lý hoàn chỉnh

---

## 17. Tiêu chí hoàn thành MVP1

## 17.1 Platform foundation

- tạo được tenant,
- tạo được store trong tenant,
- tạo được user và gán role/store,
- login/refresh/logout hoạt động,
- tenant context được xác định từ auth context,
- dữ liệu khác tenant không bị truy cập nhầm qua API chuẩn.

## 17.2 Core pawn operations

- tạo được customer,
- tạo được asset,
- tạo được contract,
- sinh được contract code,
- ghi nhận được disbursement,
- thu được lãi/phí,
- gia hạn được hợp đồng,
- tính settlement và tất toán được,
- cập nhật được trạng thái asset/inventory theo nghiệp vụ.

## 17.3 Files và chứng từ

- cấp được presigned upload URL,
- client upload trực tiếp MinIO thành công,
- confirm upload lưu được metadata,
- cấp được download URL hợp lệ,
- file access không vượt tenant scope.

## 17.4 Operations visibility

- xem được dashboard cơ bản,
- xem được upcoming due / overdue,
- xem được inventory,
- xem được transaction history,
- xem được audit log ở mức đủ dùng cho MVP1.

## 17.5 Technical readiness

- migrations chạy được,
- seed data chạy được,
- schema giữ tenant-aware design,
- repo docs không còn mô tả hệ thống như single-tenant planning-only project,
- các mismatch quan trọng được tài liệu hóa rõ để tránh hiểu sai.

---

## 18. Định hướng sau MVP1

## 18.1 MVP2

- chuẩn hóa audit coverage
- siết tenant/store guard wiring
- đồng bộ API contracts giữa backend và clients
- giải quyết migration/runtime mismatches
- mở rộng reports
- cải thiện mobile feature depth

## 18.2 MVP3+

- subscription/billing hoàn chỉnh
- advanced collection/liquidation workflows
- advanced analytics/BI
- AI-assisted valuation/risk
- event-driven extraction hoặc physical microservice split khi cần thiết

---

## 19. Kết luận

`paw8` MVP1 không còn nên được mô tả như một ý tưởng thô. Repo hiện đã có hình hài của một hệ thống vận hành theo kiến trúc:

```text
PostgreSQL:
  shared schema multi-tenant, tenant_id là trục cô lập dữ liệu.

MinIO:
  private object storage, object key phân tách theo tenant.

NestJS:
  modular monolith với domain boundaries rõ.

Next.js + Flutter:
  web cho quản trị/vận hành, mobile cho tác vụ nhẹ tại cửa hàng.

Business model:
  customer -> asset -> contract -> transaction -> audit/file/report.
```

Điểm quan trọng nhất của MVP1 vẫn giữ nguyên: **không được xây như hệ thống single-tenant trá hình**. Mọi lớp từ schema, API, file storage, auth context, store scope đến audit đều phải được nhìn như bài toán multi-tenant ngay từ đầu.
