# Đặc tả yêu cầu MVP1 — Hệ thống quản lý cửa hàng / chuỗi cửa hàng cầm đồ

## 1. Mục tiêu MVP1

MVP1 nhằm xây dựng phiên bản đầu tiên có thể vận hành thực tế cho một cửa hàng hoặc một chuỗi cửa hàng cầm đồ, đồng thời được thiết kế sẵn để mở rộng thành mô hình **multi-tenant SaaS** sau này.

Mục tiêu chính:

- Quản lý được tenant, cửa hàng, người dùng và phân quyền cơ bản.
- Quản lý khách hàng, tài sản cầm cố và hồ sơ giấy tờ.
- Tạo và quản lý hợp đồng cầm đồ.
- Ghi nhận giải ngân, thu lãi, thu phí, gia hạn và tất toán.
- Theo dõi hợp đồng sắp đến hạn, quá hạn và tài sản đang giữ.
- Lưu trữ ảnh, giấy tờ, hợp đồng và biên nhận trên MinIO.
- Có dashboard và báo cáo vận hành cơ bản.
- Có audit log để kiểm soát thao tác quan trọng.
- Kiến trúc backend tenant-aware ngay từ đầu.

---

## 2. Tech stack MVP1

### 2.1 Frontend Web

- Framework: **Next.js**
- Mục đích:
  - Web portal cho Platform Admin.
  - Web portal cho Tenant Admin / Store Manager.
  - Web portal cho nhân viên giao dịch.
- Chức năng chính:
  - Quản lý tenant.
  - Quản lý cửa hàng.
  - Quản lý người dùng.
  - Quản lý khách hàng.
  - Quản lý tài sản.
  - Quản lý hợp đồng.
  - Thu tiền, gia hạn, tất toán.
  - Dashboard và báo cáo.
  - Xem audit log cơ bản.

### 2.2 Mobile App

- Framework: **Flutter**
- Mục đích:
  - Ứng dụng mobile nhẹ cho nhân viên tại cửa hàng.
- Phạm vi MVP1 mobile:
  - Đăng nhập.
  - Tìm kiếm khách hàng / hợp đồng.
  - Xem hợp đồng sắp đến hạn / quá hạn.
  - Chụp và upload ảnh CCCD.
  - Chụp và upload ảnh tài sản.
  - Xem thông tin tài sản.
  - Ghi chú nhắc nợ / ghi chú khách hàng.

### 2.3 Backend

- Framework: **NestJS**
- Kiến trúc:
  - MVP1 triển khai theo hướng **modular monolith, microservice-ready**.
  - Domain module tách rõ để sau này có thể tách thành microservices vật lý.
- Các module chính:
  - Auth / Identity Module
  - Tenant Module
  - User & RBAC Module
  - Store Module
  - Customer Module
  - Asset Module
  - Pawn Contract Module
  - Transaction / Collection Module
  - File Module
  - Report Module
  - Audit Module

### 2.4 Database

- Database: **PostgreSQL**
- Mô hình multi-tenant MVP1:
  - Shared database.
  - Shared schema.
  - Tenant isolation bằng `tenant_id`.
- Quy tắc:
  - Hầu hết bảng nghiệp vụ phải có `tenant_id`.
  - Các bảng liên quan chi nhánh phải có thêm `store_id`.
  - Không lưu binary file trong PostgreSQL.
  - Giao dịch tài chính theo hướng append-only.

### 2.5 File Storage

- Storage: **MinIO**
- Bucket:
  - MVP1 dùng một private bucket chung.
  - Object key tách theo tenant.
- Ví dụ path:
  - `tenants/{tenant_id}/customers/{customer_id}/id-front.jpg`
  - `tenants/{tenant_id}/customers/{customer_id}/portrait.jpg`
  - `tenants/{tenant_id}/assets/{asset_id}/photo-1.jpg`
  - `tenants/{tenant_id}/contracts/{contract_id}/contract.pdf`
  - `tenants/{tenant_id}/receipts/{receipt_id}/receipt.pdf`

---

## 3. Nguyên tắc thiết kế multi-tenant

### 3.1 Tenant là cấp cao nhất

```text
Tenant = một công ty / một chuỗi cửa hàng / một chủ hệ thống riêng
```

Cấu trúc phân cấp:

```text
Tenant
 └── Store / Branch
      ├── Users
      ├── Customers
      ├── Assets
      ├── Pawn Contracts
      ├── Transactions
      └── Reports
```

Không coi cửa hàng là cấp cao nhất. Cửa hàng chỉ là chi nhánh thuộc tenant.

### 3.2 MVP1 phải tenant-ready

MVP1 có thể chỉ triển khai cho một tenant đầu tiên, nhưng toàn bộ database, backend, API, file storage và phân quyền phải tenant-aware ngay từ đầu.

