import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('org-tree')
  @Roles(Role.ADMIN)
  async getOrgTree() {
    return this.usersService.findOrgTree();
  }

  @Get('managers')
  @Roles(Role.ADMIN)
  async getManagers() {
    return this.usersService.getManagers();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() body: { email: string; name: string; password: string; role: Role; managerId?: string },
  ) {
    return this.usersService.create(body);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  async updateRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.usersService.updateRole(id, body.role);
  }

  @Patch(':id/manager')
  @Roles(Role.ADMIN)
  async updateManager(@Param('id') id: string, @Body() body: { managerId: string | null }) {
    return this.usersService.updateManager(id, body.managerId);
  }
}
