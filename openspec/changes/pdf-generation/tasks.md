# Tasks: pdf-generation

## Apply Requirements
- spec-driven
- applyRequires: ["tasks"]

## Group 1: Dependencies + lib scaffold

- [x] 1.1 Install `puppeteer-core` and `handlebars` in `apps/api-gateway`:
  - `cd apps/api-gateway && pnpm add puppeteer-core handlebars`
  - Verify both appear in `apps/api-gateway/package.json` dependencies
- [x] 1.2 Create `libs/pdf/` directory structure:
  ```
  libs/pdf/
    src/
      templates/
        contract.hbs
        receipt.hbs
        settlement.hbs
        extension.hbs
      pdf.service.ts
      pdf.module.ts
      index.ts
    package.json
    tsconfig.json
  ```
- [x] 1.3 Create `libs/pdf/package.json`:
  - name: `@paw8/pdf`
  - dependencies: `puppeteer-core`, `handlebars`
  - peerDependencies: `@nestjs/common`, `@nestjs/core`
  - Match pattern from other libs (e.g., `libs/contracts/package.json`)
- [x] 1.4 Create `libs/pdf/tsconfig.json` extending root tsconfig, matching pattern from other libs
- [x] 1.5 Add `CHROMIUM_PATH` env var to `.env.example`:
  ```
  # Path to system Chromium binary (leave empty to use Puppeteer bundled binary)
  CHROMIUM_PATH=
  ```

## Group 2: PdfService — browser singleton + template engine

- [x] 2.1 Create `libs/pdf/src/pdf.service.ts` implementing `OnModuleInit`, `OnModuleDestroy`:
  - `private browser: Browser | null = null`
  - `onModuleInit()`: launch browser via `puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })`
  - `onModuleDestroy()`: `await this.browser?.close()`
  - `private templates: Map<string, Handlebars.TemplateDelegate> = new Map()`
  - On init: call `loadTemplates()` which reads all `.hbs` files from `__dirname + '/templates/'`, compiles each, stores in map
  - `private async ensureBrowser()`: if `!this.browser`, re-launch (crash recovery, retry once)
- [x] 2.2 Implement `render(templateName: string, context: Record<string, unknown>): Promise<Buffer>`:
  - Look up template from map; if not found → throw `NotFoundException('Template not found: ...')`
  - Compile HTML string from template + context
  - Call `ensureBrowser()`, open `page = await this.browser.newPage()`
  - `await page.setContent(html, { waitUntil: 'domcontentloaded' })`
  - `const buffer = await page.pdf({ format: 'A4', printBackground: true })` (set margins per template)
  - `await page.close()`
  - Return buffer
- [x] 2.3 Register 3 Handlebars helpers (call in constructor or onModuleInit before template loading):
  - `Handlebars.registerHelper('vnd', (amount: number) => ...)`:
    - Format as VND with dots as thousand-separator + ` đ` suffix
    - Example: `1500000` → `"1.500.000 đ"`
    - Use `Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount)` (returns `1.500.000`)
    - Append ` đ`
  - `Handlebars.registerHelper('vndDate', (date: string | Date) => ...)`:
    - Format as `dd/MM/yyyy`
    - Use `new Date(date)` then pad day/month with `String(...).padStart(2, '0')`
  - `Handlebars.registerHelper('vndWords', (amount: number) => ...)`:
    - Vietnamese number-to-words for VND amounts (see spec for algorithm skeleton)
    - Units: đơn vị, chục, trăm, nghìn, triệu, tỷ (cap at 999,999,999)
    - Output example: `1500000` → `"Một triệu năm trăm nghìn đồng"`
    - Edge case: `0` → `"Không đồng"`
- [x] 2.4 LSP diagnostics on `pdf.service.ts` — expect 0 errors

## Group 3: HTML/Handlebars templates

- [x] 3.1 Create `libs/pdf/src/templates/contract.hbs`:
  - Page: A4, font Noto Sans or Arial, Vietnamese-friendly
  - **Header block**: store name (bold), address, phone — right-aligned `{{store.name}}` etc.
  - **Title**: `HỢP ĐỒNG CẦM ĐỒ` centered, contract code below
  - **Section — Ngày vay**: `{{vndDate contract.start_date}}` | **Ngày đến hạn**: `{{vndDate contract.due_date}}`
  - **Section — Bên vay (Bên A)**: customer full_name, CCCD, phone, address
  - **Section — Bên nhận cầm (Bên B)**: store name, address, phone, representative (manager)
  - **Section — Tài sản cầm cố**: asset_name, brand, model, serial/IMEI/license_plate if present, condition
  - **Section — Điều khoản tài chính**:
    - Số tiền vay: `{{vnd contract.principal_amount}}` (digits) → `{{vndWords contract.principal_amount}}` (words)
    - Lãi suất: `{{contract.interest_rate}}%/{{contract.interest_type_label}}`
    - Ngày đến hạn: `{{vndDate contract.due_date}}`
  - **Footer**: signature table — 2 columns: BÊN VAY (left) / BÊN NHẬN CẦM (right), blank lines + Ký tên, Ngày ______
