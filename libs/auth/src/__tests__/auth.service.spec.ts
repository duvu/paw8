import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-1',
  tenant_id: 'tenant-1',
  email: 'staff@demo.paw8.dev',
  password_hash: '',
  status: 'active',
  roles: 'staff',
  store_ids: ['store-1'],
};

describe('AuthService', () => {
  let service: AuthService;
  let mockDataSource: {
    query: jest.Mock;
  };
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    mockUser.password_hash = await bcrypt.hash('Password@123', 12);

    mockDataSource = {
      query: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    service = new AuthService(
      mockDataSource as never,
      mockJwtService as JwtService,
    );

    // Mock fs.readFileSync for private key
    jest.mock('fs', () => ({
      ...jest.requireActual('fs'),
      readFileSync: jest.fn().mockReturnValue('mock-key'),
    }));
  });

  afterEach(() => jest.restoreAllMocks());

  describe('login', () => {
    it('should throw UnauthorizedException for unknown email', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);
      await expect(
        service.login({ email: 'unknown@test.com', password: 'any' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([mockUser]) // user query
        .mockResolvedValueOnce([{ status: 'active' }]) // tenant query
        .mockResolvedValueOnce([]); // audit log insert
      await expect(
        service.login({ email: mockUser.email, password: 'wrongpassword' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw ForbiddenException for locked user', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ ...mockUser, status: 'locked' }]);
      await expect(
        service.login({ email: mockUser.email, password: 'Password@123' }),
      ).rejects.toThrow('Account is locked');
    });
  });

  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      mockDataSource.query.mockResolvedValue([]);
      await service.logout('user-1');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens SET revoked_at'),
        ['user-1'],
      );
    });
  });

  describe('changePassword', () => {
    it('should throw if current password is wrong', async () => {
      mockDataSource.query.mockResolvedValueOnce([mockUser]);
      await expect(
        service.changePassword('user-1', 'tenant-1', {
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword@123',
        }),
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
