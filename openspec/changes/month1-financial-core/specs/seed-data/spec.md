# Spec: Seed Data

## Overview

A TypeORM migration file that inserts a complete development dataset. Only executes in non-production environments. Uses fixed UUIDs for deterministic re-runs (ON CONFLICT DO NOTHING).

## Migration File

`apps/api-gateway/src/migrations/1700000010000-SeedDevelopmentData.ts`

## Dataset

### Tenant (1)

| Field | Value |
|-------|-------|
| id | `a1000000-0000-0000-0000-000000000001` |
| name | Tiệm Cầm Đồ Phát Tài |
| code | PTAI |
| status | active |
| plan | professional |
| max_stores | 10 |
| max_users | 50 |

### Stores (2)

| id | name | code |
|----|------|------|
| `s1000000-...-000001` | Chi nhánh Quận 1 | Q1 |
| `s1000000-...-000002` | Chi nhánh Quận 7 | Q7 |

### Users (6)

| id | email | role | store_assignment |
|----|-------|------|-----------------|
| `u1..01` | admin@paw8.dev | platform_admin | — |
| `u1..02` | owner@phattai.vn | tenant_owner | all |
| `u1..03` | tadmin@phattai.vn | tenant_admin | all |
| `u1..04` | manager.q1@phattai.vn | store_manager | Q1 |
| `u1..05` | manager.q7@phattai.vn | store_manager | Q7 |
| `u1..06` | staff.q1@phattai.vn | staff | Q1 |

All passwords: `Password123!` (bcrypt hashed in migration)

### Interest Policies (2)

| id | name | interest_type | rate | late_fee_rate | grace_period |
|----|------|---------------|------|---------------|--------------|
| `p1..01` | Tiêu chuẩn | MONTHLY | 3.0 | 0.1 | 3 |
| `p1..02` | VIP | MONTHLY | 2.0 | 0.05 | 7 |

"Tiêu chuẩn" is set as `is_default = true`.

### Customers (10)

Realistic Vietnamese names, CCCD numbers (12 digits), phone numbers (0xxx), addresses in HCM City. Mix of:
- 5 customers with active contracts
- 3 customers with settled history
- 2 new customers (no contracts)

### Assets (15)

| type | count | examples |
|------|-------|---------|
| motorcycle | 3 | Honda SH 150, Yamaha Exciter, Honda Wave |
| phone | 4 | iPhone 15 Pro, Samsung S24, iPhone 14, Xiaomi 14 |
| laptop | 3 | MacBook Pro M3, ThinkPad X1, Dell XPS 15 |
| gold | 2 | Nhẫn vàng 24K 5 chỉ, Dây chuyền vàng 18K |
| watch | 2 | Rolex Submariner, Omega Seamaster |
| electronics | 1 | Sony PS5 |

### Contracts (12)

| status | count | due_date relative |
|--------|-------|-------------------|
| active | 4 | 30-60 days from now |
| near_due | 2 | 3-5 days from now |
| overdue | 2 | 5-15 days ago |
| settled | 2 | settled last month |
| extended | 1 | extended, new due 30 days |
| cancelled | 1 | cancelled 2 weeks ago |

Each contract has:
- Linked customer
- 1-2 linked assets
- Matching disbursement transaction
- Interest collection transactions where applicable
- Extension records where applicable
- Status history entries

### Transactions

Matching the contract states:
- 12 disbursement transactions (one per contract)
- 6 interest_collection transactions (for active/near_due/overdue contracts)
- 2 settlement transactions (for settled contracts)
- 1 extension transaction

## Guards

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Skip in production
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    console.log('Skipping seed data in production');
    return;
  }
  // ... INSERT statements with ON CONFLICT DO NOTHING
}

public async down(queryRunner: QueryRunner): Promise<void> {
  // Delete seed data by fixed UUIDs
}
```

## Files

- `apps/api-gateway/src/migrations/1700000010000-SeedDevelopmentData.ts` — new