- [x] 3.2 Create `libs/pdf/src/templates/receipt.hbs`:
  - **Header**: store name, address, phone
  - **Title**: `PHIẾU THU` centered, receipt ID below
  - **Date/time**: `{{vndDate transaction.transaction_date}}` (full)
  - **Khách hàng**: customer name, CCCD, phone
  - **Hợp đồng**: contract code, asset name
  - **Loại giao dịch**: Vietnamese label for transaction_type (disbursement=Giải ngân, interest_collection=Thu lãi, fee_collection=Thu phí, settlement=Tất toán)
  - **Số tiền**: `{{vnd transaction.amount}}` / `{{vndWords transaction.amount}}`
  - **Phương thức**: transaction.payment_method label
  - **Ghi chú**: transaction.note (if any)
  - **Signature**: single column BÊN THU / BÊN NỘP
- [x] 3.3 Create `libs/pdf/src/templates/settlement.hbs`:
  - **Header**: store name, address, phone
  - **Title**: `PHIẾU TẤT TOÁN HỢP ĐỒNG` centered
  - **Contract info**: code, dates
  - **Customer info**: name, CCCD, phone
  - **Financial summary table**:
    - Gốc: `{{vnd settlement.principalAmount}}`
    - Lãi: `{{vnd settlement.interestDue}}`
    - Phí phạt trễ hạn: `{{vnd settlement.lateFee}}`
    - Phí lưu kho: `{{vnd settlement.storageFee}}`
    - **Tổng cộng**: `{{vnd settlement.totalDue}}` (bold)
    - Đã thanh toán: `{{vnd settlement.alreadyPaid}}`
    - Còn lại: `{{vnd settlement.remaining}}`
  - **Asset return**: Tài sản đã trả: asset_name, ngày trả: `{{vndDate settlement_date}}`
  - **Signature**: 2-column BÊN VAY / BÊN NHẬN CẦM
- [x] 3.4 Create `libs/pdf/src/templates/extension.hbs`:
  - **Header**: store name, address, phone
  - **Title**: `PHIẾU GIA HẠN HỢP ĐỒNG` centered
  - **Contract info**: code, customer name, asset name
  - **Extension details**:
    - Ngày gia hạn: `{{vndDate extension.created_at}}`
    - Hạn cũ: `{{vndDate extension.old_due_date}}`
    - Hạn mới: `{{vndDate extension.new_due_date}}`
    - Số ngày gia hạn: computed
  - **Thanh toán tại gia hạn**:
    - Lãi đã thu: `{{vnd extension.interest_paid_amount}}`
    - Phí gia hạn: `{{vnd extension.fee_amount}}`
  - **Điều khoản tiếp theo**: interest_rate + interest_type, new due date reminder
  - **Signature**: 2-column BÊN VAY / BÊN NHẬN CẦM

## Group 4: PdfModule + registration

- [x] 4.1 Create `libs/pdf/src/pdf.module.ts`:
  - `@Global()` decorator so services can be injected without re-importing everywhere
  - `@Module({ providers: [PdfService], exports: [PdfService] })`
- [x] 4.2 Create `libs/pdf/src/index.ts` barrel: `export * from './pdf.service'; export * from './pdf.module';`
- [x] 4.3 Import `PdfModule` in `apps/api-gateway/src/app.module.ts` imports array
- [x] 4.4 LSP diagnostics on `pdf.module.ts` — expect 0 errors

## Group 5: Contract PDF endpoint

- [x] 5.1 Inject `PdfService` into `ContractsService` via constructor (`private readonly pdfService: PdfService`)
- [x] 5.2 Add `generateContractPdf(tenantId, storeIds, contractId): Promise<Buffer>` to `ContractsService`:
  - Fetch contract via `contractsRepository.findById(tenantId, contractId)` — throw 404 if not found
  - Fetch contract assets via `contractsRepository.findContractAssets(tenantId, contractId)`
  - Fetch store info via DataSource query (or StoresRepository if injectable)
  - Fetch customer info via DataSource query
  - Build context object with contract, assets, store, customer data
  - Call `this.pdfService.render('contract', context)` → Buffer
