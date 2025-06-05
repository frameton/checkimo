import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly mailService: MailService) {}

  /* CREATE ----------------------------------------------------- */
  async create(dto: CreateUserDto) {
    const emailExist = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailExist) throw new Error("Email déjà utilisé");

    const hash = await argon2.hash(dto.password);
    const confirmationToken = randomUUID();
    const confirmationSentAt = new Date();

  // Crée l'utilisateur, email non confirmé
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hash,
        role: 'USER',
        isEmailConfirmed: false,
        confirmationToken,
        confirmationSentAt,
      },
    });

    try {
      // Envoi du mail
      await this.mailService.sendConfirmationEmail(user.email, confirmationToken);
      return { message: "Inscription réussie, vérifiez votre email pour confirmer votre compte." };
    } catch (err) {
      // Si l'envoi échoue, on supprime l'utilisateur créé
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new Error("Erreur lors de l’envoi du mail de confirmation. Aucun compte créé.");
    }
  }


  async confirmEmail(token: string) {
    const user = await this.prisma.user.findUnique({ where: { confirmationToken: token } });
    if (!user) throw new Error("Token invalide ou déjà utilisé");

    // Option : limite dans le temps (ex 24h)
    const now = new Date();
    if (user.confirmationSentAt && (now.getTime() - user.confirmationSentAt.getTime()) > 1*3600*1000) {
      throw new Error("Lien expiré, merci de refaire une inscription.");
    }

    await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        isEmailConfirmed: true,
        confirmationToken: null,
        confirmationSentAt: null
      },
    });

    return { message: "Compte confirmé, vous pouvez vous connecter." };
  }


  async adminCreate(dto: CreateUserDto) {
    const hash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: { ...dto, password: hash, role: 'ADMIN' },
    });
  }

  /* READ ------------------------------------------------------- */
  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        // Ajoute ici d'autres champs publics
      },
    });
  }

  /* UPDATE ----------------------------------------------------- */
  async update(id: string, dto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = { ...dto };
    if (dto.password) data.password = await argon2.hash(dto.password);
    return this.prisma.user.update({ where: { id }, data });
  }

  /* DELETE ----------------------------------------------------- */
  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
// export class UsersService {
//   create(createUserDto: CreateUserDto) {
//     return 'This action adds a new user';
//   }

//   findAll() {
//     return `This action returns all users`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} user`;
//   }

//   update(id: number, updateUserDto: UpdateUserDto) {
//     return `This action updates a #${id} user`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} user`;
//   }
// }