### 3.3 Không tin `tenant_id` từ frontend

Frontend không được tự truyền `tenant_id` rồi backend tin tưởng trực tiếp.

Backend phải xác định tenant từ:

- JWT.
- Session.
- User context.

Ví dụ:

```text
currentUser.tenantId
```

### 3.4 Mọi query phải lọc theo tenant

Ví dụ sai:

```sql
SELECT * FROM pawn_contracts WHERE id = :id;
```

Ví dụ đúng:

```sql
SELECT *
FROM pawn_contracts
WHERE id = :id
AND tenant_id = :current_tenant_id;
```

### 3.5 Store-level permission

User không chỉ thuộc tenant, mà còn có phạm vi cửa hàng.

Ví dụ:

```text
currentUser.tenantId = T1
currentUser.allowedStoreIds = [S1, S2]
```

Khi truy vấn hợp đồng:

```sql
SELECT *
FROM pawn_contracts
WHERE tenant_id = :tenantId
AND store_id = ANY(:allowedStoreIds);
```

### 3.6 File cũng phải tenant-aware

Không sinh presigned URL chỉ dựa trên `file_id`.

Backend phải kiểm tra:

- File thuộc tenant của user.
- User có quyền truy cập entity liên quan.
- User nằm trong store scope hợp lệ nếu file gắn với cửa hàng.

---

## 4. Phân quyền MVP1

| Role | Phạm vi | Quyền chính |
|---|---|---|
| Platform Admin | Toàn hệ thống | Quản lý tenant, trạng thái tenant, tạo tenant owner |
| Tenant Owner | Một tenant | Toàn quyền trong tenant |
| Tenant Admin | Một tenant | Quản lý user, store, cấu hình, báo cáo trong tenant |
| Store Manager | Một hoặc nhiều store | Quản lý vận hành store được gán |
| Staff | Một store | Tạo khách hàng, tạo hợp đồng, thu tiền cơ bản |
| Accountant / Controller | Tenant hoặc store | Xem giao dịch, báo cáo, đối soát |

Nguyên tắc quyền:

- Platform Admin không nên mặc định xem dữ liệu nhạy cảm của tenant nếu không cần.
- Tenant Owner / Tenant Admin xem được toàn bộ dữ liệu trong tenant.
- Store Manager chỉ xem dữ liệu các store được gán.
- Staff chỉ thao tác trong store được gán.
- Accountant / Controller xem dữ liệu tài chính trong phạm vi được phân quyền.

---

## 5. Phạm vi tính năng MVP1

## 5.1 Tenant Management

### Mục tiêu

Cho phép hệ thống tạo và quản lý tenant để chuẩn bị mở rộng SaaS/multi-tenant.

### Tính năng

- Tạo tenant mới.
- Cập nhật thông tin tenant.
- Kích hoạt / khóa tenant.
- Thiết lập tenant owner.
- Cấu hình thông tin cơ bản:
  - Tên tenant.
  - Mã tenant.
  - Trạng thái.
  - Plan sử dụng.
  - Số lượng cửa hàng tối đa.
  - Số lượng user tối đa.
  - Ngày hết hạn trial nếu có.

### Ghi chú MVP1

- Chưa cần self-service signup.
- Platform Admin có thể tạo tenant thủ công.

---

## 5.2 Store / Branch Management

### Mục tiêu

Quản lý một hoặc nhiều cửa hàng trong cùng một tenant.

### Tính năng

- Tạo cửa hàng.
- Cập nhật thông tin cửa hàng.
- Khóa / mở cửa hàng.
- Gán người quản lý cửa hàng.
- Gán nhân viên vào cửa hàng.
- Lọc dữ liệu theo cửa hàng.

### Thông tin cửa hàng

- Tên cửa hàng.
- Địa chỉ.
- Số điện thoại.
- Người quản lý.
- Trạng thái hoạt động.
- Tenant sở hữu.

---

## 5.3 User & RBAC Management

### Mục tiêu

Quản lý người dùng và phân quyền theo tenant/store.

### Tính năng

- Đăng nhập / đăng xuất.
- Đổi mật khẩu.
- Tạo user.
- Cập nhật user.
- Khóa / mở user.
- Gán user vào tenant.
- Gán user vào một hoặc nhiều store.
- Gán role cho user.
- Kiểm soát quyền theo role và store scope.
- Lưu lịch sử đăng nhập và thao tác quan trọng.

### Ghi chú

MVP1 có thể giả định một user thuộc một tenant. Sau này có thể mở rộng bằng bảng `user_tenant_memberships` nếu cần một user tham gia nhiều tenant.

---

## 5.4 Customer Management

### Mục tiêu

Quản lý hồ sơ khách hàng và lịch sử hợp đồng trong phạm vi tenant.

