import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, name: true },
        },
        _count: {
          select: { directReports: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      managerId: u.managerId,
      managerName: u.manager?.name || null,
      directReports: u._count.directReports,
    }));
  }

  async findOrgTree() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
      },
      orderBy: { name: 'asc' },
    });

    // Build tree: find roots (no manager) and nest children
    const map = new Map<string, any>();
    for (const u of users) {
      map.set(u.id, { ...u, children: [] });
    }

    const roots: any[] = [];
    for (const u of users) {
      const node = map.get(u.id)!;
      if (u.managerId && map.has(u.managerId)) {
        map.get(u.managerId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async create(data: { email: string; name: string; password: string; role: Role; managerId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        managerId: data.managerId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        managerId: true,
      },
    });
  }

  async updateRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async updateManager(userId: string, managerId: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (managerId) {
      const manager = await this.prisma.user.findUnique({ where: { id: managerId } });
      if (!manager) throw new NotFoundException('Manager not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { managerId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        managerId: true,
      },
    });
  }

  async getManagers() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.MANAGER, Role.ADMIN] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }
}
