# API Reference

This reference describes the current HTTP API exposed by the NestJS application in `apps/api-gateway/`.

## Global Conventions

- Base URL: `/api/v1`
- Default local base URL: `http://localhost:3000/api/v1`
- Authentication: bearer JWT unless an endpoint is explicitly public
- Validation: global whitelist is enabled, non-whitelisted fields are rejected, implicit conversion is enabled
- Roles: `RolesGuard` is used alongside `AuthGuard('jwt')`; endpoints without explicit `@Roles(...)` are effectively available to any authenticated user
- Error envelope: `{ statusCode, timestamp, error }`
- Error localization: translated through `nestjs-i18n` when mappings exist and `Accept-Language` is provided

Recommended shell helpers:

```bash
export API_BASE_URL="http://localhost:3000/api/v1"
export TOKEN="<paste-access-token-here>"
```

## Important Current-State Notes

- The backend returns `accessToken`, not `access_token`.
- There is no `GET /transactions` endpoint. The current read endpoint is `GET /transactions/contract/:contractId`.
- There is no `GET /contracts/:id/calculate-interest` endpoint.
- Current report endpoints are `/reports/stores`, `/reports/staff`, and `/reports/assets/inventory`.
- The current audit endpoint is `/audit/logs`.

## Auth

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Body: `email`, `password` | `{ accessToken, refreshToken, expiresIn }` | Rejects invalid credentials, locked user, or locked tenant |
| `POST` | `/auth/refresh` | Public | Body: `refreshToken` | `{ accessToken, expiresIn }` | Refresh token must exist, be unrevoked, and be unexpired |
| `POST` | `/auth/logout` | JWT | No body | `204 No Content` | Revokes active refresh tokens for current user |
| `POST` | `/auth/change-password` | JWT | Body: `currentPassword`, `newPassword` | `204 No Content` | Verifies current password first |

### Request fields

- `POST /auth/login`
  - `email: string`
  - `password: string` with minimum length `6`
- `POST /auth/refresh`
  - `refreshToken: string`
- `POST /auth/change-password`
  - `currentPassword: string` with minimum length `6`
  - `newPassword: string` with minimum length `8`

### Example

```bash
curl -X POST "$API_BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"platform@paw8.dev","password":"Password@123"}'
```

## Tenants

All tenant-management endpoints are restricted to `platform_admin`.

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/tenants` | JWT + `platform_admin` | Body: `name`, `code`, `plan`, `maxStores`, `maxUsers`, `trialEndDate?` | tenant object | Creates a tenant |
| `GET` | `/tenants` | JWT + `platform_admin` | Query: `page?`, `limit?` | `{ data, total, page, limit }` | Paginated list |
| `GET` | `/tenants/:id` | JWT + `platform_admin` | Path: tenant UUID | tenant object | Fetch by id |
| `PATCH` | `/tenants/:id` | JWT + `platform_admin` | Body: partial tenant fields | tenant object | Updates tenant data |
| `PATCH` | `/tenants/:id/status` | JWT + `platform_admin` | Body: `status` | tenant object | Status-only update |

### Key request enums

- `plan`: `free | starter | professional | enterprise`
- `status`: `active | suspended | trial | expired`

### Example

```bash
curl "$API_BASE_URL/tenants?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

