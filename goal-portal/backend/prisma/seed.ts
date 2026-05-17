import 'dotenv/config';
import { PrismaClient, Role, UomType, GoalStatus, CyclePhase } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Resetting system data...');
  await prisma.goalUpdate.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.cycle.deleteMany({});
  console.log('Existing goals, updates, and cycles cleared.');

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  // Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password,
      name: 'Manager User',
      role: Role.MANAGER,
    },
  });

  // Create Employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      password,
      name: 'Employee User',
      role: Role.EMPLOYEE,
      managerId: manager.id,
    },
  });

  // Create a default Cycle
  const cycle = await prisma.cycle.upsert({
    where: { id: 'default-cycle-fy2627' },
    update: {},
    create: {
      id: 'default-cycle-fy2627',
      name: 'FY 2026-27',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-04-30'),
      phase: CyclePhase.GOAL_SETTING,
      isActive: true,
    },
  });

  console.log('Seed data created:');
  console.log('Admin: admin@example.com / password123');
  console.log('Manager: manager@example.com / password123');
  console.log('Employee: employee@example.com / password123');
  console.log('Cycle:', cycle.name, '(active)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