### Tính năng

- Tạo khách hàng mới.
- Cập nhật thông tin khách hàng.
- Tìm kiếm khách hàng theo:
  - Họ tên.
  - Số điện thoại.
  - CCCD/CMND/hộ chiếu.
- Xem lịch sử hợp đồng của khách hàng.
- Cảnh báo khách hàng có hợp đồng đang mở.
- Cảnh báo trùng số CCCD / số điện thoại trong cùng tenant.
- Upload ảnh CCCD mặt trước / mặt sau.
- Upload ảnh chân dung khách hàng.
- Lưu người liên hệ khẩn cấp.

### Thông tin khách hàng

- Họ tên.
- Số điện thoại.
- Số CCCD/CMND/hộ chiếu.
- Ngày sinh.
- Địa chỉ thường trú.
- Địa chỉ hiện tại.
- Nghề nghiệp.
- Người liên hệ khẩn cấp.
- Ghi chú.
- Tenant sở hữu.

### Quy tắc unique

Không unique global theo CCCD hoặc số điện thoại.

Nên dùng:

```sql
UNIQUE (tenant_id, identity_number)
UNIQUE (tenant_id, phone_number)
```

---

## 5.5 Asset Management

### Mục tiêu

Quản lý tài sản cầm cố, ảnh tài sản, giấy tờ và trạng thái tài sản.

### Nhóm tài sản MVP1

- Xe máy.
- Ô tô.
- Điện thoại.
- Laptop.
- Đồng hồ.
- Vàng / trang sức.
- Đồ điện tử khác.
- Tài sản khác.

### Thông tin tài sản

- Loại tài sản.
- Tên tài sản.
- Nhãn hiệu / model.
- Màu sắc.
- Tình trạng tài sản.
- Mô tả chi tiết.
- Số seri / IMEI / biển số / số khung / số máy nếu có.
- Giá trị định giá.
- Số tiền cho vay đề xuất.
- Hình ảnh tài sản.
- Giấy tờ kèm theo.
- Vị trí lưu kho.
- Trạng thái tài sản.
- Tenant sở hữu.
- Store đang giữ.

### Trạng thái tài sản

- Đang cầm.
- Đã chuộc.
- Quá hạn.
- Chờ thanh lý.
- Đã thanh lý.

### Tính năng

- Thêm tài sản vào hợp đồng.
- Upload ảnh tài sản.
- Upload giấy tờ tài sản.
- Ghi nhận tình trạng tài sản lúc nhận.
- Tìm kiếm tài sản theo IMEI, biển số, số seri.
- Xem tài sản đang gắn với hợp đồng nào.
- Quản lý vị trí lưu kho cơ bản.

---

## 5.6 Pawn Contract Management

### Mục tiêu

Quản lý hợp đồng cầm đồ từ lúc tạo đến khi tất toán/hủy/thanh lý.

### Thông tin hợp đồng

- Mã hợp đồng.
- Tenant.
- Cửa hàng.
- Nhân viên tạo hợp đồng.
- Khách hàng.
- Tài sản cầm cố.
- Ngày vay.
- Ngày đến hạn.
- Số tiền vay.
- Lãi suất.
- Loại lãi.
- Phí khác nếu có.
- Số tiền khách thực nhận.
- Ghi chú hợp đồng.
- Trạng thái hợp đồng.

### Loại lãi MVP1

- Theo ngày.
- Theo tháng.
- Theo kỳ.

### Trạng thái hợp đồng

- Draft.
- Active.
- Near due.
- Overdue.
- Extended.
- Settled.
- Cancelled.
- Liquidation pending.
- Liquidated.

### Tính năng

- Tạo hợp đồng mới.
- Xem chi tiết hợp đồng.
- Sửa một số thông tin khi hợp đồng chưa phát sinh giao dịch.
- In / xuất hợp đồng PDF.
- Upload giấy tờ liên quan.
- Tìm kiếm hợp đồng theo:
  - Mã hợp đồng.
  - Tên khách hàng.
  - Số điện thoại.
  - CCCD.
  - Tài sản.
  - Trạng thái.
- Danh sách hợp đồng sắp đến hạn.
- Danh sách hợp đồng quá hạn.
- Xem lịch sử trạng thái hợp đồng.

### Quy tắc mã hợp đồng

Không nên dùng mã hợp đồng global đơn giản kiểu:

```text
HD000001
```

Nên hỗ trợ mã theo tenant/store:

```text
MT-HN01-202605-00001
```

Hoặc lưu sequence theo:

```text
tenant_id + store_id + year_month + running_number
```

---

## 5.7 Disbursement & Transaction Management

### Mục tiêu

Ghi nhận các giao dịch tài chính liên quan đến hợp đồng.

