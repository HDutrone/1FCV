import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name, label: name.replace('_', ' ') } }),
    ),
  );
  const superAdminRole = roles.find((r) => r.name === RoleName.SUPER_ADMIN)!;

  const company = await prisma.company.create({ data: { name: 'Demo Holding SA', sector: 'Services', country: 'CD' } });

  const branch = await prisma.branch.create({
    data: { name: 'Kinshasa HQ', code: 'HQ-KIN', city: 'Kinshasa', country: 'CD', isHeadquarters: true, companyId: company.id },
  });

  await prisma.user.create({
    data: {
      email: 'admin@1fcv-ops.dev',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      firstName: 'Ada',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      branchId: branch.id,
      companyId: company.id,
      onboardingStep: 2,
    },
  });

  const direction = await prisma.direction.create({ data: { name: 'Direction Générale', branchId: branch.id } });
  const department = await prisma.department.create({ data: { name: 'Ressources Humaines', directionId: direction.id } });
  await prisma.service.create({ data: { name: 'Recrutement', departmentId: department.id } });

  console.log('Seed complete. Login with admin@1fcv-ops.dev / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
