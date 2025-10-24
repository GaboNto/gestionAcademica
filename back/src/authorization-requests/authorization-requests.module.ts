import { Module } from '@nestjs/common';
import { AuthorizationRequestsController } from './authorization-requests.controller';
import { AuthorizationRequestsService } from './authorization-requests.service';
import { AuthorizationRequestPdfController } from './authorization-request-pdf.controller';
import { AuthorizationRequestPdfService } from './authorization-request-pdf.service';

@Module({
  controllers: [AuthorizationRequestsController, AuthorizationRequestPdfController],
  providers: [AuthorizationRequestsService, AuthorizationRequestPdfService],
})
export class AuthorizationRequestsModule {}
