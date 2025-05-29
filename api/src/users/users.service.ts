import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /* CREATE ----------------------------------------------------- */
  async create(dto: CreateUserDto) {
    const hash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: { ...dto, password: hash },
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