## Stores

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/stores` | JWT + `tenant_owner | tenant_admin` | Body: `name`, `code`, `address?`, `phone?`, `managerUserId?` | store object | Tenant comes from JWT |
| `GET` | `/stores` | JWT + `tenant_owner | tenant_admin | store_manager | accountant` | Query: `page?`, `limit?` | `{ data, total, page, limit }` | Tenant-scoped list |
| `GET` | `/stores/:id` | JWT | Path: store UUID | store object | No explicit role metadata on this route |
| `PATCH` | `/stores/:id` | JWT + `tenant_owner | tenant_admin` | Body: partial store fields | store object | Updates store data |
| `PATCH` | `/stores/:id/status` | JWT + `tenant_owner | tenant_admin` | Body: `status` | store object | Status-only update |
| `PATCH` | `/stores/:id/manager` | JWT + `tenant_owner | tenant_admin` | Body: `userId` | store object | Assigns manager |

### Key request enums

- `status`: `active | inactive`

### Example

```bash
curl -X POST "$API_BASE_URL/stores" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Branch 2","code":"HN02","address":"456 Street","phone":"0900000000"}'
```

## Users

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/users` | JWT + `tenant_owner | tenant_admin` | Body: `email`, `fullName`, `phone?`, `password`, `role` | user object | Password is bcrypt-hashed |
| `GET` | `/users` | JWT + `tenant_owner | tenant_admin | store_manager` | Query: `page?`, `limit?` | `{ data, total }` | Paginated list |
| `GET` | `/users/:id` | JWT | Path: user UUID | user object | No explicit role metadata on this route |
| `PATCH` | `/users/:id` | JWT + `tenant_owner | tenant_admin` | Body: `fullName?`, `phone?`, `status?` | user object | Partial update |
| `PATCH` | `/users/:id/status` | JWT + `tenant_owner | tenant_admin` | Body: `status` | user object | Status-only update |
| `POST` | `/users/:id/stores` | JWT + `tenant_owner | tenant_admin` | Body: `storeIds[]` | `200 OK` | Replaces store assignments |

### Key request enums

- `role`: `tenant_owner | tenant_admin | store_manager | staff | accountant`
- `status`: `active | inactive | locked`

### Example

```bash
curl -X POST "$API_BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"email":"new.user@demo.paw8.dev","fullName":"New User","password":"Password@123","role":"staff"}'
```

## Customers

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/customers` | JWT | Body: customer profile fields | customer object | Duplicate identity and phone checks are tenant-scoped |
| `GET` | `/customers` | JWT | Query: `query?`, `page?`, `limit?` | `{ data, total }` | Searches by name, phone, or identity |
| `GET` | `/customers/:id` | JWT | Path: customer UUID | customer object | Tenant-scoped lookup |
| `GET` | `/customers/:id/contracts` | JWT | Path: customer UUID | contract history array | Returns summary contract history |
| `PATCH` | `/customers/:id` | JWT | Body: partial customer fields | customer object | Partial update |

### Main create/update fields

- `fullName`
- `phone`
- `identityNumber`
- `dateOfBirth`
- `permanentAddress`
- `currentAddress`
- `occupation`
- `emergencyContactName`
- `emergencyContactPhone`
- `notes`

### Example

```bash
curl -X POST "$API_BASE_URL/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Nguyen Van A","phone":"0901111111","identityNumber":"012345678901"}'
```

## Assets

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/assets/inventory` | JWT | Query: `storeId?` | inventory rows | Returns asset location/inventory view |
| `POST` | `/assets` | JWT + `staff | store_manager | tenant_admin | tenant_owner` | Body: asset fields | asset object | Store is inferred from the current user in create flow |
| `GET` | `/assets` | JWT | Query: `query?`, `storeId?`, `status?`, `page?`, `limit?` | `{ data, total }` | Search supports serial, IMEI, and license plate |
| `GET` | `/assets/:id` | JWT | Path: asset UUID | asset detail | Includes inventory-related fields in service output |
| `PATCH` | `/assets/:id` | JWT + `staff | store_manager | tenant_admin | tenant_owner` | Body: partial asset fields | asset object | Partial update |
| `PATCH` | `/assets/:id/status` | JWT + `store_manager | tenant_admin | tenant_owner` | Body: `status` | asset object | Status-only update |

### Key request enums

- `assetType`: `motorcycle | car | phone | laptop | watch | jewelry | electronics | other`
- `status`: `pawned | redeemed | overdue | pending_liquidation | liquidated`

### Example

```bash
curl -X POST "$API_BASE_URL/assets" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"assetType":"phone","assetName":"iPhone 14","imei":"123456789012345","valuationAmount":10000000,"proposedLoanAmount":7000000}'
```

