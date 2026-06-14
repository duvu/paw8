## 1. Fix asset list page

- [ ] 1.1 Fix status filter values in `apps/web/app/(dashboard)/assets/page.tsx` — change STATUSES array from `['', 'pawned', 'redeemed', 'overdue', 'pending_liquidation', 'liquidated']` to `['', 'holding', 'redeemed', 'overdue', 'pending_liquidation', 'liquidated']`; update `assetStatusVariant` map key from `'pawned'` to `'holding'`
- [ ] 1.2 Fetch `contractId` and `contractCode` for each asset — the API returns `contractId` in the asset object; fetch contract codes by adding `contractCode` to the Asset interface and reading from API response (or fetch separately if not returned)
- [ ] 1.3 Add a "Contract" column to the assets list table — show contract code as `<Link href={/contracts/${a.contractId}}>` when contractId exists, dash otherwise
- [ ] 1.4 Add "View" link per asset row in the list — `<Link href={/assets/${a.id}}>` in an Actions column

## 2. Create asset detail page

- [ ] 2.1 Create `apps/web/app/(dashboard)/assets/[id]/page.tsx` — 'use client', fetch `GET /assets/:id`, define Asset interface including `contractId`
- [ ] 2.2 If asset has `contractId`, fetch `GET /contracts/:contractId` — define Contract interface with `id, contractCode, status, principalAmount, startDate, dueDate, customerId, customerName`
- [ ] 2.3 Render asset info section — assetName, assetType, brand, model, serialNumber, status (Badge), valuationAmount, proposedLoanAmount, conditionDescription
- [ ] 2.4 Render linked contract card — contractCode, status Badge, amounts, dates; wrap card or code with `<Link href={/contracts/${contractId}}>`
- [ ] 2.5 Render linked customer row — customerName as `<Link href={/customers/${customerId}}>` derived from the fetched contract
- [ ] 2.6 Handle no-contract case — show EmptyState in contract section if `contractId` is null/absent
- [ ] 2.7 Handle loading and error states — Spinner while fetching, Alert on error

## 3. Update contract detail page

- [ ] 3.1 In `apps/web/app/(dashboard)/contracts/[id]/page.tsx`, make each asset row clickable — add `<Link href={/assets/${a.id}}>` wrapping the asset name cell or add an Actions column with a link

## 4. Update customer detail page

- [ ] 4.1 In `apps/web/app/(dashboard)/customers/[id]/page.tsx`, make the `contractCode` cell a `<Link href={/contracts/${c.id}}>` (already has a "View" link but code cell is plain text — wrap `{c.contractCode}` in a Link)
- [ ] 4.2 Add an assets section to the customer detail page — after the contracts card, add a "Tài sản" card that fetches assets for each contract using `GET /assets?contractId=<id>` and aggregates results; show assetName, assetType, status Badge, and a link to `/assets/<assetId>` per row
- [ ] 4.3 Handle empty assets state — show EmptyState if no assets found across all contracts

## 5. Verify

- [ ] 5.1 Run the live e2e suite: `cd apps/api-gateway && npx jest --config test/jest-live.json --runInBand` — confirm still 46/46 passing
- [ ] 5.2 Manual browser check: navigate `paw8.x51.vn` → assets list → click contract link → lands on contract detail; click asset detail link → lands on asset detail showing contract + customer links
- [ ] 5.3 Manual browser check: customer detail → click contract code → lands on contract; contract detail → click asset → lands on asset detail
