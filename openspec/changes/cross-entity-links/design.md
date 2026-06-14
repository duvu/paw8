## Context

The web portal at `apps/web/` has detail pages for contracts (`contracts/[id]`), customers (`customers/[id]`), and an assets list page (`assets/`). There is no assets detail page. Relationships are:

- A contract has a `customerId` (and `customerName`) and a list of assets
- An asset has a `contractId` field returned by the API
- A customer's contracts are fetched via `GET /contracts?customerId=<id>`
- Assets per contract are fetched via `GET /assets?contractId=<id>`

**Current state:**
- `contracts/[id]`: shows customer name as a `Link` to `customers/[id]` ✅; shows asset rows but no link to asset detail ❌
- `customers/[id]`: contract rows have a "View" link to `contracts/[id]` ✅; contract code in row is plain text ❌; no asset summary ❌
- `assets/page.tsx`: rows have no link to contract ❌; no detail page exists ❌

## Goals / Non-Goals

**Goals:**
- Create `assets/[id]/page.tsx` showing asset info, linked contract (clickable), and linked customer (clickable)
- In `contracts/[id]`: make each asset row clickable (link to `assets/[id]`)
- In `assets/page.tsx`: add contract code column with link to `contracts/[id]`; fix `'pawned'` status value → `'holding'` (matches actual DB enum)
- In `customers/[id]`: make `contractCode` cell a Link (already has a "View" link, but making the code itself clickable improves UX); add assets summary section fetched via `GET /assets?customerId=<id>` (or via customer's contracts)

**Non-Goals:**
- Backend changes — all required data is already available
- New API endpoints — existing endpoints suffice
- i18n string additions beyond minimal labels needed
- Mobile app changes

## Decisions

### D1: Asset detail page data fetching
Fetch asset by ID: `GET /api/v1/assets/:id`. The API response includes `contractId`. Fetch contract detail `GET /api/v1/contracts/:id` using that contractId to display contract info + customer link.
**Alternative**: embed contract and customer info in the asset response. Rejected — requires backend change.

### D2: Customer page asset summary
Fetch assets via `GET /api/v1/assets?customerId=<id>` if the API supports it. If not, aggregate from contracts already fetched on the page using `GET /api/v1/assets?contractId=<id>` per contract.
**Decision**: Use `GET /api/v1/assets?customerId=<id>` — test shows the query param is accepted by the backend's `AssetsController` (`@Query('customerId')`). If it returns empty, fall back to per-contract fetching.

### D3: Make contract code the link in customer detail
The current row has a plain `contractCode` cell + a separate "View" link cell. Change the `contractCode` cell to a `Link` and remove or keep the "View" link (keep it for accessibility). This is a minor UX improvement.

### D4: Status enum in assets list
The assets list filter uses `'pawned'` which is wrong (DB enum uses `'holding'`). Fix status filter values to match actual DB enums: `holding, redeemed, overdue, pending_liquidation, liquidated`.

## Risks / Trade-offs

- [Risk] `GET /assets?customerId=<id>` may not be implemented in current backend → Mitigation: check API response; if 400/empty, skip asset summary section on customer page for now and note in tasks
- [Risk] Asset detail page adds a second API call for the contract → Mitigation: show loading skeleton while fetching; contract data is small
- [Trade-off] Making contractCode a link duplicates the "View" link in customer detail → acceptable, common pattern for data tables (row click or code click)
