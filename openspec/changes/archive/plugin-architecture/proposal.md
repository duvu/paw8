# Proposal: Plugin Architecture

## Status: DEFERRED — Post-MVP1

## Summary

Plugin/webhook architecture for paw8 is intentionally deferred to MVP2 or later. This stub
is archived to keep the `openspec/changes/` directory clean while recording the deferral
decision.

## Rationale

Per requirements document §14 ("Các tính năng chưa đưa vào MVP1"), the following are
explicitly excluded from MVP1:

- Message broker / event bus (if not yet needed)
- Tách microservice vật lý hoàn chỉnh (full physical microservice split)
- Custom domain per tenant

A plugin architecture would only be needed to support:
1. **Webhook outbound events** — notify external systems (e.g. Zalo, SMS, bank) on
   contract state changes, payments, or overdue alerts.
2. **Configurable interest calculators** — tenant-pluggable calculation logic beyond the
   three MVP1 interest types (daily / monthly / per-period).
3. **Third-party integrations** — eKYC, OCR, VietQR, POS — all deferred to MVP2/MVP3.

None of these requirements are in scope for MVP1.

## Proposed MVP2 Scope (future)

When this change is revived, it should cover:

- Event bus interface (`IEventEmitter`) backed by an in-process emitter for MVP2,
  upgradeable to Redis Pub/Sub or NATS for MVP3.
- `PluginRegistry` with a simple `register(plugin: IPlugin)` API.
- First concrete plugin: outbound Zalo/SMS webhook for overdue reminders.
- Tenant-level plugin enable/disable config in `tenant_settings`.

## Decision

**Do not implement in MVP1.** Archive this change stub. Revisit during MVP2 scoping when
outbound event or configurable interest requirements are confirmed.
