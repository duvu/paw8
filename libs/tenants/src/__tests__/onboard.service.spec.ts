import { TenantsService } from '../tenants.service';

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    query: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

const mockRepository = {
  findById: jest.fn(),
  findByCode: jest.fn(),
  findAll: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  setStatus: jest.fn(),
  countStores: jest.fn(),
  countUsers: jest.fn(),
  hasOwner: jest.fn(),
};

const mockUsersRepository = {
  insert: jest.fn(),
  findRoleByName: jest.fn(),
  insertRole: jest.fn(),
  insertUserRole: jest.fn(),
};

describe('TenantsService.onboard', () => {
  let service: TenantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantsService(
      mockDataSource as never,
      mockRepository as never,
      mockUsersRepository as never,
    );
  });

  it('should create tenant and owner atomically', async () => {
    const newTenantId = 'new-tenant-uuid';
    const newUserId = 'new-user-uuid';

    mockQueryRunner.manager.query
      .mockResolvedValueOnce([{ id: newTenantId }]) // INSERT tenant
      .mockResolvedValueOnce([{ id: newUserId }])  // INSERT user
      .mockResolvedValueOnce([{ id: 'role-uuid', name: 'tenant_owner' }]) // SELECT role
      .mockResolvedValueOnce([{ id: 'user-role-uuid' }]); // INSERT user_role

    const dto = {
      name: 'Test Corp',
      code: 'testcorp',
      plan: 'starter' as const,
      maxStores: 3,
      maxUsers: 10,
      ownerEmail: 'owner@testcorp.com',
      ownerFullName: 'Test Owner',
      ownerPassword: 'Secure@Pass123',
    };

    const result = await service.onboard(dto);

    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id: newTenantId }));
  });

  it('should rollback if owner insertion fails', async () => {
    mockQueryRunner.manager.query
      .mockResolvedValueOnce([{ id: 'tenant-uuid' }]) // INSERT tenant OK
      .mockRejectedValueOnce(new Error('Email duplicate')); // INSERT user fails

    const dto = {
      name: 'Fail Corp',
      code: 'failcorp',
      plan: 'free' as const,
      maxStores: 1,
      maxUsers: 5,
      ownerEmail: 'dupe@testcorp.com',
      ownerFullName: 'Fail Owner',
      ownerPassword: 'Secure@Pass123',
    };

    await expect(service.onboard(dto)).rejects.toThrow();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
  });
});

describe('TenantsService.getUsage', () => {
  let service: TenantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantsService(
      mockDataSource as never,
      mockRepository as never,
      mockUsersRepository as never,
    );
  });

  it('should return current and max for stores and users', async () => {
    mockRepository.findById.mockResolvedValue({
      id: 'tenant-1',
      max_stores: 5,
      max_users: 20,
    });
    mockRepository.countStores.mockResolvedValue(2);
    mockRepository.countUsers.mockResolvedValue(7);

    const result = await service.getUsage('tenant-1');

    expect(result).toEqual({
      stores: { current: 2, max: 5 },
      users: { current: 7, max: 20 },
    });
  });
});
