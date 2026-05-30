## 1. Auth Service — Cache JWT Keys

- [x] 1.1 Read `libs/auth/src/auth.service.ts` and identify all `readFileSync` call sites
- [x] 1.2 Add `private readonly privateKey: string` and `private readonly publicKey: string` properties to `AuthService`
- [x] 1.3 Move `readFileSync(privateKeyPath)` and `readFileSync(publicKeyPath)` calls into the constructor body
- [x] 1.4 Replace all per-method `readFileSync` calls with `this.privateKey` / `this.publicKey`
- [x] 1.5 Verify `AuthService` still compiles and `POST /api/v1/auth/login` returns a valid JWT

## 2. Global ValidationPipe

- [x] 2.1 Install `class-validator` and `class-transformer` if not already in `package.json`
- [x] 2.2 Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` in `apps/api-gateway/src/main.ts`
- [x] 2.3 Audit and annotate all DTO files in `libs/customers/src/dto/` with `class-validator` decorators
- [x] 2.4 Audit and annotate all DTO files in `libs/contracts/src/dto/` with `class-validator` decorators
- [x] 2.5 Audit and annotate all DTO files in `libs/assets/src/dto/` with `class-validator` decorators
- [x] 2.6 Audit and annotate all DTO files in `libs/transactions/src/dto/` with `class-validator` decorators
- [x] 2.7 Audit and annotate all DTO files in `libs/stores/src/dto/` with `class-validator` decorators
- [x] 2.8 Audit and annotate all DTO files in `libs/tenants/src/dto/` with `class-validator` decorators
- [x] 2.9 Audit and annotate all DTO files in `libs/users/src/dto/` with `class-validator` decorators
- [x] 2.10 Audit and annotate all DTO files in `libs/auth/src/dto/` with `class-validator` decorators
- [x] 2.11 Audit and annotate all DTO files in `libs/files/src/dto/` with `class-validator` decorators
- [x] 2.12 Test that a request with an unknown field returns HTTP 400
- [x] 2.13 Test that a request with a missing required field returns HTTP 400

## 3. Contract Code Generation Deduplication

- [x] 3.1 Read `libs/contracts/src/contracts.service.ts` and locate both the `generateContractCode()` method and any duplicate sequence logic inside `create()`
- [x] 3.2 Extract a single `private async _generateContractCode(manager, tenantId: string, storeId: string): Promise<string>` helper
- [x] 3.3 Replace all call sites to use this single helper
- [x] 3.4 Verify contract creation still generates the correct `{store_code}-{YYYYMM}-{seq}` code

## 4. Repository Layer

- [x] 4.1 Create `libs/customers/src/customers.repository.ts` — move all `dataSource.query()` calls from `CustomersService` into typed repository methods
- [x] 4.2 Register `CustomersRepository` as a provider in `CustomersModule`; inject it into `CustomersService`
- [x] 4.3 Create `libs/contracts/src/contracts.repository.ts` — move all `dataSource.query()` / `dataSource.transaction()` calls from `ContractsService`
- [x] 4.4 Register `ContractsRepository` in `ContractsModule`; inject into `ContractsService`
- [x] 4.5 Create `libs/assets/src/assets.repository.ts` and wire into `AssetsModule`
- [x] 4.6 Create `libs/transactions/src/transactions.repository.ts` and wire into `TransactionsModule`
- [x] 4.7 Create `libs/stores/src/stores.repository.ts` and wire into `StoresModule`
- [x] 4.8 Create `libs/tenants/src/tenants.repository.ts` and wire into `TenantsModule`
- [x] 4.9 Create `libs/users/src/users.repository.ts` and wire into `UsersModule`
- [x] 4.10 Create `libs/files/src/files.repository.ts` and wire into `FilesModule`
- [x] 4.11 Create `libs/reports/src/reports.repository.ts` and wire into `ReportsModule`
- [x] 4.12 Create `libs/audit/src/audit.repository.ts` and wire into `AuditModule`
- [x] 4.13 Verify no `dataSource.query()` call remains in any `*.service.ts` file

## 5. Shared Types Package

- [x] 5.1 Run `nest g library shared-types` to scaffold `libs/shared-types/`
- [x] 5.2 Remove all generated NestJS boilerplate from `libs/shared-types/src/`; keep only the index barrel
- [x] 5.3 Create `libs/shared-types/src/auth.types.ts` with `LoginRequestDto`, `LoginResponseDto`, `TokenPayload` interfaces
- [x] 5.4 Create `libs/shared-types/src/customers.types.ts` with `CreateCustomerRequest`, `CustomerResponse`, `CustomerListResponse` interfaces
- [x] 5.5 Create `libs/shared-types/src/contracts.types.ts` with `CreateContractRequest`, `ContractResponse`, `ContractListResponse` interfaces
- [x] 5.6 Create `libs/shared-types/src/assets.types.ts` with `CreateAssetRequest`, `AssetResponse` interfaces
- [x] 5.7 Create `libs/shared-types/src/transactions.types.ts` with transaction request/response interfaces
- [x] 5.8 Export all interfaces from `libs/shared-types/src/index.ts`
- [x] 5.9 Add `@paw8/shared-types` path alias to `apps/web/tsconfig.json`
- [x] 5.10 Replace hand-maintained frontend type definitions in `apps/web/` with imports from `@paw8/shared-types`
- [x] 5.11 Verify `libs/shared-types/package.json` has zero runtime `dependencies`

## 6. Swagger / OpenAPI

- [x] 6.1 Install `@nestjs/swagger` and `swagger-ui-express` in `apps/api-gateway/package.json`
- [x] 6.2 Add `DocumentBuilder` + `SwaggerModule.createDocument` + `SwaggerModule.setup` in `main.ts`, gated by `NODE_ENV !== 'production'`
- [x] 6.3 Add `@ApiProperty()` decorators to all DTO fields in `libs/auth/src/dto/`
- [x] 6.4 Add `@ApiProperty()` to all DTO fields in `libs/customers/src/dto/`
- [x] 6.5 Add `@ApiProperty()` to all DTO fields in `libs/contracts/src/dto/`
- [x] 6.6 Add `@ApiProperty()` to all DTO fields in `libs/assets/src/dto/`
- [x] 6.7 Add `@ApiProperty()` to all DTO fields in `libs/transactions/src/dto/`
- [x] 6.8 Add `@ApiProperty()` to all DTO fields in `libs/stores/src/dto/`
- [x] 6.9 Add `@ApiProperty()` to all DTO fields in `libs/tenants/src/dto/`
- [x] 6.10 Add `@ApiProperty()` to all DTO fields in `libs/users/src/dto/`
- [x] 6.11 Add `@ApiProperty()` to all DTO fields in `libs/files/src/dto/`
- [x] 6.12 Add `@ApiTags('<domain>')` and `@ApiBearerAuth()` to all controllers across all domain libs
- [x] 6.13 Verify Swagger UI loads at `http://localhost:3000/api/docs` and all endpoints are visible

## 7. Frontend Feature Component Structure

- [x] 7.1 Create `apps/web/components/features/` directory
- [x] 7.2 Create `apps/web/components/features/customers/` and move customer-specific components from pages/components into it
- [x] 7.3 Create `apps/web/components/features/contracts/` and move contract-specific components
- [x] 7.4 Create `apps/web/components/features/assets/` and move asset-specific components
- [x] 7.5 Create `apps/web/components/features/transactions/` and move transaction-specific components
- [x] 7.6 Create `apps/web/components/features/stores/` and move store-specific components
- [x] 7.7 Create `apps/web/components/features/users/` and move user-specific components
- [x] 7.8 Create `apps/web/components/features/reports/` and move report-specific components
- [x] 7.9 Add `index.ts` barrel export in each `features/<domain>/` directory
- [x] 7.10 Update import paths in all affected page files to use feature barrel imports
- [x] 7.11 Verify `apps/web` builds without import errors (`next build` or `tsc --noEmit`)
