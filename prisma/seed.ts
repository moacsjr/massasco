import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed started...');

  const types = [
    {
      name: 'Service',
      schema: { type: 'object', properties: { version: { type: 'string' } } },
    },
    { name: 'Domain', schema: { type: 'object', properties: {} } },
    { name: 'Feature', schema: { type: 'object', properties: {} } },
  ];

  for (const type of types) {
    await prisma.entityType.upsert({
      where: { name: type.name },
      update: { schema: type.schema },
      create: { name: type.name, schema: type.schema },
    });
    console.log(`Registered EntityType: ${type.name}`);
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
