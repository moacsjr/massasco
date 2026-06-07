import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed started...');

  // Create default system settings
  const settings = [
    {
      key: 'app_name',
      value: 'Massas.CO',
      description: 'Application name',
    },
    {
      key: 'app_version',
      value: '1.0.0',
      description: 'Application version',
    },
    {
      key: 'stripe_public_key',
      value: '',
      description: 'Stripe public key',
    },
    {
      key: 'stripe_secret_key',
      value: '',
      description: 'Stripe secret key',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description },
    });
    console.log(`Created/Updated SystemSetting: ${setting.key}`);
  }

  // Create default tables if they don't exist
  const tableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (const num of tableNumbers) {
    await prisma.table.upsert({
      where: { number: num },
      update: { isActive: true },
      create: {
        number: num,
        name: `Mesa ${num}`,
        isActive: true,
      },
    });
    console.log(`Created/Updated Table: ${num}`);
  }

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });