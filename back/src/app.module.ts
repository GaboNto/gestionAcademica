import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthorizationRequestsModule } from './authorization-requests/authorization-requests.module';

@Module({
  imports: [PrismaModule, AuthorizationRequestsModule],
})
export class AppModule {}
