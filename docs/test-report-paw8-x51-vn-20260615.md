# Báo cáo kiểm thử website `paw8.x51.vn`

- Ngày test: 2026-06-15
- Môi trường test: production `https://paw8.x51.vn`
- Công cụ: browser tích hợp trong VS Code
- Nguồn credential: `credential.txt`

## Phạm vi kiểm thử thực tế

Đã kiểm thử được hai giai đoạn:

1. **Public + login flow**
   - Landing page `/`
   - Trang đăng nhập `/login`
   - Điều hướng công khai
   - Đăng nhập sai mật khẩu
   - Đăng nhập đúng credential từ browser agent

2. **Authenticated flow sau khi user đăng nhập thủ công**
   - `Platform Dashboard`
   - `Tenants`
   - `Activity`
   - `Tenant detail`
   - `Onboard Wizard`
   - `Sign out`
  - `Tenant Admin Dashboard`
  - `Customers`
  - `Assets`
  - `Contracts`
  - `Reports`
  - `Users`
  - `Stores`
  - `Audit Logs`
  - `Marketplace`

## Credential tham chiếu

| Role | Email |
|---|---|
| Platform Admin | `platform@paw8.dev` |
| Tenant Owner | `owner@demo.paw8.dev` |
| Tenant Admin | `admin@demo.paw8.dev` |
| Store Manager | `manager@demo.paw8.dev` |
| Staff | `staff@demo.paw8.dev` |
| Accountant | `accountant@demo.paw8.dev` |

> Mật khẩu dùng thử nghiệm: `Password@123`

## Kết quả test chi tiết

| ID | Test case | Kết quả | Ghi chú |
|---|---|---|---|
| TC-01 | Mở trang chủ `https://paw8.x51.vn/` | PASS | Trang tải thành công, hiển thị headline, CTA và các khối giới thiệu sản phẩm. |
| TC-02 | Từ landing page bấm `Đến trang đăng nhập` | PASS | Điều hướng sang `/login` thành công. |
| TC-03 | Mở trực tiếp `https://paw8.x51.vn/login` | PASS | Form đăng nhập hiển thị đầy đủ gồm email, mật khẩu, nút đăng nhập. |
| TC-04 | Bấm `Đăng nhập` khi chưa nhập dữ liệu | PASS* | Form không submit thành công. Snapshot không hiện text validation native nên chỉ xác nhận được hành vi chặn submit. |
| TC-05 | Đăng nhập với email đúng, mật khẩu sai | PASS | Hiển thị lỗi `Email hoặc mật khẩu không đúng.`; console có HTTP `401`. |
| TC-06 | Đăng nhập với credential đúng (`platform@paw8.dev` / `Password@123`) từ browser agent | FAIL | Request `POST https://api.paw8.x51.vn/api/v1/auth/login` lỗi `net::ERR_NETWORK_CHANGED`; UI báo `Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.` |
| TC-07 | Vào `Platform Dashboard` sau khi đã có session | PASS | Tải được dashboard `Platform Admin`, hiển thị các khối `Tenants`, `Operations`, `Recent Activity`. |
| TC-08 | Kiểm tra số liệu dashboard | FAIL | Card `Suspended` hiển thị `NaN` thay vì số hợp lệ. |
| TC-09 | Mở menu `Activity` | PASS | Điều hướng sang `/platform/activity`, bảng activity hiển thị các dòng `LOGIN`, `LOGIN_FAILED`. |
| TC-10 | Mở menu `Tenants` | PASS | Điều hướng sang `/platform/tenants`, hiển thị danh sách 10 tenant cùng search/filter/action. |
| TC-11 | Kiểm tra trạng thái tải trang `Tenants` | FAIL | Có hiện tượng flicker: phần tổng số hiển thị `0 total` trước khi quay lại `10 total`. |
| TC-12 | Tìm kiếm tenant với từ khóa `DEMO` | FAIL | Ô search nhận input nhưng bảng không lọc kết quả; danh sách vẫn giữ nguyên đầy đủ. |
| TC-13 | Mở chi tiết tenant demo | PASS | Mở được `/platform/tenants/c9d432ea-9d9a-40e3-b2fd-097a06739169`, hiển thị `Plan & Usage`, `Status Management`, `Edit Details`. |
| TC-14 | Mở `Onboard Wizard` | PASS | Mở được trang wizard `/platform/tenants/onboard`, hiển thị 3 bước `Tenant Info`, `Plan & Limits`, `Owner Account`. |
| TC-15 | Thao tác tiếp trong `Onboard Wizard` | FAIL | Khi thao tác trong wizard, hệ thống phát sinh fallback navigation và `ERR_NETWORK_CHANGED`, làm văng khỏi wizard về `Tenants`; form không ổn định để tiếp tục test validation end-to-end. |
| TC-16 | Đăng xuất `Sign out` | PASS | Thoát phiên thành công và quay về `/login`. |
| TC-17 | Mở `Tenant Admin Dashboard` sau khi user đăng nhập thủ công | PASS | Tải được `/dashboard`, hiển thị các khối tổng quan và menu nghiệp vụ tenant-level. |
| TC-18 | Mở `Khách hàng` | PASS | Tải được `/customers`, hiển thị ô tìm kiếm, nút `+ Thêm khách hàng`, tổng `46` và danh sách dữ liệu thực. |
| TC-19 | Mở `Tài sản` | PASS | Tải được `/assets`, hiển thị bộ lọc, tổng `32`, bảng tài sản và link chi tiết/liên kết hợp đồng. |
| TC-20 | Mở `Hợp đồng` | FAIL | Tải được `/contracts` nhưng danh sách lỗi hiển thị: mã HĐ/khách hàng rỗng, giá trị gốc `NaN`, ngày hết hạn `Invalid Date`. |
| TC-21 | Mở chi tiết một hợp đồng từ danh sách Tenant Admin | FAIL | Khi bấm `Xem`, backend trả `400`; không vào được màn chi tiết hợp đồng. |
| TC-22 | Mở `Báo cáo` | PASS* | Giao diện `/reports` mở được, có tab và bộ lọc ngày; dữ liệu bảng thực tế có tải được trong một số lần render nhưng điều hướng vẫn kèm lỗi mạng/RSC không ổn định. |
| TC-23 | Mở `Người dùng` | PASS | Điều hướng được sang `/users`, hiển thị danh sách người dùng tenant-level. |
| TC-24 | Mở `Cửa hàng` | PASS | Điều hướng được sang `/stores`, hiển thị danh sách cửa hàng của tenant. |
| TC-25 | Mở `Nhật ký hệ thống` | FAIL | `/audit-logs` hiển thị cảnh báo `Không thể tải nhật ký hệ thống.`; console ghi nhận lỗi `500`. |
| TC-26 | Mở `Sàn giao dịch` | PASS | `/marketplace` mở thành công, hiển thị bộ lọc trạng thái, nút `+ Niêm yết mới` và empty state `Chưa có niêm yết`. |
| TC-27 | Đăng xuất từ phiên `Tenant Admin` | PASS | Nút `Đăng xuất` hoạt động, quay lại màn hình `/login`. |

