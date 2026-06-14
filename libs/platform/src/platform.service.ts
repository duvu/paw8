import { Injectable } from '@nestjs/common';
import { PlatformRepository } from './platform.repository';

@Injectable()
export class PlatformService {
  constructor(private readonly platformRepository: PlatformRepository) {}

  getStats() {
    return this.platformRepository.getStats();
  }

  getRecentActivity() {
    return this.platformRepository.getRecentActivity(10);
  }
}
