## ADDED Requirements

### Requirement: Security guide documents JWT RS256 setup
docs/security.md SHALL document the JWT RS256 configuration: key generation, key file paths (JWT_PRIVATE_KEY_PATH, JWT_PUBLIC_KEY_PATH), token payload structure (`{ sub, tenantId, role, allowedStoreIds[] }`), and expiry settings.

#### Scenario: Developer sets up JWT for a new environment
- **WHEN** a developer follows the JWT setup section
- **THEN** they can generate RS256 keys and configure the API to sign and verify tokens

### Requirement: Security guide explains tenant isolation enforcement
docs/security.md SHALL document how tenant isolation is enforced: TenantGuard in `libs/common/src/guards/tenant.guard.ts`, the rule that tenantId MUST come from `currentUser.tenantId` (JWT), and that frontend MUST NOT pass tenant_id.

#### Scenario: Security reviewer checks tenant isolation
- **WHEN** a security reviewer reads the tenant isolation section
- **THEN** they understand the enforcement mechanism and where in the code it is applied

### Requirement: Security guide explains store-scope permission
docs/security.md SHALL document the StoreScopeGuard in `libs/common/src/guards/store-scope.guard.ts`: which roles bypass it (platform_admin, tenant_owner, tenant_admin), how it checks storeId against `currentUser.allowedStoreIds`, and where it is applied.

#### Scenario: Security reviewer checks store-scope enforcement
- **WHEN** a security reviewer checks whether a staff user can access another store's contracts
- **THEN** the guide explains which guard prevents this and where it is registered

### Requirement: Security guide documents file access policy
docs/security.md SHALL document the file access policy: how object keys are prefixed by tenant (`tenants/{tenantId}/...`), how `confirmUpload` verifies prefix ownership, and how download URLs require permission checks before presigned URL generation.

#### Scenario: Developer implements a new file entity type
- **WHEN** a developer adds a new entity type that has files
- **THEN** the security guide explains the required checks before issuing presigned URLs

### Requirement: Security guide documents audit log coverage
docs/security.md SHALL list all 15+ auditable events that are recorded in audit_logs, the fields captured per event (tenant, store, user, action, entity_type, entity_id, old_value, new_value, ip, user_agent, created_at), and the AuditInterceptor mechanism.

#### Scenario: Compliance reviewer checks audit coverage
- **WHEN** a compliance reviewer asks whether contract settlements are audited
- **THEN** the security guide lists "settlement" as a covered event with all captured fields

### Requirement: Security guide documents password security
docs/security.md SHALL document password hashing (bcrypt with salt rounds), password change requirements, and the prohibition on storing plaintext passwords.

#### Scenario: Security reviewer checks password storage
- **WHEN** a security reviewer checks password security
- **THEN** the guide confirms bcrypt is used and specifies the salt round configuration
