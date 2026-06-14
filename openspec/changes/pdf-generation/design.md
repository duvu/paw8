## Context

The pawn shop system is production-blocked: staff cannot hand over legal documents to customers. Currently there is zero PDF generation in the codebase — no library installed, no templates, no endpoints. The system does have:

- Full contract, transaction, and extension data in PostgreSQL
- `calculateSettlement()` returning complete fee breakdowns
- `FilesService` + MinIO for file storage (prestige upload/download flow)
- `libs/` modular monolith pattern (each domain is a standalone lib)
- Handlebars not yet installed; Puppeteer not yet installed

Vietnamese locale requirement: VND currency (`1.500.000 đ` dot-separated), dates `dd/MM/yyyy`, contract amounts written out in words (e.g., "Một triệu năm trăm nghìn đồng") for legal validity.

## Goals / Non-Goals

**Goals:**
- Generate valid PDF buffers for 4 document types: pawn contract, payment receipt, settlement slip, extension slip.
- Stream PDF directly to HTTP response (no mandatory MinIO save).
- Optional `?save=true` saves to MinIO via existing `FilesService` and returns presigned URL.
- Vietnamese formatting: VND amounts, dd/MM/yyyy dates, amount-in-words.
- Tenant branding: store name, address, phone on every document header.
- Tenant/store security: all endpoints enforce TenantGuard + RolesGuard + store scope.

**Non-Goals:**
- Digital signatures / e-signing (MVP3+).
- Custom per-tenant logo images (MVP3+).
- Bulk batch PDF generation (MVP3+).
- PDF/A compliance (MVP2+).
- PDF editing or annotations.

## Decisions

### D1: Puppeteer + Handlebars (HTML-to-PDF) over pdfkit

**Decision**: Use `puppeteer` for PDF rendering with `handlebars` HTML templates.

**Alternatives considered**:
- `pdfkit`: Programmatic PDF construction. Precise layout control but requires calculating every x/y coordinate — complex table layouts for contracts are painful. No Vietnamese font with number-to-words built in.
- `@react-pdf/renderer`: React component model, good DX but adds React as a server dep. Overkill.
- `puppeteer` + Handlebars: Write standard HTML/CSS, let Chromium render it. Vietnamese fonts (system Noto/Arial) render correctly. Complex tabular layouts trivial with CSS. Trade-off: ~170MB Chromium binary in Docker.

**Mitigation for Docker size**: Use `puppeteer-core` + system Chromium in Docker (`chromium-browser` package). Dev environment uses full `puppeteer` (auto-downloads Chromium).

### D2: Dedicated `libs/pdf/` module, NOT integrated into domain services

**Decision**: Create `libs/pdf/` with `PdfService` (template engine + Puppeteer) and `PdfModule`. Domain controllers (`contracts`, `transactions`) call `PdfService` directly.

**Rationale**: PDF generation is a cross-cutting concern (all 4 doc types need the same rendering pipeline). Centralizing in one lib avoids duplication of Puppeteer instance management across domains.

### D3: Single shared Puppeteer browser instance (module-scoped singleton)

**Decision**: Launch one `Browser` instance in `PdfModule.onModuleInit()`, reuse across requests, close in `onModuleDestroy()`.

**Rationale**: Launching a new Chromium process per request is prohibitively slow (1–2s startup). A persistent browser with new `Page` per request is fast (~50–200ms per PDF).

**Risk**: If the browser crashes, subsequent requests fail until restart. Mitigation: add health check + reconnect logic with `puppeteer.connect()` fallback.

### D4: Handlebars templates as `.hbs` files in `libs/pdf/src/templates/`

**Decision**: Store templates as filesystem `.hbs` files, loaded once at startup and cached in a `Map<string, HandlebarsTemplateDelegate>`.

**Rationale**: Keeps HTML/CSS fully editable without recompile. Cached at startup (not on every request) for performance.

### D5: VND formatter + Vietnamese date helper as Handlebars helpers, NOT inline logic

**Decision**: Register custom Handlebars helpers: `{{vnd amount}}` → `1.500.000 đ`; `{{vndDate date}}` → `30/05/2026`; `{{vndWords amount}}` → `"Một triệu năm trăm nghìn đồng"`.

**Rationale**: Keeps templates clean, makes helpers testable in isolation. Vietnamese number-to-words uses a simple recursive algorithm (no external lib needed for amounts < 1 billion VND).

### D6: `?save=true` optional MinIO persistence

**Decision**: Default response is `Content-Type: application/pdf` stream. With `?save=true`, save to MinIO at `tenants/{tenantId}/pdfs/{docType}/{entityId}.pdf` via `FilesService.confirmUpload()` path, return `{ url }` JSON with presigned URL.

**Rationale**: Most use cases are print-on-demand. Storage is optional for archival.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Puppeteer Chromium ~170MB Docker size increase | Use `puppeteer-core` + Alpine `chromium` package in Dockerfile |
| Browser crash under load | Wrap `newPage()` in try/catch; re-launch browser on connection error |
| Vietnamese number-to-words edge cases (0, negative, > 1B) | Unit test with representative amounts from seed data; cap at 999,999,999 |
| Template not found crash | Validate template names at startup with startup assertion |
| PDF timeout on slow containers | `page.goto()` with `timeout: 30000`; Puppeteer `waitForNetworkIdle` not needed (local HTML) |

## Migration Plan

1. No DB changes required.
2. Install `puppeteer-core`, `handlebars` in `apps/api-gateway/package.json`.
3. Add `CHROMIUM_PATH` env var to `.env.example`; default to Puppeteer's bundled binary for local dev.
4. Update `Dockerfile` (if present) to install `chromium` system package.
5. No rollback needed — endpoints are additive, no existing behavior changes.

## Open Questions

- **None blocking implementation.** Document headers should show store branding. Template visual design can be iterated post-MVP3.
