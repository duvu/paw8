## ADDED Requirements

### Requirement: Presigned upload URL
The system SHALL generate presigned MinIO PUT URLs after validating tenant membership, entity ownership, and store scope.

#### Scenario: Request presigned upload URL
- **WHEN** authenticated user calls `POST /api/v1/files/presigned-upload` with `entityType`, `entityId`, `filename`, `mimeType`
- **THEN** the system validates permissions, generates `objectKey = tenants/{tenantId}/{entityType}s/{entityId}/{filename}`, and returns `{ uploadUrl, objectKey, expiresIn }`

#### Scenario: Cross-tenant upload blocked
- **WHEN** a user requests an upload URL for an entity belonging to a different tenant
- **THEN** the system returns HTTP 403

### Requirement: Confirm upload and persist metadata
The system SHALL save file metadata to the `files` table only after the client confirms the upload completed.

#### Scenario: Confirm upload
- **WHEN** client calls `POST /api/v1/files/confirm` with `objectKey`, `originalFilename`, `mimeType`, `fileSize`
- **THEN** the system inserts a row in `files` with all metadata including `tenant_id`, `entity_type`, `entity_id`, `uploaded_by`

#### Scenario: Confirm with mismatched tenant in objectKey
- **WHEN** the `objectKey` tenant prefix does not match `currentUser.tenantId`
- **THEN** the system returns HTTP 403

### Requirement: Presigned download URL
The system SHALL generate presigned MinIO GET URLs after verifying tenant + entity ownership + store scope.

#### Scenario: Request presigned download URL
- **WHEN** authenticated user calls `GET /api/v1/files/:id/download-url`
- **THEN** the system checks tenant and store scope, then returns a short-lived presigned GET URL

#### Scenario: File from another tenant
- **WHEN** a user requests download URL for a file with different `tenant_id`
- **THEN** the system returns HTTP 404

### Requirement: Orphan object cleanup
The system SHALL run a scheduled job to delete MinIO objects that have no matching `files` record after 24 hours.

#### Scenario: Orphan cleanup
- **WHEN** the cleanup job runs and finds an object older than 24h without a `files` record
- **THEN** the object is deleted from MinIO and logged
