import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()               // ← rendez-le global pour éviter de l’importer partout
@Module({
  providers: [PrismaService],
  exports: [PrismaService],   // on l’exporte pour les autres modules
})
export class PrismaModule {}