## Contracts

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/contracts` | JWT + `staff | store_manager | tenant_admin | tenant_owner` | Body: `storeId`, `customerId`, `assetIds[]`, `principalAmount`, `interestRate`, `interestType`, `startDate`, `dueDate`, `notes?` | contract detail | Generates contract code and links assets |
| `GET` | `/contracts` | JWT | Query: `contractCode?`, `customerId?`, `storeId?`, `status?`, `dueDateFrom?`, `dueDateTo?`, `page?`, `limit?` | `{ data, total, page, limit }` | Includes customer fields in list rows |
| `GET` | `/contracts/upcoming-due` | JWT + `store_manager | tenant_admin | tenant_owner` | Query: `days?`, `storeId?` | due-soon rows | Defaults to `7` days |
| `GET` | `/contracts/overdue` | JWT + `store_manager | tenant_admin | tenant_owner` | Query: `storeId?` | overdue rows | Includes `days_overdue` |
| `GET` | `/contracts/:id` | JWT | Path: contract UUID | contract detail | Includes assets and customer |
| `PATCH` | `/contracts/:id` | JWT + `staff | store_manager | tenant_admin | tenant_owner` | Body: `notes?`, `dueDate?` | contract detail | Due date cannot be changed once transactions exist |
| `PATCH` | `/contracts/:id/status` | JWT + `store_manager | tenant_admin | tenant_owner` | Body: `status` | contract detail | Writes contract status history |

### Key request enums

- `interestType`: `daily | monthly | term`
- `status`: `draft | active | near_due | overdue | extended | settled | cancelled | liquidation_pending | liquidated`

### Example

```bash
curl -X POST "$API_BASE_URL/contracts" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"storeId":"<store-id>","customerId":"<customer-id>","assetIds":["<asset-id>"],"principalAmount":5000000,"interestRate":3.5,"interestType":"monthly","startDate":"2026-05-01","dueDate":"2026-06-01"}'
```

## Transactions

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/transactions` | JWT + `staff | store_manager | tenant_admin | tenant_owner` | Body: `contractId`, `transactionType`, `amount`, `paymentMethod`, `transactionDate`, `note?`, `referenceTransactionId?` | `{ transaction, contractStatus }` | Main write endpoint |
| `GET` | `/transactions/contract/:contractId` | JWT | Path: contract UUID | transaction array | Current read endpoint for transaction history |
| `POST` | `/transactions/calculate-settlement` | JWT | Body: `contractId`, `settlementDate` | settlement object | Returns `principalAmount`, `interestDue`, `feeDue`, `totalDue`, `alreadyPaid`, `remaining` |
| `POST` | `/transactions/extend` | JWT + `staff | store_manager | tenant_admin | tenant_owner` | Body: `contractId`, `newDueDate`, `interestPaid`, `feeAmount?`, `paymentMethod`, `note?` | `{ transaction, newDueDate }` | Records extension workflow |
| `POST` | `/transactions/:id/void` | JWT + `store_manager | tenant_admin | tenant_owner` | Body: `reason` | void transaction row | Append-only correction flow |

### Key request enums

- `transactionType`: `disbursement | interest_collection | fee_collection | extension | partial_principal | settlement | adjustment | void | reversal`
- `paymentMethod`: `cash | bank_transfer | other`

### Example

```bash
curl -X POST "$API_BASE_URL/transactions/calculate-settlement" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"contractId":"<contract-id>","settlementDate":"2026-05-29"}'
```

## Files

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/files/upload-url` | JWT | Body: `entityType`, `entityId`, `storeId?`, `originalFilename`, `mimeType`, `fileSize` | `{ uploadUrl, objectKey, expiresIn }` | Validates target entity belongs to tenant |
| `POST` | `/files/confirm` | JWT | Body: `uploadToken`, `fileSize?` | file object | `uploadToken` is effectively the generated object key |
| `GET` | `/files/:id/download-url` | JWT | Path: file UUID | `{ downloadUrl, expiresIn }` | Looks up file by `id` and `tenant_id` |
| `GET` | `/files/entity/:entityType/:entityId` | JWT | Path: entity type and UUID | file array | Lists file metadata for one entity |
| `DELETE` | `/files/:id` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager` | Path: file UUID | `204 No Content` | Deletes object best-effort, then metadata row |

