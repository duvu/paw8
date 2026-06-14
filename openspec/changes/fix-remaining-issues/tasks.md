## 1. Fix Button Outline Variant

- [x] 1.1 Open `apps/web/components/ui/button.tsx` and add `'outline'` to the `ButtonVariant` union: `export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'ghost' | 'link' | 'outline';`
- [x] 1.2 Add the `outline` entry to the `variantStyles` record: `outline: 'bg-transparent text-neutral-700 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm'`

## 2. Fix PageHeader Subtitle Prop Type

- [x] 2.1 Open `apps/web/components/ui/page-header.tsx` and change `subtitle?: string` to `subtitle?: React.ReactNode` in the `PageHeaderProps` interface
- [x] 2.2 Ensure `React` is imported (it likely already is — verify `import * as React from 'react'` or `import React from 'react'` is present)

## 3. Verify TypeScript Build

- [x] 3.1 Run `npx tsc --noEmit` from `apps/web/` and confirm 0 errors (was 3 errors before this change)

## 4. Resolve Plugin Architecture Stub

- [x] 4.1 Create `openspec/changes/plugin-architecture/proposal.md` with deferral rationale: plugin/webhook architecture is post-MVP1 per requirements doc section 14; to be scoped in MVP2 when webhook outbound events or configurable interest calculators are needed
- [x] 4.2 Create `openspec/changes/archive/` directory if it does not exist: `mkdir -p openspec/changes/archive`
- [x] 4.3 Move stub to archive: `mv openspec/changes/plugin-architecture openspec/changes/archive/plugin-architecture`
