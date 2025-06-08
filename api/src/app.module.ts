import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RateLimiterModule } from 'nestjs-rate-limiter';


@Module({
  imports: [
    UsersModule,
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
    isGlobal: true,             // évite de l’importer dans chaque module
    envFilePath: '.env',        // ou ['.env', '.env.local']
    // petite validation des variables d'environnement
    validate: (env) => {
      if (!env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET missing');
      if (!env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET missing');
      return env;
    },
  }),
  RateLimiterModule.register({
      for: 'Express',
      type: 'Memory',         // ou 'Redis' pour le multi-instance
      points: 5,              // Nombre d'essais autorisés
      duration: 60,           // Période (en secondes) : ici 5 essais/minute
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],

})

export class AppModule {}
