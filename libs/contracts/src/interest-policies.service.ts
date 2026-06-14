import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InterestPoliciesRepository } from './interest-policies.repository';
import {
  CreateInterestPolicyDto,
  UpdateInterestPolicyDto,
  InterestPolicyResponseDto,
} from './dto/interest-policy.dto';

@Injectable()
export class InterestPoliciesService {
  constructor(private readonly interestPoliciesRepository: InterestPoliciesRepository) {}

  async create(tenantId: string, dto: CreateInterestPolicyDto): Promise<InterestPolicyResponseDto> {
    return this.interestPoliciesRepository.insert(tenantId, {
      name: dto.name,
      description: dto.description ?? null,
      interestRate: dto.interestRate,
      interestType: dto.interestType,
      gracePeriodDays: dto.gracePeriodDays ?? 0,
      lateFeeRate: dto.lateFeeRate ?? 0,
      storageFeeDailyVnd: dto.storageFeeDailyVnd ?? 0,
      extensionFeeRate: dto.extensionFeeRate ?? 0,
      minLoanAmount: dto.minLoanAmount ?? null,
      maxLoanAmount: dto.maxLoanAmount ?? null,
      minDurationDays: dto.minDurationDays ?? 1,
      maxDurationDays: dto.maxDurationDays ?? 365,
      isDefault: dto.isDefault ?? false,
    });
  }

  async findAll(tenantId: string, page = 1, limit = 20): Promise<{ data: InterestPolicyResponseDto[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.interestPoliciesRepository.findAll(tenantId, limit, offset),
      this.interestPoliciesRepository.count(tenantId),
    ]);
    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<InterestPolicyResponseDto> {
    const policy = await this.interestPoliciesRepository.findById(tenantId, id);
    if (!policy) throw new NotFoundException(`Interest policy ${id} not found`);
    return policy;
  }

  async update(tenantId: string, id: string, dto: UpdateInterestPolicyDto): Promise<InterestPolicyResponseDto> {
    await this.findOne(tenantId, id);
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => { fields.push(col); values.push(val); };

    if (dto.name !== undefined) add('name', dto.name);
    if (dto.description !== undefined) add('description', dto.description);
    if (dto.interestRate !== undefined) add('interest_rate', dto.interestRate);
    if (dto.interestType !== undefined) add('interest_type', dto.interestType);
    if (dto.gracePeriodDays !== undefined) add('grace_period_days', dto.gracePeriodDays);
    if (dto.lateFeeRate !== undefined) add('late_fee_rate', dto.lateFeeRate);
    if (dto.storageFeeDailyVnd !== undefined) add('storage_fee_daily', dto.storageFeeDailyVnd);
    if (dto.extensionFeeRate !== undefined) add('extension_fee_rate', dto.extensionFeeRate);
    if (dto.minLoanAmount !== undefined) add('min_loan_amount', dto.minLoanAmount);
    if (dto.maxLoanAmount !== undefined) add('max_loan_amount', dto.maxLoanAmount);
    if (dto.minDurationDays !== undefined) add('min_duration_days', dto.minDurationDays);
    if (dto.maxDurationDays !== undefined) add('max_duration_days', dto.maxDurationDays);

    if (fields.length === 0) throw new BadRequestException('No fields to update');
    return this.interestPoliciesRepository.update(tenantId, id, fields, values);
  }

  async setDefault(tenantId: string, id: string): Promise<InterestPolicyResponseDto> {
    await this.findOne(tenantId, id);
    return this.interestPoliciesRepository.setDefault(tenantId, id);
  }
}
