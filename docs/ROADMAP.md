# paw8 — 18-Month Product Roadmap

> **Status**: Living document. Updated 2025-05-30.
> **Baseline**: Phase 1 substantially complete — financial core, security, RBAC, PDF all delivered. Remaining: integration tests, CI, first deployment.

---

## Quick Reference — Critical Path

| # | Milestone | Blocks | Status |
|---|-----------|--------|--------|
| 1 | Interest calculation engine (M1) | All financial reporting, settlement | ✅ Done |
| 2 | RBAC enforcement per-endpoint (M2) | Production go-live | ✅ Done |
| 3 | PDF generation (M3) | Legal compliance, customer receipts | ✅ Done |
| 4 | **Integration tests + CI + Deploy (M3)** | **Production go-live** | ⬜ Next |
| 5 | Subscription billing (M12) | SaaS revenue | ⬜ |
| 6 | Event bus (M16) | Microservice extraction | ⬜ |

---

## Phase 1 — MVP1 Completion (Months 1–3)

> **Goal**: Close all remaining gaps to make the system production-worthy for the first paying tenant.
> **Progress**: 10/13 tasks complete. 3 remaining items block first production deploy.

### Month 1 — Financial Core ✅

| Task | Description | Status |
|------|-------------|--------|
| Interest calculation engine | Daily / monthly / per-period interest logic; wired into `calculateSettlement()` | ✅ |
| Contract status machine | Formal state transitions with guard conditions (`contract-state-machine.ts`) | ✅ |
| Overdue scheduler | `@Cron` job to auto-transition contracts to `near_due` → `overdue` | ✅ |
| Seed data | Sample tenant, store, users for each role, demo contracts | ✅ |
| Settlement calculation | Full settlement amount calc (principal + accrued interest + fees) | ✅ |

### Month 2 — Security & RBAC ✅

| Task | Description | Status |
|------|-------------|--------|
| `@Roles()` + `RolesGuard` enforcement | Applied on every controller across all 11 domain modules (27 tasks) | ✅ |
| Rate limiting | `@nestjs/throttler` — global 60/min, auth endpoints 10/min, health excluded | ✅ |
| Password policy | Min length, complexity validation via `@IsStrongPassword()` decorator | ✅ |
| Login lockout | `user_login_attempts` table, 5-attempt lockout with cooldown | ✅ |
| Refresh token rotation | `family_id` tracking, `replaced_by_hash`, reuse detection invalidates family | ✅ |

### Month 3 — PDF, Tests, Deploy 🔄

| Task | Description | Status |
|------|-------------|--------|
| PDF generation | Contract, receipt, settlement slip, extension slip (Puppeteer + Handlebars, `libs/pdf/`) | ✅ |
| Integration tests | Auth flow, contract lifecycle, file upload/download | ⬜ |
| CI pipeline | GitHub Actions: build, lint, test, typecheck | ⬜ |
| First deployment | Docker Compose on VPS; staging + production envs | ⬜ |

---

## Phase 2 — Stabilize + Notifications (Months 4–6)

> **Goal**: Polish the operator experience and add proactive communication with customers.
> **Prerequisite**: Phase 1 Month 3 remaining items complete.

### Month 4 — Export & Mobile Camera

| Task | Description | Status |
|------|-------------|--------|
| Bulk CSV/Excel export | Contracts, transactions, overdue lists | ⬜ |
| Dashboard data refresh | Live stats; cache with short TTL | ⬜ |
| Mobile camera fully wired | Flutter: capture CCCD + asset photos, confirm upload flow | ⬜ |
| Audit log UI | Filterable table with entity drill-down | ⬜ |

### Month 5 — Notifications

| Task | Description | Status |
|------|-------------|--------|
| Notification module | `libs/notifications/` — provider-agnostic interface | ⬜ |
| SMS provider | Integrate one SMS gateway (Twilio / SpeedSMS / Esms) | ⬜ |
| Zalo OA | Zalo Official Account message API | ⬜ |
| Templates | Near-due, overdue, settlement confirmation, extension reminder | ⬜ |
| Notification preferences | Per-tenant enable/disable channels | ⬜ |