### Loại giao dịch MVP1

- Giải ngân khoản vay.
- Thu lãi.
- Thu phí.
- Gia hạn hợp đồng.
- Thu gốc một phần nếu cho phép.
- Tất toán hợp đồng.
- Điều chỉnh thủ công có kiểm soát.
- Void / reversal giao dịch khi cần.

### Tính năng

- Ghi nhận giải ngân.
- Ghi nhận tiền khách thanh toán.
- Tự tính lãi đến ngày thanh toán.
- Tự tính số tiền cần trả để tất toán.
- Ghi nhận phương thức thanh toán:
  - Tiền mặt.
  - Chuyển khoản.
  - Khác.
- In / xuất phiếu thu.
- Xem lịch sử giao dịch của từng hợp đồng.
- Không cho sửa/xóa giao dịch tài chính trực tiếp.
- Chỉ cho tạo giao dịch điều chỉnh, void hoặc reversal.

### Nguyên tắc

Giao dịch tài chính phải có:

- `tenant_id`
- `store_id`
- `contract_id`
- `transaction_type`
- `amount`
- `payment_method`
- `created_by`
- `created_at`

---

## 5.8 Contract Extension

### Mục tiêu

Hỗ trợ nghiệp vụ gia hạn hợp đồng.

### Tính năng

- Chọn hợp đồng cần gia hạn.
- Tính tiền lãi/phí cần thu trước khi gia hạn.
- Chọn thời hạn gia hạn mới.
- Cập nhật ngày đến hạn mới.
- Ghi nhận lịch sử gia hạn.
- In phiếu gia hạn nếu cần.

### Dữ liệu cần lưu

- Ngày đến hạn cũ.
- Ngày đến hạn mới.
- Tiền lãi đã thu.
- Phí gia hạn nếu có.
- Người thực hiện.
- Thời điểm thực hiện.

---

## 5.9 Settlement / Redeem Asset

### Mục tiêu

Đóng hợp đồng và trả tài sản cho khách.

### Tính năng

- Tính tổng số tiền khách cần trả:
  - Gốc còn lại.
  - Lãi đến ngày tất toán.
  - Phí phát sinh nếu có.
- Ghi nhận thanh toán.
- Chuyển hợp đồng sang trạng thái đã tất toán.
- Chuyển tài sản sang trạng thái đã chuộc.
- Ghi nhận ngày trả tài sản.
- In phiếu tất toán / phiếu trả tài sản.

---

## 5.10 Overdue Management

### Mục tiêu

Theo dõi và xử lý hợp đồng quá hạn.

### Tính năng

- Danh sách hợp đồng sắp đến hạn.
- Danh sách hợp đồng đã quá hạn.
- Tính số ngày quá hạn.
- Tính số tiền lãi/phí tạm tính đến hiện tại.
- Ghi chú nhắc nợ.
- Cập nhật trạng thái:
  - Quá hạn.
  - Chờ thanh lý.
  - Đã tất toán.
  - Đã gia hạn.

---

## 5.11 Asset Inventory Management

### Mục tiêu

Kiểm soát tài sản vật lý đang được cửa hàng giữ.

### Tính năng

- Danh sách tài sản đang giữ.
- Quản lý vị trí lưu kho:
  - Cửa hàng.
  - Tủ/kệ/ngăn.
  - Ghi chú vị trí.
- Trạng thái tài sản.
- Tìm kiếm tài sản theo:
  - Khách hàng.
  - Hợp đồng.
  - Mã tài sản.
  - IMEI/biển số/serial.
- Lịch sử nhận và trả tài sản.

---

## 5.12 Dashboard & Reports

### Dashboard MVP1

Các chỉ số cần có:

- Tổng số hợp đồng đang hiệu lực.
- Tổng dư nợ đang cho vay.
- Tổng tiền đã giải ngân trong ngày/tháng.
- Tổng tiền thu trong ngày/tháng.
- Tổng lãi đã thu.
- Số hợp đồng sắp đến hạn.
- Số hợp đồng quá hạn.
- Số tài sản đang giữ.

### Báo cáo MVP1

- Báo cáo hợp đồng theo thời gian.
- Báo cáo thu tiền.
- Báo cáo dư nợ.
- Báo cáo hợp đồng quá hạn.
- Báo cáo theo cửa hàng.
- Báo cáo theo nhân viên.
- Báo cáo tài sản đang giữ.

### Scope báo cáo

Báo cáo phải hỗ trợ lọc theo:

- Tenant.
- Store.
- Khoảng thời gian.
- Trạng thái hợp đồng.
- Nhân viên.
- Loại tài sản.

---

## 5.13 Audit Log

### Mục tiêu

Lưu lại dấu vết thao tác để kiểm tra khi xảy ra sai lệch tiền, hợp đồng hoặc tài sản.

