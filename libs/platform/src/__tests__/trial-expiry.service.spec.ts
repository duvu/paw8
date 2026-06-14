import { Test, TestingModule } from '@nestjs/testing';
import { TrialExpiryService } from '../trial-expiry.service';
import { TenantsRepository } from '../../tenants/src/tenants.repository';
import { AuditService } from '../../audit/src/audit.service';

const mockTenantsRepository = {
  findExpiredTrials: jest.fn(),
  setStatus: jest.fn(),
};

const mockAuditService = {
  log: jest.fn(),
};

describe('TrialExpiryService', () => {
  let service: TrialExpiryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialExpiryService,
        { provide: TenantsRepository, useValue: mockTenantsRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TrialExpiryService>(TrialExpiryService);
  });

  describe('handleTrialExpiry', () => {
    it('should suspend tenants whose trials have expired', async () => {
      const expiredTenants = [
        { id: 'tenant-1', name: 'Expired Corp' },
        { id: 'tenant-2', name: 'Old Trial LLC' },
      ];
      mockTenantsRepository.findExpiredTrials.mockResolvedValue(expiredTenants);
      mockTenantsRepository.setStatus.mockResolvedValue(undefined);
      mockAuditService.log.mockResolvedValue(undefined);

      await service.handleTrialExpiry();

      expect(mockTenantsRepository.findExpiredTrials).toHaveBeenCalledTimes(1);
      expect(mockTenantsRepository.setStatus).toHaveBeenCalledTimes(2);
      expect(mockTenantsRepository.setStatus).toHaveBeenCalledWith('tenant-1', 'suspended');
      expect(mockTenantsRepository.setStatus).toHaveBeenCalledWith('tenant-2', 'suspended');
      expect(mockAuditService.log).toHaveBeenCalledTimes(2);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'system',
          action: 'trial_expired',
          entityType: 'tenant',
          entityId: 'tenant-1',
        }),
      );
    });

    it('should do nothing when no trials have expired', async () => {
      mockTenantsRepository.findExpiredTrials.mockResolvedValue([]);

      await service.handleTrialExpiry();

      expect(mockTenantsRepository.setStatus).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should not throw if a single tenant suspension fails', async () => {
      const expiredTenants = [
        { id: 'tenant-1', name: 'Good' },
        { id: 'tenant-2', name: 'Fails' },
      ];
      mockTenantsRepository.findExpiredTrials.mockResolvedValue(expiredTenants);
      mockTenantsRepository.setStatus
        .mockResolvedValueOnce(undefined)         // tenant-1 succeeds
        .mockRejectedValueOnce(new Error('DB error')); // tenant-2 fails
      mockAuditService.log.mockResolvedValue(undefined);

      // Should not throw — errors are swallowed per-tenant
      await expect(service.handleTrialExpiry()).resolves.not.toThrow();

      // Only tenant-1 audit log recorded
      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: 'tenant-1' }),
      );
    });
  });
});
