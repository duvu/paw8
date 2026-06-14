## Why

Pawn shop operations require legally-valid paper documents for every transaction — contracts, payment receipts, settlement slips, and extension slips must be handed to customers and filed for audit. Currently the system has no PDF generation capability, blocking real-world deployment (M3 in the roadmap requires this before first production use).

## What Changes

- Add a `PdfModule` in `libs/pdf/` with a `PdfService` that generates PDFs from Handlebars HTML templates using Puppeteer (headless Chrome).
- Introduce four document types:
  - **Pawn Contract** (`contract`): full contract summary, asset details, interest terms, customer and store info, signature lines.
  - **Payment Receipt** (`receipt`): records a single transaction (interest collection, fee collection, or partial principal) with amount, method, remaining balance.
  - **Settlement Slip** (`settlement`): final close-out document showing principal, accrued interest, fee breakdown (lateFee, storageFee), total paid, asset return confirmation, signature lines.
  - **Extension Slip** (`extension`): shows old/new due date, interest collected at extension, new terms, signature lines.
- Add `GET /api/v1/contracts/:id/pdf` — tenant/store-scoped, returns `application/pdf`.
- Add `GET /api/v1/transactions/:id/receipt/pdf` — returns receipt PDF for a single transaction.
- Add `GET /api/v1/transactions/settlement/:contractId/pdf` — returns settlement slip.
- Add `GET /api/v1/contracts/:id/extension/pdf` — returns latest extension slip.
- Vietnamese locale: amounts formatted as VND (e.g., `1.500.000 đ`), dates as `dd/MM/yyyy`, number-to-words in Vietnamese for contract amounts.
- Tenant branding: store name, address, phone injected from DB.
- No file storage — PDFs generated on-demand and streamed (not saved to MinIO). Optional `?save=true` query param stores to MinIO and returns presigned URL.

## Capabilities

### New Capabilities

- `pdf-service`: Core Puppeteer + Handlebars pipeline. Template loading, HTML rendering, PDF buffer generation, Vietnamese currency/date helpers. Shared by all document types.
- `contract-pdf`: Pawn contract document template + endpoint.
- `receipt-pdf`: Payment receipt document template + endpoint.
- `settlement-pdf`: Settlement/close-out document template + endpoint.
- `extension-pdf`: Extension slip template + endpoint.

### Modified Capabilities

<!-- None — no existing spec-level requirements are changing. -->

## Impact

- **New lib**: `libs/pdf/` — `PdfModule`, `PdfService`, `templates/` directory (4 Handlebars `.hbs` files).
- **Modified libs**: `libs/contracts/src/contracts.controller.ts` (2 new endpoints), `libs/transactions/src/transactions.controller.ts` (2 new endpoints).
- **New deps**: `puppeteer` (Chromium bundled), `handlebars`, `@types/handlebars` — added to `apps/api-gateway/package.json`.
- **MinIO** (optional, existing): `FilesService` used when `?save=true` to upload generated PDF.
- **No DB schema changes.**
- Puppeteer requires Chromium — Docker image must include `chromium-browser` or use `puppeteer-core` with system Chromium. `docker-compose.yml` and deployment notes updated.
