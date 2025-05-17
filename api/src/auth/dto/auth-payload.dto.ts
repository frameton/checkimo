import { ApiProperty } from '@nestjs/swagger';

export class AuthPayloadDto {
  @ApiProperty({ description: 'JWT d’accès à utiliser en Bearer token' })
  accessToken: string;
}