## Lỗi/quan sát chính

### 1. Lỗi login hợp lệ từ browser agent

- Request lỗi: `POST https://api.paw8.x51.vn/api/v1/auth/login`
- Browser event: `net::ERR_NETWORK_CHANGED`
- UI hiển thị: `Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.`

### 2. Số liệu dashboard sai

- Trang: `Platform Dashboard`
- Lỗi: card `Suspended` hiển thị `NaN`
- Mức độ: **High** vì ảnh hưởng trực tiếp độ tin cậy dữ liệu quản trị.

### 3. Search tenant không hoạt động

- Trang: `Tenants`
- Bước test: nhập `DEMO` vào ô `Search by name or code…`
- Kết quả thực tế: danh sách không lọc
- Mức độ: **High** vì làm hỏng chức năng tra cứu chính.

### 4. Wizard onboard không ổn định

- Trang: `Onboard Wizard`
- Khi thao tác, xuất hiện lỗi `ERR_NETWORK_CHANGED` / fallback navigation
- Hệ thống tự điều hướng về `Tenants`, không giữ được trạng thái form
- Mức độ: **High** vì chặn luồng tạo tenant mới.

### 5. Nhiều request `_rsc` bị aborted / 403

- Quan sát xuyên suốt tại các route `/platform/dashboard`, `/platform/activity`, `/platform/tenants`, `/platform/tenants/onboard`
- Dấu hiệu gồm:
  - `net::ERR_ABORTED`
  - `403`
  - `Failed to fetch RSC payload ... Falling back to browser navigation`
- Mức độ: **Medium-High** vì dù một số màn hình vẫn mở được, tính ổn định điều hướng kém rõ rệt.

### 6. Danh sách hợp đồng Tenant Admin hiển thị sai dữ liệu

