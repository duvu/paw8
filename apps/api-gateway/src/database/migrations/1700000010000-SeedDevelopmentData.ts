import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Fixed UUIDs for deterministic seed data and idempotent down()
const IDS = {
  tenant: 'aaaaaaaa-0001-0001-0001-000000000001',
  stores: {
    hn01: 'bbbbbbbb-0001-0001-0001-000000000001',
    hn02: 'bbbbbbbb-0001-0001-0001-000000000002',
  },
  roles: {
    tenant_owner: 'cccccccc-0001-0001-0001-000000000001',
    tenant_admin: 'cccccccc-0001-0001-0001-000000000002',
    store_manager: 'cccccccc-0001-0001-0001-000000000003',
    staff: 'cccccccc-0001-0001-0001-000000000004',
    accountant: 'cccccccc-0001-0001-0001-000000000005',
    platform_admin: 'cccccccc-0001-0001-0001-000000000006',
  },
  users: {
    owner: 'dddddddd-0001-0001-0001-000000000001',
    admin: 'dddddddd-0001-0001-0001-000000000002',
    manager1: 'dddddddd-0001-0001-0001-000000000003',
    staff1: 'dddddddd-0001-0001-0001-000000000004',
    accountant: 'dddddddd-0001-0001-0001-000000000005',
    platform_admin: 'dddddddd-0001-0001-0001-000000000006',
  },
  policies: {
    standard: 'eeeeeeee-0001-0001-0001-000000000001',
    vip: 'eeeeeeee-0001-0001-0001-000000000002',
  },
  customers: Array.from({ length: 10 }, (_, i) =>
    `ffffffff-0001-0001-0001-${String(i + 1).padStart(12, '0')}`,
  ),
  assets: Array.from({ length: 15 }, (_, i) =>
    `11111111-0001-0001-0001-${String(i + 1).padStart(12, '0')}`,
  ),
  contracts: Array.from({ length: 12 }, (_, i) =>
    `22222222-0001-0001-0001-${String(i + 1).padStart(12, '0')}`,
  ),
  transactions: Array.from({ length: 22 }, (_, i) =>
    `33333333-0001-0001-0001-${String(i + 1).padStart(12, '0')}`,
  ),
  extensions: [
    '44444444-0001-0001-0001-000000000001',
  ],
};

