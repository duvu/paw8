## ADDED Requirements

### Requirement: OpenAPI documentation served at /api/docs
The NestJS application SHALL serve a Swagger UI at `/api/docs` using `@nestjs/swagger`. The documentation SHALL be generated from controller decorators and DTO property annotations.

#### Scenario: Swagger UI accessible in development
- **WHEN** the server is running in non-production mode and a browser navigates to `GET /api/docs`
- **THEN** the Swagger UI renders with all documented endpoints grouped by API tag

#### Scenario: Swagger hidden in production
- **WHEN** `NODE_ENV === 'production'`
- **THEN** the `/api/docs` route is not registered and returns 404

### Requirement: All DTO fields annotated with @ApiProperty
Every DTO class field used in a controller endpoint SHALL have an `@ApiProperty()` decorator describing its type, example value, and whether it is required or optional.

#### Scenario: DTO field appears in Swagger schema
- **WHEN** Swagger scans a request DTO
- **THEN** every declared field appears in the generated JSON Schema with correct type information

### Requirement: Controllers annotated with @ApiTags and @ApiBearerAuth
Every NestJS controller that handles authenticated routes SHALL have `@ApiTags('<domain>')` and `@ApiBearerAuth()` decorators.

#### Scenario: Endpoints grouped by domain in Swagger UI
- **WHEN** the Swagger UI loads
- **THEN** endpoints are organized into collapsible groups matching domain names (auth, tenants, stores, users, customers, assets, contracts, transactions, files, reports, audit)
