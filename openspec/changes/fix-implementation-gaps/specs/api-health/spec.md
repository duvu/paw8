## ADDED Requirements

### Requirement: API liveness endpoint
The system SHALL expose a `GET /api/v1/health` endpoint that returns HTTP 200 and a JSON body confirming the service is alive. The endpoint SHALL be public (no authentication required). The endpoint SHALL return at minimum `{ "status": "ok", "timestamp": "<ISO-8601>" }`.

#### Scenario: Healthy API responds to liveness probe
- **WHEN** a client sends `GET /api/v1/health` with no authentication
- **THEN** the API returns HTTP 200 with body `{ "status": "ok", "timestamp": "..." }`

#### Scenario: Liveness probe is accessible without a JWT
- **WHEN** a client sends `GET /api/v1/health` with no Authorization header
- **THEN** the API returns HTTP 200 (not 401)
