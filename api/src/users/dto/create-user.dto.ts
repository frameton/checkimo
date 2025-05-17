import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * Données attendues quand le client crée un nouvel utilisateur.
 * !!! Ne PAS inclure id, createdAt, etc. -> générés par la base / Prisma.
 */
export class CreateUserDto {

    /** Email unique, obligatoire, validé RFC 5322 */
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @MinLength(8)        password: string;  // maintenant requis

  @IsString()          firstName: string;

  @IsString()          lastName: string;
  
  @IsEnum(Role)        role?: Role = Role.USER;
}