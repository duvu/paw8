# Design: complete-rbac-enforcement

## Design Decisions

### D1: Role Assignment Matrix

The authoritative mapping of roles to endpoint permissions:

| Endpoint | platform_admin | tenant_owner | tenant_admin | store_manager | staff | accountant |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Customers** | | | | | | |
| GET /customers (search) | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /customers/:id | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /customers/:id/contracts | | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /customers | | ✅ | ✅ | ✅ | ✅ | |
| PATCH /customers/:id | | ✅ | ✅ | ✅ | ✅ | |
| **Assets** | | | | | | |
| GET /assets | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /assets/:id | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /assets/inventory | | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Contracts** | | | | | | |
| GET /contracts | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /contracts/:id | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /contracts/:id/allowed-transitions | | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transactions** | | | | | | |
| GET /transactions/contract/:contractId | | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /transactions/calculate-settlement | | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Files** | | | | | | |
| POST /files/upload-url | | ✅ | ✅ | ✅ | ✅ | |
| POST /files/confirm | | ✅ | ✅ | ✅ | ✅ | |
| GET /files/:id/download-url | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /files/entity/:entityType/:entityId | | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Users** | | | | | | |
| GET /users/:id | | ✅ | ✅ | ✅ | | |
| **Stores** | | | | | | |
| GET /stores/:id | | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Interest Policies** | | | | | | |
| GET /interest-policies | | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /interest-policies/:id | | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /interest-policies | | ✅ | ✅ | | | |
| PATCH /interest-policies/:id | | ✅ | ✅ | | | |
| POST /interest-policies/:id/set-default | | ✅ | ✅ | | | |

**Rationale**:
- `platform_admin` excluded from tenant-scoped endpoints (they operate at platform level, not tenant data)
- `accountant` read-only: can read customers/assets/contracts/transactions/files/stores/interest policies but cannot create/modify customers, upload files, or manage interest policies
- `staff` cannot manage users (no GET /users/:id) — they don't need to look up other users
- `store_manager` can view users (needed for managing staff assignments)
- Interest policy mutation (POST/PATCH/set-default) restricted to `tenant_owner` and `tenant_admin` only

### D2: InterestPoliciesController Fix Pattern

`InterestPoliciesController` currently uses only `@UseGuards(AuthGuard('jwt'))` at the class level. This means `RolesGuard` is never invoked.

Fix: Replace `@UseGuards(AuthGuard('jwt'))` with `@UseGuards(AuthGuard('jwt'), RolesGuard)` at class level, then add `@Roles(...)` to each method individually.

This matches the pattern used in `ContractsController`, `TransactionsController`, etc.

### D3: Consistent Guard Ordering

All controllers that use role enforcement must follow this pattern:
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)  // class-level
@Roles('role1', 'role2')                   // method-level
```

Never use `RolesGuard` without `AuthGuard('jwt')` — the JWT guard populates `req.user` which `RolesGuard` reads.

### D4: No Wildcard Role

Do not create a "read-all" shorthand. Always list roles explicitly. This ensures:
- New roles added in future require conscious opt-in per endpoint
- Audit trail is clear
- No surprise access when role definitions change

### D5: Auth Endpoints Are Correctly Exempt

`POST /auth/login` and `POST /auth/refresh` use `@Public()` — correct, no change.
`POST /auth/logout` and `POST /auth/change-password` have `AuthGuard('jwt')` only — correct, any authenticated user can change their own password or log out.

### D6: Verification Strategy

After all annotations added:
1. `tsc --noEmit` — must be clean
2. Start server, attempt to access a customers endpoint with a JWT for `platform_admin` role → expect 403
3. Access same endpoint with `staff` JWT → expect 200 (tenant-scoped)
4. Attempt interest policy mutation with `staff` JWT → expect 403
5. Attempt interest policy mutation with `tenant_admin` JWT → expect 200 or 201
