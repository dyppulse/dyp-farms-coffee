import { IsIn, IsString, MaxLength } from 'class-validator';

export class PlanIdDto {
  @IsString()
  @MaxLength(64)
  planId: string;
}

export class FrequencyDto {
  @IsIn(['weekly', 'biweekly', 'monthly'])
  frequency: 'weekly' | 'biweekly' | 'monthly';
}
