const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCredits() {
  const user = await prisma.user.findFirst({
    where: { username: 'Mooks' }
  });
  
  if (!user) {
    console.log('User Mooks not found, listing all users...');
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, credits: true } });
    console.log(users);
    await prisma.$disconnect();
    return;
  }
  
  console.log('Found user:', user.username, 'Current credits:', user.credits);
  
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: user.credits + 100 }
  });
  
  console.log('Added 100 credits! New balance:', updated.credits);
  await prisma.$disconnect();
}

addCredits().catch(console.error);
