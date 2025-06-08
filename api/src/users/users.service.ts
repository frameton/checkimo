import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { MailService } from 'src/mail/mail.service';

const RESEND_CONFIRMATION_COOLDOWN_MS = 1 * 60 * 1000; // 2 minutes
const RESET_TOKEN_EXPIRE_MINUTES = 60;

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

  async sendResetPasswordEmail(email: string) {
    const genericMsg = "Si ce compte existe, un email de réinitialisation a été envoyé.";
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: genericMsg };

    // Garde la réponse neutre même si déjà un token
    const resetToken = randomUUID();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordSentAt: new Date(),
      },
    });

    await this.mailService.sendResetPasswordEmail(user.email, resetToken);

    return { message: genericMsg };
  }


  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { resetPasswordToken: token } });
    if (!user) return { success: false, message: "Lien invalide ou expiré." };

    const now = new Date();
    if (!user.resetPasswordSentAt ||
        (now.getTime() - user.resetPasswordSentAt.getTime()) > RESET_TOKEN_EXPIRE_MINUTES * 60 * 1000
    ) {
      return { success: false, message: "Lien invalide ou expiré." };
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await argon2.hash(newPassword),
        resetPasswordToken: null,
        resetPasswordSentAt: null,
      },
    });

    return { success: true, message: "Votre mot de passe a été réinitialisé avec succès." };
  }


   async resendConfirmationEmail(email: string) {
  
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Toujours même réponse, que l'utilisateur existe ou non
    const genericMsg = "Si un compte existe, un email de confirmation a été envoyé.";
    
    if (!user) {
       throw new Error("Error.");
    }
    if (user.isEmailConfirmed) {
      throw new Error("Email déjà confirmé, vous pouvez vous connecter directement.");
    }

    // Limitation anti-abus : ne pas renvoyer trop souvent
    if (user.confirmationSentAt && new Date().getTime() - user.confirmationSentAt.getTime() < RESEND_CONFIRMATION_COOLDOWN_MS) {
      throw new Error("Merci de patienter avant de redemander un nouvel email de confirmation.");
    }

    // Regénère un token pour chaque nouvel envoi
    const confirmationToken = randomUUID();
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          confirmationToken,
          confirmationSentAt: new Date(),
        },
      });

      await this.mailService.sendConfirmationEmail(user.email, confirmationToken);

      // Logger.log(`Confirmation email resent to ${email}`);
      return { message: genericMsg };
    } catch (err) {
      // Logger.error(`Erreur lors du renvoi email confirmation à ${email}`, err);
      return { message: "Une erreur technique est survenue. Merci de réessayer plus tard." };
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
