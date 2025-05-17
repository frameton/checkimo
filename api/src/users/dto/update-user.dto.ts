import { PartialType } from '@nestjs/mapped-types';   // utilitaire Nest
import { CreateUserDto } from './create-user.dto';
import { IsOptional, MinLength } from 'class-validator';

/**
 * Les règles de validation du CreateUserDto (IsEmail, MaxLength, etc.)
 * sont conservées, mais chaque propriété devient optionnelle.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional() @MinLength(8) password?: string;
}
