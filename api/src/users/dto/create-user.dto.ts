import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * Données attendues quand le client crée un nouvel utilisateur.
 * !!! Ne PAS inclure id, createdAt, etc. -> générés par la base / Prisma.
 */
export class CreateUserDto {

    /** Email unique, obligatoire, validé RFC 5322 */
  @IsEmail({}, { message: "Format d'email invalide" })
  @MaxLength(254, { message: "Email trop long (max 254)" })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Email invalide" })
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString({ message: 'Le prénom est requis.' })
  @MaxLength(100, { message: 'Le prénom doit faire moins de 100 caractères.' })
  @Matches(/^(?!.*[-\s]{2,})[a-zA-ZÀ-ÿ]+([-\' ][a-zA-ZÀ-ÿ]+)*$/, { message: 'Le prénom contient des caractères invalides.' })
  firstName: string;

  @IsString({ message: 'Le nom est requis.' })
  @MaxLength(100, { message: 'Le nom doit faire moins de 100 caractères.' })
  @Matches(/^(?!.*[-\s]{2,})[a-zA-ZÀ-ÿ]+([-\' ][a-zA-ZÀ-ÿ]+)*$/, { message: 'Le nom contient des caractères invalides.' })
  lastName: string;

  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe doit faire moins de 72 caractères.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,72}$/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre, un caractère spécial, et aucun espace.',
  })
  password: string;
  
  @IsEnum(Role)        role?: Role = Role.USER;
}