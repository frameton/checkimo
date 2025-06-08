import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe doit faire moins de 72 caractères.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,72}$/, {
    message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre, un caractère spécial, et aucun espace.'
  })
  newPassword: string;

  @IsString()
  token: string;
}