### Sự kiện cần ghi log

- Đăng nhập.
- Đăng nhập thất bại.
- Tạo khách hàng.
- Cập nhật khách hàng.
- Upload file.
- Tạo hợp đồng.
- Cập nhật hợp đồng.
- Hủy hợp đồng.
- Ghi nhận giải ngân.
- Thu lãi.
- Thu phí.
- Gia hạn hợp đồng.
- Tất toán hợp đồng.
- Thay đổi trạng thái tài sản.
- Void/reversal/adjustment giao dịch.

### Dữ liệu audit log

- Tenant.
- Store.
- User.
- Action.
- Entity type.
- Entity ID.
- Old value.
- New value.
- IP address.
- User agent.
- Created at.

---

## 6. Kiến trúc backend NestJS đề xuất

### 6.1 Cấu trúc module MVP1

```text
apps/
  api-gateway/

libs/
  auth/
  tenants/
  users/
  stores/
  customers/
  assets/
  contracts/
  transactions/
  files/
  reports/
  audit/
  common/
```

### 6.2 Domain boundary

| Module | Trách nhiệm |
|---|---|
| Auth | Login, JWT, session, password, current user context |
| Tenants | Tenant, tenant settings, plan/license placeholder |
| Users | User, role, permission, user-store assignment |
| Stores | Cửa hàng, chi nhánh, manager |
| Customers | Hồ sơ khách hàng, giấy tờ, lịch sử hợp đồng |
| Assets | Tài sản cầm cố, ảnh, giấy tờ, kho tài sản |
| Contracts | Hợp đồng, trạng thái, kỳ hạn, lãi suất |
| Transactions | Giải ngân, thu tiền, gia hạn, tất toán, reversal |
| Files | MinIO upload/download, presigned URL, metadata |
| Reports | Dashboard, báo cáo vận hành |
| Audit | Lưu vết thao tác |

### 6.3 API Gateway / BFF

NestJS API Gateway cần xử lý:

- Authentication.
- Tenant context.
- Store scope.
- Request validation.
- Rate limit cơ bản.
- Response shaping.
- API versioning.
- Audit middleware.
- Route đến các module/domain service.

API nên version ngay từ đầu:

```text
/api/v1/auth/login
/api/v1/tenants
/api/v1/stores
/api/v1/users
/api/v1/customers
/api/v1/assets
/api/v1/contracts
/api/v1/transactions
/api/v1/files/presigned-upload-url
/api/v1/reports/dashboard
```

---

## 7. Data model khái niệm

### 7.1 Bảng chính

```text
tenants
stores
users
roles
permissions
user_roles
user_store_assignments
tenant_settings
interest_policies
customers
customer_documents
assets
asset_inventory
pawn_contracts
contract_assets
contract_status_history
contract_transactions
contract_extensions
payment_receipts
files
audit_logs
```

### 7.2 Data model rút gọn

```text
tenants
  id
  name
  code
  status
  plan
  max_stores
  max_users
  trial_end_date
  created_at

stores
  id
  tenant_id
  name
  address
  phone
  manager_user_id
  status
  created_at

users
  id
  tenant_id
  email
  phone
  full_name
  password_hash
  status
  created_at

roles
  id
  tenant_id
  name
  description

user_roles
  id
  tenant_id
  user_id
  role_id

user_store_assignments
  id
  tenant_id
  user_id
  store_id

customers
  id
  tenant_id
  full_name
  phone
  identity_number
  date_of_birth
  permanent_address
  current_address
  occupation
  emergency_contact_name
  emergency_contact_phone
  status
  created_at

assets
  id
  tenant_id
  store_id
  asset_type
  asset_name
  brand
  model
  color
  serial_number
  imei
  license_plate
  chassis_number
  engine_number
  condition_description
  valuation_amount
  proposed_loan_amount
  status
  created_at

asset_inventory
  id
  tenant_id
  store_id
  asset_id
  location_code
  location_note
  received_at
  returned_at
  status

pawn_contracts
  id
  tenant_id
  store_id
  customer_id
  contract_code
  principal_amount
  interest_rate
  interest_type
  start_date
  due_date
  status
  created_by
  created_at
  updated_by
  updated_at

contract_assets
  id
  tenant_id
  contract_id
  asset_id

contract_transactions
  id
  tenant_id
  store_id
  contract_id
  transaction_type
  amount
  payment_method
  transaction_date
  note
  created_by
  created_at

contract_extensions
  id
  tenant_id
  contract_id
  old_due_date
  new_due_date
  interest_paid_amount
  fee_amount
  created_by
  created_at

files
  id
  tenant_id
  store_id
  entity_type
  entity_id
  bucket
  object_key
  original_filename
  mime_type
  file_size
  uploaded_by
  created_at

audit_logs
  id
  tenant_id
  store_id
  user_id
  action
  entity_type
  entity_id
  old_value
  new_value
  ip_address
  user_agent
  created_at
```