### Key request enums

- `entityType`: `customer | asset | contract | receipt`

### Example

```bash
curl -X POST "$API_BASE_URL/files/upload-url" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"entityType":"customer","entityId":"<customer-id>","originalFilename":"id-front.jpg","mimeType":"image/jpeg","fileSize":123456}'
```

## Reports

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/reports/dashboard` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager` | Query: `storeId?`, `dateFrom?`, `dateTo?` | dashboard object | Key operational totals |
| `GET` | `/reports/contracts` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager` | Query: report filters | paged result | Contract report rows |
| `GET` | `/reports/collections` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager | accountant` | Query: report filters | paged result | Collection transaction rows |
| `GET` | `/reports/outstanding` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager | accountant` | Query: report filters | paged result | Outstanding principal view |
| `GET` | `/reports/overdue` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager` | Query: report filters | paged result | Overdue contract rows |
| `GET` | `/reports/stores` | JWT + `platform_admin | tenant_owner | tenant_admin` | Query: report filters | summary array | Store aggregates |
| `GET` | `/reports/staff` | JWT + `platform_admin | tenant_owner | tenant_admin | store_manager` | Query: report filters | summary array | Staff aggregates |
| `GET` | `/reports/assets/inventory` | JWT | Query: report filters | paged result | No explicit `@Roles(...)` on current controller method |

### Shared report query fields

- `storeId`
- `dateFrom`
- `dateTo`
- `status`
- `staffId`
- `assetType`
- `page`
- `limit`

### Example

```bash
curl "$API_BASE_URL/reports/dashboard?dateFrom=2026-05-01&dateTo=2026-05-31" \
  -H "Authorization: Bearer $TOKEN"
```

## Audit

| Method | Path | Auth | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/audit/logs` | JWT + `tenant_owner | tenant_admin | store_manager | accountant` | Query: `storeId?`, `userId?`, `action?`, `entityType?`, `entityId?`, `dateFrom?`, `dateTo?`, `page?`, `limit?` | `{ data, total, page, limit }` | Queries audit log rows |

### Example

```bash
curl "$API_BASE_URL/audit/logs?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Codes

Common HTTP statuses visible in the current codebase:

| Status | Meaning | Typical examples |
| --- | --- | --- |
| `400` | Validation or business rule failure | bad DTO payload, invalid contract state, invalid upload token format |
| `401` | Authentication failure | invalid credentials, invalid or expired refresh token |
| `403` | Authorization or account-state failure | role denied, locked account, locked tenant, tenant mismatch |
| `404` | Resource not found | tenant, store, user, customer, asset, contract, file, or transaction missing |
| `409` | Conflict | duplicate customer phone or identity number |
| `500` | Unexpected server error | unhandled internal failure |

Representative error envelope:

```json
{
  "statusCode": 401,
  "timestamp": "2026-05-29T12:00:00.000Z",
  "error": "Invalid email or password"
}
```

The `error` field may be a string or an array, and localized messages depend on `Accept-Language` plus the filter's translation mapping.

## Known Client/Backend Mismatches

- `apps/web/contexts/auth.tsx` expects `access_token`, but the API returns `accessToken`.
- `apps/mobile/lib/features/auth/data/auth_repository.dart` also expects `access_token`.
- `apps/web/app/(dashboard)/reports/page.tsx` currently calls `/reports/by-store`, `/reports/by-staff`, and `/reports/inventory`, which do not match the backend controller paths.
- `apps/web/app/(dashboard)/audit-logs/page.tsx` currently calls `/audit-logs`, while the backend route is `/audit/logs`.
