import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get AI settings the same way the backend does
  const dbSettings = await prisma.systemSetting.findMany({
    where: { key: { in: ['OPENROUTER_API_KEY', 'AI_MODEL'] } },
  });
  const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

  const rawApiKey = settingsMap.get('OPENROUTER_API_KEY') || process.env.OPENROUTER_API_KEY || null;
  const apiKey = rawApiKey?.trim() || null;
  const model = settingsMap.get('AI_MODEL') || process.env.AI_MODEL || 'openai/gpt-oss-120b:free';

  console.log('AI Settings:');
  console.log('- API Key (first 20 chars):', apiKey?.substring(0, 20) + '...');
  console.log('- API Key length:', apiKey?.length);
  console.log('- Model:', model);
  console.log('');

  if (!apiKey) {
    console.log('❌ No API key found!');
    await prisma.$disconnect();
    return;
  }

  // Make the same request the horoscope endpoint makes
  const prompt = `Generate a daily horoscope for Aries in English.`;

  console.log('Making request to OpenRouter...');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://celestiarcana.com',
      'X-Title': 'CelestiArcana',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log('\n❌ Error response:');
    console.log(errorText);
  } else {
    const data = await response.json();
    console.log('\n✅ Success!');
    console.log('Generated content length:', data.choices?.[0]?.message?.content?.length || 0);
    console.log('First 100 chars:', data.choices?.[0]?.message?.content?.substring(0, 100));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