---

## 8. Database requirements

### 8.1 Bắt buộc có tenant scope

Các bảng nghiệp vụ phải có `tenant_id`:

- stores
- users
- roles
- user_roles
- user_store_assignments
- customers
- customer_documents
- assets
- asset_inventory
- pawn_contracts
- contract_assets
- contract_transactions
- contract_extensions
- payment_receipts
- files
- audit_logs
- tenant_settings
- interest_policies

### 8.2 Index khuyến nghị

```sql
CREATE INDEX idx_stores_tenant_status
ON stores (tenant_id, status);

CREATE INDEX idx_customers_tenant_phone
ON customers (tenant_id, phone);

CREATE INDEX idx_customers_tenant_identity
ON customers (tenant_id, identity_number);

CREATE INDEX idx_assets_tenant_store_status
ON assets (tenant_id, store_id, status);

CREATE INDEX idx_contracts_tenant_store_status
ON pawn_contracts (tenant_id, store_id, status);

CREATE INDEX idx_contracts_tenant_due_date
ON pawn_contracts (tenant_id, due_date);

CREATE INDEX idx_contracts_tenant_customer
ON pawn_contracts (tenant_id, customer_id);

CREATE INDEX idx_transactions_tenant_store_date
ON contract_transactions (tenant_id, store_id, transaction_date);

CREATE INDEX idx_files_tenant_entity
ON files (tenant_id, entity_type, entity_id);

CREATE INDEX idx_audit_tenant_created_at
ON audit_logs (tenant_id, created_at);
```

### 8.3 Financial transaction rules

- Không update/delete trực tiếp giao dịch tài chính đã ghi nhận.
- Muốn sửa sai phải tạo giao dịch:
  - Adjustment.
  - Void.
  - Reversal.
- Mỗi giao dịch tài chính phải có người tạo và timestamp.
- Nên lưu note/lý do cho giao dịch điều chỉnh.

---

## 9. MinIO requirements

### 9.1 Bucket strategy

- Dùng một private bucket chung cho MVP1.
- Không public bucket.
- Object key phân tách theo tenant.

Ví dụ:

```text
pawn-platform/
  tenants/{tenant_id}/customers/{customer_id}/id-front.jpg
  tenants/{tenant_id}/customers/{customer_id}/id-back.jpg
  tenants/{tenant_id}/customers/{customer_id}/portrait.jpg
  tenants/{tenant_id}/assets/{asset_id}/photo-1.jpg
  tenants/{tenant_id}/contracts/{contract_id}/contract.pdf
  tenants/{tenant_id}/receipts/{receipt_id}/receipt.pdf
```

### 9.2 Upload flow

```text
Next.js / Flutter
  -> Request upload URL từ NestJS
  -> NestJS kiểm tra quyền
  -> NestJS tạo object_key
  -> NestJS trả presigned PUT URL
  -> Client upload trực tiếp lên MinIO
  -> Client gọi confirm upload
  -> NestJS lưu metadata vào PostgreSQL
```

### 9.3 Download/view flow

```text
Next.js / Flutter
  -> Request view/download file
  -> NestJS kiểm tra tenant + permission + store scope
  -> NestJS tạo presigned GET URL
  -> Client dùng URL có hạn ngắn để xem/tải file
```

### 9.4 File metadata

PostgreSQL phải lưu metadata:

- Tenant.
- Store nếu có.
- Entity type.
- Entity ID.
- Bucket.
- Object key.
- Original filename.
- MIME type.
- File size.
- Uploaded by.
- Created at.

---

## 10. Next.js Web App requirements

### 10.1 Platform Admin screens

- Login.
- Tenant list.
- Create tenant.
- Edit tenant.
- Lock/unlock tenant.
- Create tenant owner.
- View tenant status/license summary.

### 10.2 Tenant Admin screens

- Dashboard.
- Store management.
- User management.
- Role assignment.
- Tenant settings.
- Interest policy configuration.
- Customer management.
- Asset management.
- Contract management.
- Reports.
- Audit log.

### 10.3 Store Manager screens

- Store dashboard.
- Customer list/detail.
- Contract list/detail.
- Due soon contracts.
- Overdue contracts.
- Asset inventory.
- Staff performance summary.
- Collection report.

### 10.4 Staff screens

- Customer search/create.
- Asset create/upload photos.
- Contract create.
- Contract detail.
- Collect interest/fee.
- Extend contract.
- Settle contract.
- Print/export receipt.
- View assigned store contracts.

---

## 11. Flutter Mobile App requirements

### 11.1 MVP1 mobile screens

