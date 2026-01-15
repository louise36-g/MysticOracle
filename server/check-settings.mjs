import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['OPENROUTER_API_KEY', 'AI_MODEL'] } }
  });

  console.log('Found', settings.length, 'settings in database:');
  settings.forEach(s => {
    const displayValue = s.key.includes('KEY') || s.key.includes('SECRET')
      ? (s.value?.substring(0, 10) + '...' + s.value?.substring(s.value.length - 4))
      : s.value;
    console.log(`- ${s.key}: ${displayValue || '(not set)'}`);
  });

  if (settings.length === 0) {
    console.log('\n⚠️  No AI settings found in database!');
    console.log('The system will fall back to environment variables.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
