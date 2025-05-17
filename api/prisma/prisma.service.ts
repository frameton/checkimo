import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * PrismaService étend PrismaClient pour bénéficier du typage généré
 * et branche automatiquement la connexion / déconnexion au cycle Nest.
 */
@Injectable()
export class PrismaService extends PrismaClient<
Prisma.PrismaClientOptions,
'beforeExit'
> implements OnModuleInit, OnModuleDestroy {
  /** Connexion ouverte quand Nest démarre */
  async onModuleInit() {
    await this.$connect();
  }

  /** Déconnexion propre quand Nest se ferme (SIGTERM, SIGINT, etc.) */
  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * (optionnel) — si tu veux que Prisma écoute l’arrêt de l’application
   * sans devoir gérer onModuleDestroy : appelle-la dans main.ts
   */
  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}