- Login.
- Home/dashboard cá nhân.
- Search customer.
- Search contract.
- Contract detail.
- Due soon list.
- Overdue list.
- Capture/upload customer ID images.
- Capture/upload asset images.
- Asset detail.
- Add customer/contract note.

### 11.2 Chưa đưa vào mobile MVP1

- Quản lý tenant.
- Quản lý user/role.
- Cấu hình lãi suất.
- Báo cáo phức tạp.
- Thanh lý tài sản nâng cao.
- Offline mode đầy đủ.
- Tất toán nâng cao nếu web đã xử lý đủ.

---

## 12. Quy trình nghiệp vụ MVP1

### 12.1 Tạo hợp đồng

```text
1. Nhân viên tìm hoặc tạo khách hàng.
2. Nhân viên nhập thông tin tài sản.
3. Nhân viên upload ảnh/giấy tờ tài sản.
4. Nhân viên định giá tài sản.
5. Nhân viên nhập số tiền vay, lãi suất, kỳ hạn.
6. Hệ thống tạo hợp đồng.
7. Hệ thống ghi nhận giải ngân.
8. Nhân viên in/xuất hợp đồng nếu cần.
9. Tài sản chuyển trạng thái Đang cầm.
```

### 12.2 Thu lãi / thu phí

```text
1. Nhân viên mở hợp đồng.
2. Hệ thống tính số tiền cần thu đến ngày hiện tại.
3. Nhân viên xác nhận số tiền khách thanh toán.
4. Hệ thống ghi nhận giao dịch.
5. Hệ thống tạo phiếu thu.
6. Hệ thống cập nhật lịch sử hợp đồng.
```

### 12.3 Gia hạn hợp đồng

```text
1. Nhân viên mở hợp đồng.
2. Hệ thống tính lãi/phí cần thu trước khi gia hạn.
3. Khách thanh toán lãi/phí.
4. Nhân viên chọn ngày đến hạn mới.
5. Hệ thống ghi nhận giao dịch và lịch sử gia hạn.
6. Hệ thống cập nhật ngày đến hạn mới.
7. Hệ thống tạo phiếu gia hạn nếu cần.
```

### 12.4 Tất toán / chuộc tài sản

```text
1. Nhân viên mở hợp đồng.
2. Hệ thống tính gốc, lãi, phí còn phải trả.
3. Khách thanh toán.
4. Nhân viên xác nhận tất toán.
5. Hệ thống ghi nhận giao dịch.
6. Hệ thống chuyển hợp đồng sang Settled.
7. Hệ thống chuyển tài sản sang Đã chuộc.
8. Nhân viên trả tài sản cho khách.
9. Hệ thống tạo phiếu tất toán / phiếu trả tài sản.
```

### 12.5 Xử lý quá hạn

```text
1. Hệ thống hiển thị danh sách hợp đồng sắp đến hạn/quá hạn.
2. Nhân viên xem số ngày quá hạn và số tiền tạm tính.
3. Nhân viên ghi chú nhắc nợ.
4. Nhân viên cập nhật trạng thái nếu cần.
5. Hợp đồng có thể được gia hạn, tất toán hoặc chuyển chờ thanh lý.
```

---

## 13. Non-functional requirements

### 13.1 Security

- JWT-based authentication.
- Password phải hash an toàn.
- Backend không tin `tenant_id` từ client.
- Mọi API phải kiểm tra tenant scope.
- Mọi API liên quan store phải kiểm tra store scope.
- File access phải kiểm tra quyền trước khi sinh presigned URL.
- Không public MinIO bucket.
- Sensitive operation phải ghi audit log.

### 13.2 Data isolation

- Dữ liệu tenant này không được truy cập bởi tenant khác.
- Unique constraint phải theo `tenant_id`, không unique global nếu không cần.
- Báo cáo phải filter theo tenant/store.
- Audit log phải có `tenant_id`.

### 13.3 Performance

- Các màn hình danh sách phải hỗ trợ pagination.
- Các bảng lớn phải có index theo `tenant_id`, `store_id`, `status`, `due_date`.
- File upload nên đi trực tiếp từ client lên MinIO bằng presigned URL.
- Dashboard MVP1 có thể query trực tiếp PostgreSQL, chưa cần data warehouse.

### 13.4 Reliability

- Giao dịch tài chính phải được xử lý trong database transaction.
- Tạo hợp đồng + ghi nhận giải ngân cần đảm bảo tính nhất quán.
- Gia hạn + thu tiền cần đảm bảo atomic.
- Tất toán + cập nhật trạng thái tài sản cần đảm bảo atomic.
- Không mất metadata file sau upload confirm.

### 13.5 Auditability

