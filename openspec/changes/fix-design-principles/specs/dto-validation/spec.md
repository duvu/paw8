## ADDED Requirements

### Requirement: Global ValidationPipe enforces DTO contracts
The NestJS application SHALL configure a global `ValidationPipe` in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`. The pipe SHALL be registered before any route handlers are invoked.

#### Scenario: Valid payload passes validation
- **WHEN** a client sends a request body that matches the DTO schema exactly
- **THEN** the request proceeds to the controller with the transformed and typed DTO object

#### Scenario: Unknown fields are rejected
- **WHEN** a client sends a request body with fields not declared in the DTO
- **THEN** the API returns HTTP 400 with a validation error listing the unknown fields

#### Scenario: Missing required fields return 400
- **WHEN** a client omits a field annotated with `@IsNotEmpty()` or equivalent
- **THEN** the API returns HTTP 400 with a human-readable validation error message

### Requirement: All request DTOs have class-validator annotations
Every DTO class used as a controller method parameter (body, query, param) across all domain libs SHALL have `class-validator` decorators on each field. At minimum: `@IsString()`, `@IsNumber()`, `@IsUUID()`, `@IsEnum()`, `@IsOptional()` as appropriate.

#### Scenario: DTO fields validated by type
- **WHEN** a client sends a string value for a field annotated `@IsNumber()`
- **THEN** the ValidationPipe returns HTTP 400 before the service method is called