- [x] 5.3 Add `GET /:id/pdf` endpoint to `ContractsController`:
  - `@Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')` (accountant NOT included per spec)
  - Query param `@Query('save') save?: string`
  - If `!save` or save !== 'true': `res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="contract-${id}.pdf"` }); res.send(buffer)`
  - If `save === 'true'`: save to MinIO path `tenants/{tenantId}/pdfs/contracts/{contractId}.pdf`, return JSON `{ url, fileId }`
  - Use `@Res() res: Response` from express
- [x] 5.4 LSP diagnostics on contracts.service.ts + contracts.controller.ts — expect 0 errors

## Group 6: Receipt PDF endpoint

- [x] 6.1 Add `generateReceiptPdf(tenantId, storeIds, transactionId): Promise<Buffer>` to `TransactionsService`:
  - Fetch transaction via `transactionsRepository.findTransactionById(tenantId, transactionId)` — 404 if not found
  - Check transaction_type is NOT void/reversal — if it is, throw `BadRequestException('Cannot generate receipt for void/reversal transactions')`
  - Fetch contract, customer, store info
  - Build context with transaction, contract, customer, store
  - Call `pdfService.render('receipt', context)`
- [x] 6.2 Add `GET /:id/receipt/pdf` endpoint to `TransactionsController`:
  - `@Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')`
  - Same `?save=true` pattern as contract — stream or MinIO save
  - MinIO path: `tenants/{tenantId}/pdfs/receipts/{transactionId}.pdf`
- [x] 6.3 LSP diagnostics on transactions.service.ts + transactions.controller.ts — expect 0 errors

## Group 7: Settlement PDF endpoint

- [x] 7.1 Add `generateSettlementPdf(tenantId, storeIds, contractId): Promise<Buffer>` to `TransactionsService`:
  - Fetch contract — 404 if not found
  - Check contract.status === 'settled' — if not, throw `BadRequestException('Contract is not settled')`
  - Call `this.calculateSettlement(tenantId, contractId)` to get fee breakdown
  - Fetch related asset, customer, store, last settlement transaction (for settlement date)
  - Build context with all settlement data
  - Call `pdfService.render('settlement', context)`
- [x] 7.2 Add `GET /settlement/:contractId/pdf` endpoint to `TransactionsController`:
  - `@Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')`
  - Same `?save=true` pattern
  - MinIO path: `tenants/{tenantId}/pdfs/settlements/{contractId}.pdf`
- [x] 7.3 LSP diagnostics — expect 0 errors

## Group 8: Extension PDF endpoint

- [x] 8.1 Add `generateExtensionPdf(tenantId, storeIds, contractId): Promise<Buffer>` to `ContractsService`:
  - Fetch contract — 404 if not found
  - Fetch latest extension via `contractsRepository.findLatestExtension(tenantId, contractId)` — add this method to ContractsRepository if not present (SELECT * FROM contract_extensions WHERE contract_id=$1 AND tenant_id=$2 ORDER BY created_at DESC LIMIT 1)
  - 404 if no extension found
  - Fetch asset, customer, store info
  - Build context
  - Call `pdfService.render('extension', context)`
- [x] 8.2 Add `GET /:id/extension/pdf` endpoint to `ContractsController`:
  - `@Roles('staff', 'store_manager', 'tenant_admin', 'tenant_owner')`
  - Same `?save=true` pattern
  - MinIO path: `tenants/{tenantId}/pdfs/extensions/{contractId}-{extensionId}.pdf`
- [x] 8.3 LSP diagnostics — expect 0 errors

## Group 9: Integration verification

- [x] 9.1 `tsc --noEmit` on apps/api-gateway — expect 0 errors (excluding test/ files)
- [x] 9.2 Start server on port 3010:
  ```bash
  cd apps/api-gateway && DATABASE_URL=postgresql://paw8:paw8_dev_password@localhost:5433/paw8_dev \
    NODE_ENV=development APP_PORT=3010 \
    JWT_PRIVATE_KEY_PATH=/tmp/jwt.key JWT_PUBLIC_KEY_PATH=/tmp/jwt.pub \
    MINIO_ENDPOINT=localhost MINIO_PORT=9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin MINIO_BUCKET=paw8 \
    SCHEDULER_ENABLED=false CHROMIUM_PATH= \
    npx ts-node -r tsconfig-paths/register src/main.ts
  ```
  - Expect server starts with "PdfService initialized" log (or similar) and all modules loaded
- [x] 9.3 Login as staff@paw8.demo / Demo@123456 → obtain access token
- [x] 9.4 Test contract PDF: `GET /api/v1/contracts/{seeded-contract-id}/pdf` with Bearer token
  - Expect: 200 response with `Content-Type: application/pdf`, non-empty body
  - Save PDF buffer to `/tmp/test-contract.pdf` and verify it is a valid PDF (starts with `%PDF`)
- [x] 9.5 Test receipt PDF: pick a disbursement transaction from seed data, `GET /api/v1/transactions/{txn-id}/receipt/pdf`
  - Expect: 200 with PDF content type
- [x] 9.6 Test settlement PDF: pick a settled contract from seed data (contract with status='settled'), `GET /api/v1/transactions/settlement/{contract-id}/pdf`
  - Expect: 200 with PDF
- [x] 9.7 Test extension PDF: pick a contract with an extension (seeded extended contract), `GET /api/v1/contracts/{contract-id}/extension/pdf`
  - Expect: 200 with PDF
- [x] 9.8 Mark tasks.md all [x] after verification passes