- Các thao tác nghiệp vụ quan trọng phải có audit log.
- Audit log không nên cho sửa/xóa bởi user thông thường.
- Giao dịch tài chính không sửa/xóa trực tiếp.

### 13.6 Maintainability

- Codebase NestJS chia module rõ theo domain.
- DTO validation bắt buộc.
- API versioning từ đầu.
- Dùng migration cho database.
- Không hard-code lãi suất trong code.
- Cấu hình lãi suất nên nằm trong `interest_policies` hoặc `tenant_settings`.

---

## 14. Các tính năng chưa đưa vào MVP1

Các tính năng sau nên để MVP2/MVP3:

- eKYC/OCR CCCD tự động.
- Tích hợp SMS/Zalo nhắc nợ.
- Tích hợp thanh toán ngân hàng.
- Tích hợp VietQR động.
- Kế toán hai bút toán đầy đủ.
- Thanh lý tài sản nâng cao.
- Định giá tài sản tự động bằng AI.
- Chấm điểm rủi ro khách hàng.
- Workflow duyệt nhiều cấp.
- POS/máy in hóa đơn chuyên dụng.
- CRM marketing.
- Billing/subscription SaaS đầy đủ.
- Custom domain theo tenant.
- Mobile offline mode đầy đủ.
- Data warehouse / BI nâng cao.
- Tách microservice vật lý hoàn chỉnh.
- Message broker/event bus nếu chưa cần.

---

## 15. Tiêu chí hoàn thành MVP1

### 15.1 Platform foundation

- Tạo được tenant.
- Tạo được store trong tenant.
- Tạo được user và gán role.
- Gán được user vào store.
- Login thành công bằng tài khoản user.
- Backend xác định tenant từ JWT/session.
- API không cho truy cập dữ liệu khác tenant.
- File upload/download kiểm tra tenant và permission.

### 15.2 Core pawn operation

- Tạo được khách hàng.
- Upload được giấy tờ khách hàng.
- Tạo được tài sản cầm cố.
- Upload được ảnh tài sản.
- Tạo được hợp đồng cầm đồ.
- Ghi nhận được giải ngân.
- Tính và thu được lãi/phí cơ bản.
- Gia hạn được hợp đồng.
- Tất toán được hợp đồng.
- Cập nhật được trạng thái tài sản khi chuộc.

### 15.3 Management and reporting

- Xem được dashboard tenant/store.
- Xem được danh sách hợp đồng đang hiệu lực.
- Xem được danh sách hợp đồng sắp đến hạn.
- Xem được danh sách hợp đồng quá hạn.
- Xem được báo cáo dư nợ.
- Xem được báo cáo thu tiền.
- Xem được tài sản đang giữ.
- Xem được audit log cơ bản.

### 15.4 Technical readiness

- PostgreSQL schema có tenant_id đầy đủ.
- MinIO private bucket hoạt động.
- Presigned upload/download URL hoạt động.
- NestJS module boundary rõ ràng.
- Next.js web app xử lý được nghiệp vụ chính.
- Flutter app xử lý được tra cứu và upload ảnh cơ bản.
- API có version `/api/v1`.
- Có migration database.
- Có seed dữ liệu tenant/store/user mẫu.
- Có basic logging và audit logging.

---

## 16. Định hướng sau MVP1

### MVP2

- OCR/eKYC CCCD.
- SMS/Zalo nhắc nợ.
- VietQR động.
- Thanh lý tài sản.
- Quy trình duyệt hợp đồng.
- Báo cáo nâng cao.
- Mobile app đầy đủ hơn.
- Subscription/billing tenant.

### MVP3

- Định giá tài sản tự động.
- Chấm điểm rủi ro khách hàng.
- AI fraud/risk detection.
- Data warehouse/BI.
- Custom domain tenant.
- Tách microservices vật lý.
- Event-driven architecture.
- Multi-region hoặc tenant isolation nâng cao.

---

## 17. Kết luận

MVP1 nên tập trung vào vận hành nghiệp vụ cầm đồ lõi nhưng phải đặt nền móng kỹ thuật đúng ngay từ đầu:

```text
PostgreSQL:
  Shared database, shared schema, tenant_id everywhere.

MinIO:
  Private bucket, tenant-based object path, metadata in PostgreSQL.

NestJS:
  Modular monolith first, microservice-ready domain boundaries.

Next.js:
  Main web portal for admin, manager, staff.

Flutter:
  Lightweight staff mobile app for search, capture and upload.

Security:
  Tenant-aware auth, tenant-scoped API, store-level permission, audit log.
```

Điểm quan trọng nhất: MVP1 có thể bắt đầu với một tenant đầu tiên, nhưng không được thiết kế như một hệ thống single-tenant cứng. Toàn bộ data model, API, file storage và phân quyền phải sẵn sàng cho multi-tenant ngay từ ngày đầu.