### Month 6 — Platform Admin Portal

| Task | Description | Status |
|------|-------------|--------|
| Platform Admin web screens | Tenant CRUD, lock/unlock, owner assignment | ⬜ |
| Onboarding wizard | Guided first-store + first-user setup for new tenants | ⬜ |
| Plan enforcement | `max_stores`, `max_users` limits checked at create time | ⬜ |
| Trial expiry | Auto-lock tenant on `trial_end_date` + grace period | ⬜ |
| Billing placeholder | `tenant_plans` table; manual plan assignment UI | ⬜ |

---

## Phase 3 — MVP2 Core (Months 7–9)

> **Goal**: Add payment integrations and compliance features demanded by Vietnamese regulations.

### Month 7 — Payments

| Task | Description | Status |
|------|-------------|--------|
| VietQR dynamic QR | Generate per-transaction QR code | ⬜ |
| Bank transfer webhook | Receive and reconcile incoming transfers | ⬜ |
| Payment reconciliation | Match bank credits to contract transactions | ⬜ |
| Partial payment | Allow principal partial repayment | ⬜ |

### Month 8 — eKYC / OCR

| Task | Description | Status |
|------|-------------|--------|
| OCR CCCD | FPT.AI or VNPTSmartCA; feature-flagged per tenant | ⬜ |
| Customer auto-fill | Pre-populate customer form from OCR result | ⬜ |
| Liveness stub | Placeholder for future face-match integration | ⬜ |

### Month 9 — Approval Workflows

| Task | Description | Status |
|------|-------------|--------|
| Configurable thresholds | Loan amount above X requires manager approval | ⬜ |
| Manager inbox | Pending approval queue in web + mobile | ⬜ |
| Approval history | Audit trail per contract decision | ⬜ |
| Auto-approve below threshold | Skip queue when within staff limit | ⬜ |

---

## Phase 4 — MVP2 Complete (Months 10–12)

> **Goal**: Full reporting, liquidation workflow, and self-service SaaS billing.

### Month 10 — Advanced Reporting

| Task | Description | Status |
|------|-------------|--------|
| Report builder | Configurable filters, grouping, column selection | ⬜ |
| Staff performance dashboard | Contracts created, interest collected, settlements per staff | ⬜ |
| Tenant health dashboard | Platform Admin view: activity, plan usage, risk signals | ⬜ |
| Scheduled report emails | Daily/weekly PDF or CSV to configured recipients | ⬜ |

### Month 11 — Liquidation & Risk

| Task | Description | Status |
|------|-------------|--------|
| Liquidation workflow | Move overdue assets through liquidation states with records | ⬜ |
| Bulk overdue processing | Batch status update + notification trigger | ⬜ |
| Customer blacklist | Platform-level flag; cross-tenant identity_number check | ⬜ |
| Risk flags | Per-customer manual flag; visible to all stores in tenant | ⬜ |

### Month 12 — Subscription Billing

| Task | Description | Status |
|------|-------------|--------|
| Stripe or VNPay billing | Charge tenants monthly/annually per plan | ⬜ |
| Self-service signup | Tenant registration form; provisioning pipeline | ⬜ |
| Plan upgrade/downgrade | Proration, immediate effect, confirmation email | ⬜ |
| Invoice generation | PDF invoice per billing cycle | ⬜ |

---

## Phase 5 — AI + Data (Months 13–15)

> **Goal**: Data-driven intelligence to reduce risk and improve valuations.

### Month 13 — AI Asset Valuation

| Task | Description | Status |
|------|-------------|--------|
| Market price feeds | Integrate market data for phones, bikes, gold | ⬜ |
| Suggested loan amounts | AI-recommended LTV based on asset type + condition | ⬜ |
| Valuation history | Track price changes over time per asset category | ⬜ |

### Month 14 — Risk & Fraud

