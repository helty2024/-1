import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LeadStatusInput } from './list-leads-query.dto';

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LeadStatusInput })
  @IsEnum(LeadStatusInput)
  status!: LeadStatusInput;
}