- Trang: `Hợp đồng` (`/contracts`)
- Hiện trạng quan sát được:
  - cột `Mã HĐ` rỗng
  - cột `Khách hàng` rỗng
  - cột `Gốc` hiển thị `NaN`
  - cột `Ngày hết hạn` hiển thị `Invalid Date`
- Mức độ: **High** vì làm hỏng màn hình nghiệp vụ cốt lõi của tenant.

### 7. Chi tiết hợp đồng trả lỗi `400`

- Trang: `Hợp đồng` → `Xem`
- Hiện trạng: click vào chi tiết bất kỳ phát sinh lỗi backend `400`
- Tác động: không thể kiểm tra hoặc thao tác happy-path trên contract detail
- Mức độ: **High**.

### 8. Audit logs tenant-level lỗi `500`

- Trang: `Nhật ký hệ thống` (`/audit-logs`)
- Hiện trạng: UI báo `Không thể tải nhật ký hệ thống.` và bảng không có dữ liệu sử dụng được
- Console/network: phản hồi `500`
- Mức độ: **High** vì chặn tính năng truy vết/audit cho tenant admin.

## Bằng chứng hành vi đã xác nhận

- `Activity` hiển thị đúng các bản ghi hoạt động platform-level.
- `Tenants` hiển thị danh sách 10 tenant và có link `View →` hoạt động.
- `Tenant detail` hiển thị đúng thông tin plan, usage, status management, edit details.
- `Sign out` hoạt động và trả về màn hình đăng nhập.
- `Customers` hiển thị dữ liệu thực với tổng số, tìm kiếm và link `Xem` cho từng khách hàng.
- `Assets` hiển thị dữ liệu thực, bộ lọc trạng thái/loại, định giá và liên kết sang hợp đồng.
- `Reports` mở được giao diện và có lúc tải được bảng dữ liệu hợp đồng thực tế.
- `Marketplace` mở được giao diện quản lý niêm yết và xử lý empty-state đúng.
- `Tenant Admin` logout hoạt động và quay lại `/login`.

## Đối chiếu nhanh với mã nguồn

- Web gọi login qua `POST /auth/login` trong `apps/web/contexts/auth.tsx`
- Base API production trong web image: `https://api.paw8.x51.vn/api/v1`
- Backend auth service trong `libs/auth/src/auth.service.ts` trả:
  - `accessToken`
  - `refreshToken`
  - `expiresIn`

Điều này cho thấy lỗi login hợp lệ quan sát được nhiều khả năng nằm ở runtime production hoặc lớp network/proxy hơn là sai contract field trong mã nguồn hiện tại.

## Hạng mục chưa kiểm thử hết

- Đăng nhập end-to-end thành công bằng browser agent cho toàn bộ role
- Redirect mặc định theo từng role
- Validation đầy đủ của wizard onboard
- Chức năng tạo/cập nhật/suspend tenant thực tế
- Các thao tác create/edit sâu của tenant modules (`customers`, `assets`, `contracts`, `marketplace`)

## Khuyến nghị ưu tiên

1. Điều tra lỗi production liên quan `ERR_NETWORK_CHANGED`, `_rsc` aborted, và `403` trên các route platform.
2. Sửa phép tính hoặc binding dữ liệu cho card `Suspended` trên dashboard.
3. Kiểm tra lại logic search/filter phía client hoặc API của trang `Tenants`.
4. Ổn định luồng `Onboard Wizard`, đặc biệt phần server component navigation/fetch khi nhập form.
5. Sửa mapping/format dữ liệu ở danh sách `Hợp đồng` và lỗi API `400` tại màn chi tiết hợp đồng tenant-level.
6. Điều tra lỗi `500` của `Nhật ký hệ thống` tenant-level.
7. Sau khi sửa, chạy lại regression cho toàn bộ role trong `credential.txt`.

## Kết luận

- Public pages: **đạt**
- Sai mật khẩu: **đạt**
- Dashboard và điều hướng platform admin: **mở được nhưng có lỗi dữ liệu và lỗi ổn định**
- `Tenants` list và tenant detail: **mở được nhưng search hỏng**
- `Onboard Wizard`: **mở được nhưng không ổn định để sử dụng**
- `Tenant Admin Dashboard`, `Customers`, `Assets`, `Users`, `Stores`, `Marketplace`: **mở được và có thể xem dữ liệu/list cơ bản**
- `Contracts`: **mở được nhưng lỗi dữ liệu nghiêm trọng, không xem được chi tiết**
- `Reports`: **mở được nhưng còn không ổn định do lỗi mạng/RSC**
- `Audit Logs`: **fail do backend trả 500**
- `Logout`: **đạt**