export class SeedDevelopmentData1700000010000 implements MigrationInterface {
  name = 'SeedDevelopmentData1700000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SeedDevelopmentData] Skipping seed: NODE_ENV=production');
      return;
    }

    const passwordHash = await bcrypt.hash('Demo@123456', 10);
    const now = new Date().toISOString();

    // ── 6.2 Tenant ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO tenants (id, name, code, status, plan, max_stores, max_users, trial_end_date, created_at, updated_at)
      VALUES (
        '${IDS.tenant}', 'Công ty Cầm Đồ Paw8 Demo', 'PAW8DEMO',
        'active', 'pro', 10, 50, NULL, '${now}', '${now}'
      ) ON CONFLICT DO NOTHING
    `);

    // ── 6.2 Stores ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO stores (id, tenant_id, name, code, address, phone, status, created_at, updated_at)
      VALUES
        ('${IDS.stores.hn01}', '${IDS.tenant}', 'Chi nhánh Hoàn Kiếm', 'HN01',
         '12 Hàng Bài, Hoàn Kiếm, Hà Nội', '0243 123 4567', 'active', '${now}', '${now}'),
        ('${IDS.stores.hn02}', '${IDS.tenant}', 'Chi nhánh Đống Đa', 'HN02',
         '45 Tây Sơn, Đống Đa, Hà Nội', '0243 234 5678', 'active', '${now}', '${now}')
      ON CONFLICT DO NOTHING
    `);

    // ── 6.2 Roles ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO roles (id, tenant_id, name, description, created_at)
      VALUES
        ('${IDS.roles.platform_admin}', NULL, 'platform_admin', 'Quản trị viên nền tảng', '${now}'),
        ('${IDS.roles.tenant_owner}', '${IDS.tenant}', 'tenant_owner', 'Chủ sở hữu hệ thống', '${now}'),
        ('${IDS.roles.tenant_admin}', '${IDS.tenant}', 'tenant_admin', 'Quản trị viên hệ thống', '${now}'),
        ('${IDS.roles.store_manager}', '${IDS.tenant}', 'store_manager', 'Quản lý cửa hàng', '${now}'),
        ('${IDS.roles.staff}', '${IDS.tenant}', 'staff', 'Nhân viên giao dịch', '${now}'),
        ('${IDS.roles.accountant}', '${IDS.tenant}', 'accountant', 'Kế toán / Kiểm soát', '${now}')
      ON CONFLICT DO NOTHING
    `);

    // ── 6.2 Users ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO users (id, tenant_id, email, phone, full_name, password_hash, status, created_at, updated_at)
      VALUES
        ('${IDS.users.platform_admin}', NULL, 'platform@paw8.demo', '0900000000',
         'Platform Administrator', '${passwordHash}', 'active', '${now}', '${now}'),
        ('${IDS.users.owner}', '${IDS.tenant}', 'owner@paw8.demo', '0901111111',
         'Nguyễn Văn Chủ', '${passwordHash}', 'active', '${now}', '${now}'),
        ('${IDS.users.admin}', '${IDS.tenant}', 'admin@paw8.demo', '0902222222',
         'Trần Thị Quản Trị', '${passwordHash}', 'active', '${now}', '${now}'),
        ('${IDS.users.manager1}', '${IDS.tenant}', 'manager@paw8.demo', '0903333333',
         'Lê Văn Quản Lý', '${passwordHash}', 'active', '${now}', '${now}'),
        ('${IDS.users.staff1}', '${IDS.tenant}', 'staff@paw8.demo', '0904444444',
         'Phạm Thị Nhân Viên', '${passwordHash}', 'active', '${now}', '${now}'),
        ('${IDS.users.accountant}', '${IDS.tenant}', 'accountant@paw8.demo', '0905555555',
         'Hoàng Văn Kế Toán', '${passwordHash}', 'active', '${now}', '${now}')
      ON CONFLICT DO NOTHING
    `);

    // ── 6.2 User roles ───────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO user_roles (tenant_id, user_id, role_id)
      VALUES
        (NULL,          '${IDS.users.platform_admin}', '${IDS.roles.platform_admin}'),
        ('${IDS.tenant}', '${IDS.users.owner}',       '${IDS.roles.tenant_owner}'),
        ('${IDS.tenant}', '${IDS.users.admin}',       '${IDS.roles.tenant_admin}'),
        ('${IDS.tenant}', '${IDS.users.manager1}',    '${IDS.roles.store_manager}'),
        ('${IDS.tenant}', '${IDS.users.staff1}',      '${IDS.roles.staff}'),
        ('${IDS.tenant}', '${IDS.users.accountant}',  '${IDS.roles.accountant}')
      ON CONFLICT DO NOTHING
    `);

    // ── 6.2 Store assignments ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO user_store_assignments (tenant_id, user_id, store_id)
      VALUES
        ('${IDS.tenant}', '${IDS.users.manager1}', '${IDS.stores.hn01}'),
        ('${IDS.tenant}', '${IDS.users.manager1}', '${IDS.stores.hn02}'),
        ('${IDS.tenant}', '${IDS.users.staff1}',   '${IDS.stores.hn01}'),
        ('${IDS.tenant}', '${IDS.users.accountant}','${IDS.stores.hn01}'),
        ('${IDS.tenant}', '${IDS.users.accountant}','${IDS.stores.hn02}')
      ON CONFLICT DO NOTHING
    `);

    // Set store manager
    await queryRunner.query(`
      UPDATE stores SET manager_user_id = '${IDS.users.manager1}'
      WHERE id IN ('${IDS.stores.hn01}','${IDS.stores.hn02}')
        AND tenant_id = '${IDS.tenant}'
    `);

    // ── 6.3 Interest policies ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO interest_policies (
        id, tenant_id, name, description, interest_rate, interest_type,
        grace_period_days, late_fee_rate, storage_fee_daily, extension_fee_rate,
        min_loan_amount, max_loan_amount, min_duration_days, max_duration_days,
        is_default, status, created_at, updated_at
      ) VALUES
        ('${IDS.policies.standard}', '${IDS.tenant}',
         'Tiêu chuẩn', 'Lãi suất tiêu chuẩn 3%/tháng',
         3.0000, 'monthly', 3, 0.1000, 5000, 0.5000,
         500000, 50000000, 7, 90,
         true, 'active', '${now}', '${now}'),
        ('${IDS.policies.vip}', '${IDS.tenant}',
         'VIP', 'Lãi suất ưu đãi VIP 2%/tháng',
         2.0000, 'monthly', 5, 0.0500, 3000, 0.3000,
         5000000, 200000000, 15, 180,
         false, 'active', '${now}', '${now}')
      ON CONFLICT DO NOTHING
    `);

    // ── 6.4 Customers ────────────────────────────────────────────────────────
    const customers = [
      ['Nguyễn Thị Lan',     '0912001001', '079001001001', '1985-03-15', 'Quận Hoàn Kiếm, Hà Nội', 'Kinh doanh tự do'],
      ['Trần Văn Minh',      '0912002002', '079002002002', '1978-07-22', 'Quận Đống Đa, Hà Nội',   'Lái xe'],
      ['Lê Thị Hoa',         '0912003003', '079003003003', '1990-11-08', 'Quận Hai Bà Trưng, HN',  'Giáo viên'],
      ['Phạm Văn Tuấn',      '0912004004', '079004004004', '1982-05-30', 'Quận Cầu Giấy, Hà Nội', 'Kỹ sư xây dựng'],
      ['Hoàng Thị Thu',      '0912005005', '079005005005', '1995-01-12', 'Quận Ba Đình, Hà Nội',   'Nhân viên văn phòng'],
      ['Vũ Văn Nam',         '0912006006', '079006006006', '1975-09-03', 'Quận Thanh Xuân, HN',    'Buôn bán nhỏ'],
      ['Đặng Thị Mai',       '0912007007', '079007007007', '1988-12-25', 'Quận Long Biên, HN',     'Nội trợ'],
      ['Bùi Văn Hải',        '0912008008', '079008008008', '1980-06-18', 'Quận Hoàng Mai, HN',     'Thợ điện'],
      ['Ngô Thị Linh',       '0912009009', '079009009009', '1993-04-07', 'Quận Nam Từ Liêm, HN',   'Sinh viên'],
      ['Đinh Văn Dũng',      '0912010010', '079010010010', '1970-10-20', 'Quận Bắc Từ Liêm, HN',  'Thợ hàn'],
    ];

    for (let i = 0; i < customers.length; i++) {
      const [name, phone, idNum, dob, addr, occ] = customers[i];
      await queryRunner.query(`
        INSERT INTO customers (id, tenant_id, full_name, phone, identity_number, date_of_birth,
          permanent_address, current_address, occupation, status, created_at, updated_at)
        VALUES ('${IDS.customers[i]}', '${IDS.tenant}', $1, $2, $3, $4, $5, $5, $6, 'active', '${now}', '${now}')
        ON CONFLICT DO NOTHING
      `, [name, phone, idNum, dob, addr, occ]);
    }

    // ── 6.5 Assets (15 assets across 2 stores) ───────────────────────────────
    const assets = [
      // idx  type          name                    brand     model           color       serial/imei/plate  cond  valuation  loan      store
      [0,  'motorcycle','Honda Wave Alpha 110',  'Honda',  'Wave Alpha',   'Đỏ đen',   'MOTOR001', null, '29X1-12345', 'good',  8000000,  6000000,  IDS.stores.hn01],
      [1,  'motorcycle','Yamaha Sirius RC',       'Yamaha', 'Sirius RC',    'Xanh bạc', 'MOTOR002', null, '29B2-67890', 'good',  7500000,  5500000,  IDS.stores.hn01],
      [2,  'motorcycle','Honda Wave RSX 110',     'Honda',  'Wave RSX',     'Đen',      'MOTOR003', null, '30K3-11111', 'fair',  6000000,  4000000,  IDS.stores.hn02],
      [3,  'phone',     'iPhone 13 128GB',        'Apple',  'iPhone 13',    'Đen',      null, '354001234567890', null, 'good',  14000000, 10000000, IDS.stores.hn01],
      [4,  'phone',     'Samsung Galaxy S22',     'Samsung','Galaxy S22',   'Trắng',    null, '354009876543210', null, 'good',  10000000, 7000000,  IDS.stores.hn01],
      [5,  'phone',     'Xiaomi Redmi Note 12',   'Xiaomi', 'Redmi Note 12','Xanh',     null, '354003333333333', null, 'good',  4500000,  3000000,  IDS.stores.hn02],
      [6,  'phone',     'OPPO Reno 8',            'OPPO',   'Reno 8',       'Đen',      null, '354004444444444', null, 'fair',  5000000,  3500000,  IDS.stores.hn02],
      [7,  'laptop',    'MacBook Air M1 2020',    'Apple',  'MacBook Air',  'Xám',      'C02T12345678', null, null, 'good',  18000000, 13000000, IDS.stores.hn01],
      [8,  'laptop',    'Lenovo ThinkPad E15',    'Lenovo', 'ThinkPad E15', 'Đen',      'PF2XYZ001', null, null, 'good',  10000000, 7000000,  IDS.stores.hn01],
      [9,  'laptop',    'Asus VivoBook 15',       'Asus',   'VivoBook 15',  'Xám bạc',  'N9JABC002', null, null, 'fair',  7000000,  4500000,  IDS.stores.hn02],
      [10, 'gold_jewelry','Nhẫn vàng 24K 2 chỉ', null,    null,           'Vàng',     'GOLD001', null, null, 'good',  6000000,  5000000,  IDS.stores.hn01],
      [11, 'gold_jewelry','Dây chuyền vàng 10K',  null,    null,           'Vàng',     'GOLD002', null, null, 'good',  4000000,  3200000,  IDS.stores.hn02],
      [12, 'watch',     'Casio G-Shock GA-100',   'Casio',  'G-Shock',      'Đen đỏ',   'WATCH001', null, null, 'good',  2500000,  1800000,  IDS.stores.hn01],
      [13, 'watch',     'Seiko 5 Sports SNKE03',  'Seiko',  'Seiko 5',      'Bạc',      'WATCH002', null, null, 'good',  3500000,  2500000,  IDS.stores.hn02],
      [14, 'electronics','Máy chiếu Optoma HD28', 'Optoma', 'HD28',         'Trắng',    'PROJ001', null, null, 'good',  5000000,  3500000,  IDS.stores.hn01],
    ];

    for (const a of assets) {
      const [idx, atype, aname, brand, model, color, serial, imei, plate, cond, valuation, loan, storeId] = a;
      await queryRunner.query(`
        INSERT INTO assets (id, tenant_id, store_id, asset_type, asset_name, brand, model, color,
          serial_number, imei, license_plate, condition_description,
          valuation_amount, proposed_loan_amount, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4::asset_type, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'holding', $15, $15)
        ON CONFLICT DO NOTHING
      `, [
        IDS.assets[idx as number], IDS.tenant, storeId, atype, aname,
        brand || null, model || null, color,
        serial || null, imei || null, plate || null, cond,
        valuation, loan, now
      ]);
    }

    // ── 6.6 Contracts ─────────────────────────────────────────────────────────
    // Dates relative to today
    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10);
    };
    const daysFromNow = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };

    // Contract: [id, store_id, customer_idx, asset_idx, code, principal, rate, type, start_date, due_date, status, created_by, policy_id]
    const contracts = [
      // 4 active
      [0,  IDS.stores.hn01, 0,  0,  'HN01-202605-00001', 6000000,  3.0, 'monthly',  daysAgo(15),  daysFromNow(15), 'active',   IDS.users.staff1,   IDS.policies.standard],
      [1,  IDS.stores.hn01, 1,  3,  'HN01-202605-00002', 10000000, 3.0, 'monthly',  daysAgo(10),  daysFromNow(20), 'active',   IDS.users.staff1,   IDS.policies.standard],
      [2,  IDS.stores.hn02, 2,  2,  'HN02-202605-00001', 4000000,  3.0, 'monthly',  daysAgo(20),  daysFromNow(10), 'active',   IDS.users.manager1, IDS.policies.standard],
      [3,  IDS.stores.hn01, 3,  7,  'HN01-202605-00003', 13000000, 2.0, 'monthly',  daysAgo(5),   daysFromNow(25), 'active',   IDS.users.staff1,   IDS.policies.vip],
      // 2 near_due (due in 3-6 days)
      [4,  IDS.stores.hn01, 4,  4,  'HN01-202604-00001', 7000000,  3.0, 'monthly',  daysAgo(27),  daysFromNow(3),  'near_due', IDS.users.staff1,   IDS.policies.standard],
      [5,  IDS.stores.hn02, 5,  9,  'HN02-202604-00001', 4500000,  3.0, 'monthly',  daysAgo(25),  daysFromNow(5),  'near_due', IDS.users.manager1, IDS.policies.standard],
      // 2 overdue (past due_date)
      [6,  IDS.stores.hn01, 6,  8,  'HN01-202604-00002', 7000000,  3.0, 'monthly',  daysAgo(40),  daysAgo(10),     'overdue',  IDS.users.staff1,   IDS.policies.standard],
      [7,  IDS.stores.hn02, 7,  11, 'HN02-202604-00002', 3200000,  3.0, 'monthly',  daysAgo(35),  daysAgo(5),      'overdue',  IDS.users.manager1, IDS.policies.standard],
      // 2 settled
      [8,  IDS.stores.hn01, 8,  12, 'HN01-202603-00001', 1800000,  3.0, 'monthly',  daysAgo(60),  daysAgo(30),     'settled',  IDS.users.staff1,   IDS.policies.standard],
      [9,  IDS.stores.hn02, 9,  13, 'HN02-202603-00001', 2500000,  3.0, 'monthly',  daysAgo(55),  daysAgo(25),     'settled',  IDS.users.manager1, IDS.policies.standard],
      // 1 extended
      [10, IDS.stores.hn01, 0,  10, 'HN01-202604-00003', 5000000,  3.0, 'monthly',  daysAgo(45),  daysFromNow(15), 'extended', IDS.users.staff1,   IDS.policies.standard],
      // 1 cancelled
      [11, IDS.stores.hn02, 1,  14, 'HN02-202604-00003', 3500000,  3.0, 'monthly',  daysAgo(50),  daysAgo(20),     'cancelled',IDS.users.manager1, IDS.policies.standard],
    ];

    for (const c of contracts) {
      const [idx, storeId, custIdx, assetIdx, code, principal, rate, itype, startDate, dueDate, status, createdBy, policyId] = c;
      await queryRunner.query(`
        INSERT INTO pawn_contracts (id, tenant_id, store_id, customer_id, contract_code,
          principal_amount, interest_rate, interest_type, start_date, due_date,
          status, policy_id, created_by, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8::interest_type,$9,$10,$11::contract_status,$12,$13,$14,$14)
        ON CONFLICT DO NOTHING
      `, [
        IDS.contracts[idx as number], IDS.tenant, storeId,
        IDS.customers[custIdx as number], code,
        principal, rate, itype, startDate, dueDate,
        status, policyId, createdBy, now
      ]);

      // Link contract ↔ asset
      await queryRunner.query(`
        INSERT INTO contract_assets (tenant_id, contract_id, asset_id)
        VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
      `, [IDS.tenant, IDS.contracts[idx as number], IDS.assets[assetIdx as number]]);
    }

    // ── 6.7 Transactions ─────────────────────────────────────────────────────
    // 12 disbursements (one per contract)
    for (let i = 0; i < 12; i++) {
      const c = contracts[i];
      const [idx, storeId, , , , principal, , , startDate, , , createdBy] = c;
      await queryRunner.query(`
        INSERT INTO contract_transactions (id, tenant_id, store_id, contract_id,
          transaction_type, amount, payment_method, transaction_date, note, created_by, created_at)
        VALUES ($1,$2,$3,$4,'disbursement',$5,'cash',$6,'Giải ngân ban đầu',$7,$8)
        ON CONFLICT DO NOTHING
      `, [
        IDS.transactions[i], IDS.tenant, storeId,
        IDS.contracts[idx as number], principal, startDate, createdBy, now
      ]);
    }

    // 6 interest collections (for active/near_due/overdue contracts: 0,1,4,5,6,7)
    const interestContracts = [0, 1, 4, 5, 6, 7];
    for (let j = 0; j < interestContracts.length; j++) {
      const contractArrayIdx = interestContracts[j];
      const c = contracts[contractArrayIdx];
      const [idx, storeId, , , , principal, rate, , startDate, , , createdBy] = c;
      const interestAmt = Math.round((principal as number) * ((rate as number) / 100));
      const txIdx = 12 + j;
      await queryRunner.query(`
        INSERT INTO contract_transactions (id, tenant_id, store_id, contract_id,
          transaction_type, amount, payment_method, transaction_date, note, created_by, created_at)
        VALUES ($1,$2,$3,$4,'interest_collection',$5,'cash',$6,'Thu lãi tháng 1',$7,$8)
        ON CONFLICT DO NOTHING
      `, [
        IDS.transactions[txIdx], IDS.tenant, storeId,
        IDS.contracts[idx as number], interestAmt, startDate, createdBy, now
      ]);
    }

    // 2 settlement transactions (for settled contracts 8 & 9)
    const settledContracts = [8, 9];
    for (let k = 0; k < 2; k++) {
      const c = contracts[settledContracts[k]];
      const [idx, storeId, , , , principal, rate, , startDate, dueDate, , createdBy] = c;
      const interest = Math.round((principal as number) * ((rate as number) / 100));
      const total = (principal as number) + interest;
      const txIdx = 18 + k;
      await queryRunner.query(`
        INSERT INTO contract_transactions (id, tenant_id, store_id, contract_id,
          transaction_type, amount, payment_method, transaction_date, note, created_by, created_at)
        VALUES ($1,$2,$3,$4,'settlement',$5,'bank_transfer',$6,'Tất toán hợp đồng',$7,$8)
        ON CONFLICT DO NOTHING
      `, [
        IDS.transactions[txIdx], IDS.tenant, storeId,
        IDS.contracts[idx as number], total, dueDate, createdBy, now
      ]);
    }

    // 1 extension fee transaction (for extended contract 10)
    {
      const c = contracts[10];
      const [idx, storeId, , , , principal, rate, , startDate, , , createdBy] = c;
      const extensionFee = Math.round((principal as number) * ((rate as number) / 100));
      await queryRunner.query(`
        INSERT INTO contract_transactions (id, tenant_id, store_id, contract_id,
          transaction_type, amount, payment_method, transaction_date, note, created_by, created_at)
        VALUES ($1,$2,$3,$4,'interest_collection',$5,'cash',$6,'Thu lãi khi gia hạn',$7,$8)
        ON CONFLICT DO NOTHING
      `, [
        IDS.transactions[20], IDS.tenant, storeId,
        IDS.contracts[idx as number], extensionFee, startDate, createdBy, now
      ]);
    }

    // 1 disbursement void (demonstrate void capability)
    await queryRunner.query(`
      INSERT INTO contract_transactions (id, tenant_id, store_id, contract_id,
        transaction_type, amount, payment_method, transaction_date, note, void_of_id, created_by, created_at)
      VALUES ($1,$2,$3,$4,'void',$5,'cash',$6,'Void demo: nhập nhầm số tiền',$7,$8,$9)
      ON CONFLICT DO NOTHING
    `, [
      IDS.transactions[21], IDS.tenant, IDS.stores.hn01,
      IDS.contracts[0],
      0, now, IDS.transactions[0], IDS.users.admin, now
    ]);

    // ── 6.8 Contract status history ──────────────────────────────────────────
    // All non-draft contracts get draft→current_status history entry
    const historyContracts = [
      // [contractIdx, from, to]
      [0,  null,     'active'],
      [1,  null,     'active'],
      [2,  null,     'active'],
      [3,  null,     'active'],
      [4,  'active', 'near_due'],
      [5,  'active', 'near_due'],
      [6,  'active', 'overdue'],
      [7,  'active', 'overdue'],
      [8,  'active', 'settled'],
      [9,  'active', 'settled'],
      [10, 'active', 'extended'],
      [11, 'active', 'cancelled'],
    ];

    for (const [cIdx, fromStatus, toStatus] of historyContracts) {
      const c = contracts[cIdx as number];
      const [idx, , , , , , , , startDate, , , createdBy] = c;
      if (fromStatus === null) {
        // draft → active
        await queryRunner.query(`
          INSERT INTO contract_status_history (tenant_id, contract_id, from_status, to_status, note, changed_by, created_at)
          VALUES ($1,$2,NULL,$3::contract_status,'Kích hoạt hợp đồng',$4,$5) ON CONFLICT DO NOTHING
        `, [IDS.tenant, IDS.contracts[idx as number], toStatus, createdBy, now]);
      } else {
        // active → target status
        await queryRunner.query(`
          INSERT INTO contract_status_history (tenant_id, contract_id, from_status, to_status, note, changed_by, created_at)
          VALUES ($1,$2,'active'::contract_status,$3::contract_status,$4,$5,$6) ON CONFLICT DO NOTHING
        `, [IDS.tenant, IDS.contracts[idx as number], toStatus,
            `Chuyển trạng thái: active → ${toStatus}`, createdBy, now]);
      }
    }

    // ── 6.9 Asset inventory (held assets — contracts 0-7, 10) ────────────────
    // Settled (8,9) and cancelled (11) contracts don't hold assets
    const heldContractIdxs = [0, 1, 2, 3, 4, 5, 6, 7, 10];
    const locationCodes = ['TU-A1', 'TU-A2', 'TU-B1', 'TU-B2', 'TU-C1', 'TU-C2', 'KHO-1', 'KHO-2', 'TU-D1'];

    for (let m = 0; m < heldContractIdxs.length; m++) {
      const cIdx = heldContractIdxs[m];
      const c = contracts[cIdx];
      const [, storeId, , assetIdx] = c;
      await queryRunner.query(`
        INSERT INTO asset_inventory (tenant_id, store_id, asset_id, location_code, location_note,
          received_at, status)
        VALUES ($1,$2,$3,$4,'Nhận tài sản khi tạo hợp đồng',$5,'in_storage')
        ON CONFLICT DO NOTHING
      `, [IDS.tenant, storeId, IDS.assets[assetIdx as number], locationCodes[m], now]);
    }

    // Update asset status for overdue contracts
    await queryRunner.query(`
      UPDATE assets SET status = 'overdue'
      WHERE id IN ($1, $2) AND tenant_id = $3
    `, [IDS.assets[8], IDS.assets[11], IDS.tenant]);

    // Update asset status for settled contracts (redeemed)
    await queryRunner.query(`
      UPDATE assets SET status = 'redeemed'
      WHERE id IN ($1, $2) AND tenant_id = $3
    `, [IDS.assets[12], IDS.assets[13], IDS.tenant]);

    // Update asset status for cancelled contract (back to some neutral state — redeemed/returned)
    await queryRunner.query(`
      UPDATE assets SET status = 'redeemed'
      WHERE id = $1 AND tenant_id = $2
    `, [IDS.assets[14], IDS.tenant]);

    // ── 6.10 Extension record for contract 10 ───────────────────────────────
    const ext = contracts[10];
    const [extIdx, extStoreId, , , , extPrincipal, extRate, , extStartDate, extOldDue, , extCreatedBy] = ext;
    const extFee = Math.round((extPrincipal as number) * ((extRate as number) / 100));
    await queryRunner.query(`
      INSERT INTO contract_extensions (id, tenant_id, contract_id, old_due_date, new_due_date,
        interest_paid_amount, fee_amount, created_by, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING
    `, [
      IDS.extensions[0], IDS.tenant, IDS.contracts[extIdx as number],
      daysAgo(45 - 30),   // old due date was ~15 days ago from start  
      daysFromNow(15),    // new due date
      extFee, 0, extCreatedBy, now
    ]);

    console.log('[SeedDevelopmentData] ✅ Seed data inserted successfully');
    console.log('  Tenant:    PAW8DEMO');
    console.log('  Stores:    HN01, HN02');
    console.log('  Users:     platform@, owner@, admin@, manager@, staff@, accountant@paw8.demo');
    console.log('  Password:  Demo@123456');
    console.log('  Customers: 10');
    console.log('  Assets:    15');
    console.log('  Contracts: 12 (4 active, 2 near_due, 2 overdue, 2 settled, 1 extended, 1 cancelled)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    // Delete in reverse FK order
    await queryRunner.query(`DELETE FROM contract_extensions WHERE id = '${IDS.extensions[0]}'`);
    await queryRunner.query(`DELETE FROM asset_inventory WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM contract_status_history WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM contract_transactions WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM contract_assets WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM pawn_contracts WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM assets WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM customers WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM interest_policies WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM user_store_assignments WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM user_roles WHERE tenant_id = '${IDS.tenant}' OR tenant_id IS NULL AND user_id = '${IDS.users.platform_admin}'`);
    await queryRunner.query(`DELETE FROM users WHERE id IN (${Object.values(IDS.users).map(id => `'${id}'`).join(',')})`);
    await queryRunner.query(`DELETE FROM roles WHERE id IN (${Object.values(IDS.roles).map(id => `'${id}'`).join(',')})`);
    await queryRunner.query(`UPDATE stores SET manager_user_id = NULL WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM stores WHERE tenant_id = '${IDS.tenant}'`);
    await queryRunner.query(`DELETE FROM tenants WHERE id = '${IDS.tenant}'`);
  }
}
