import { Module } from '@nestjs/common';
import { DataProtectionService } from '../../common/security/data-protection.service';
import { AuthModule } from '../auth/auth.module';
import { LeadsController } from './leads.controller';
import { FormSubmissionSecurityService } from './form-submission-security.service';
import { LeadsService } from './leads.service';
import { PublicLeadsController } from './public-leads.controller';

@Module({
  imports: [AuthModule],
  controllers: [LeadsController, PublicLeadsController],
  providers: [
    LeadsService,
    DataProtectionService,
    FormSubmissionSecurityService,
  ],
})
export class LeadsModule {}
