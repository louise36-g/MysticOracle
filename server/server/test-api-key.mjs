import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the API key from database
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'OPENROUTER_API_KEY' }
  });

  if (!setting || !setting.value) {
    console.log('❌ No API key found in database');
    await prisma.$disconnect();
    return;
  }

  console.log('Testing API key from database...');
  console.log('Key prefix:', setting.value.substring(0, 15) + '...');
  console.log('Key length:', setting.value.length);

  // Test the API key with OpenRouter
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${setting.value}`,
        'HTTP-Referer': 'https://mysticoracle.com'
      }
    });

    console.log('Response status:', response.status);

    if (response.status === 401) {
      console.log('❌ API key is INVALID (401 Unauthorized)');
      const error = await response.text();
      console.log('Error:', error);
    } else if (response.ok) {
      console.log('✅ API key is VALID');
      const data = await response.json();
      console.log('Available models:', data.data?.length || 0);
    } else {
      console.log('⚠️  Unexpected response:', response.statusText);
    }
  } catch (error) {
    console.log('❌ Error testing API key:', error.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
