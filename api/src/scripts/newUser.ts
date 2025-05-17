// scripts/seed-user.ts
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

async function main() {
  const prisma = new PrismaClient();
  const hash = await argon2.hash('Secret123', { type: argon2.argon2id });

  await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: hash,
      firstName: 'Alice',
      lastName: 'Dubois',
      role: 'USER',
    },
  });

  console.log('Utilisateur créé');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