| Task | Description | Status |
|------|-------------|--------|
| Customer risk scoring | Score based on payment history, overdue rate | ⬜ |
| Fraud detection rules | Duplicate CCCD across tenants; velocity checks | ⬜ |
| Risk dashboard | Flagged customers, high-risk contracts, platform signals | ⬜ |

### Month 15 — Analytics Infrastructure

| Task | Description | Status |
|------|-------------|--------|
| Read replica | PostgreSQL streaming replica for reporting queries | ⬜ |
| Analytics schema | Denormalized fact tables for BI | ⬜ |
| Metabase / Superset | Self-hosted BI connected to read replica | ⬜ |
| Data retention policy | Archive + purge rules; configurable per tenant | ⬜ |
| GDPR-lite erasure | Customer data deletion endpoint with audit | ⬜ |

---

## Phase 6 — Scale & Resilience (Months 16–18)

> **Goal**: Event-driven architecture, microservice extraction, and multi-region readiness.

### Month 16 — Event Bus

| Task | Description | Status |
|------|-------------|--------|
| NATS or Redis Streams | Choose and integrate message broker | ⬜ |
| Domain events | `ContractCreated`, `TransactionRecorded`, `AssetStatusChanged`, etc. | ⬜ |
| Decouple notifications | Notification service subscribes to events; no direct calls | ⬜ |
| Decouple audit | Audit service subscribes to events | ⬜ |

### Month 17 — Microservice Extraction

| Task | Description | Status |
|------|-------------|--------|
| Files service | Extract `libs/files` into standalone service | ⬜ |
| Notifications service | Standalone consumer of notification events | ⬜ |
| API Gateway routing | Route traffic to services; service discovery | ⬜ |
| Health + circuit breakers | Per-service health checks; graceful degradation | ⬜ |

### Month 18 — Multi-Region & HA

| Task | Description | Status |
|------|-------------|--------|
| Multi-region PostgreSQL | Primary + standby in different regions | ⬜ |
| Multi-region MinIO | Replicated object storage | ⬜ |
| CDN | Static assets + presigned URL acceleration | ⬜ |
| Custom domain per tenant | `{tenant}.paw8.vn` routing | ⬜ |
| Load balancer + autoscaling | HPA on Kubernetes or equivalent | ⬜ |
| DR runbook | Documented recovery procedures | ⬜ |
| VAPT | External penetration test + remediation | ⬜ |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete |
| ⏸ | Deferred |
| ❌ | Cancelled |

---

## Completed Work Log

### Pre-roadmap Foundation

| Change | What Was Delivered |
|--------|--------------------|
| `mvp1-foundation` | NestJS modular monolith, 11 domain modules, 7 DB migrations, JWT (RS256), Docker |
| `project-documentation` | AGENTS.md, docs, README |
| `modern-secure-ui-ux` | Next.js App Router, Flutter scaffold, 9 dashboard routes, login |
| `responsive-tailwind-ui` | Tailwind v4, responsive layout, sidebar + mobile nav |
| `i18n-multi-language` | next-intl en/vi/zh, Flutter l10n |
| `fix-design-principles` | Repository layer (11 domains), JWT key caching, Swagger, shared-types, FSD-lite |
| `tailwind-design-system` | Design tokens, 11 hardened UI components, 4 finance components, PageHeader |
| `fix-implementation-gaps` | Global guards wired, enum fixes, `/health` endpoint, builds verified |

### Phase 1 Delivery

| Change | What Was Delivered |
|--------|--------------------|
| `month1-financial-core` | Interest engine (daily/monthly/period), contract state machine, overdue scheduler, settlement calc, seed data |
| `month2-security` | Rate limiting (@nestjs/throttler), password policy, login lockout (5 attempts), refresh token rotation with family tracking |
| `complete-rbac-enforcement` | @Roles + RolesGuard on every controller endpoint across all 11 domain modules (33 tasks) |
| `pdf-generation` | Contract/receipt/settlement/extension PDFs via Puppeteer + Handlebars (`libs/pdf/`, 38 tasks) |
