import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { LeadTypeInput } from '../../forms/dto/save-form.dto';

export enum LeadStatusInput {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CLOSED = 'closed',
  INVALID = 'invalid',
}

export class ListLeadsQueryDto {
  @IsOptional()
  @IsEnum(LeadTypeInput)
  type?: LeadTypeInput;

  @IsOptional()
  @IsEnum(LeadStatusInput)
  status?: LeadStatusInput;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
