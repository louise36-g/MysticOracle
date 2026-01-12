/**
 * Test script for Brevo email service
 * Run with: npx tsx src/test-email.ts your@email.com
 */

// Must load env BEFORE any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log(
  'BREVO_API_KEY loaded:',
  process.env.BREVO_API_KEY
    ? 'Yes (starts with ' + process.env.BREVO_API_KEY.slice(0, 10) + '...)'
    : 'No'
);

// Dynamic import after env is loaded
async function main() {
  const TEST_EMAIL = process.argv[2];

  if (!TEST_EMAIL) {
    console.error('Usage: npx tsx src/test-email.ts your@email.com');
    process.exit(1);
  }

  // Import email service after env is loaded
  const { sendWelcomeEmail, sendPurchaseConfirmation } = await import('./services/email.js');

  console.log(`\n🧪 Testing emails to: ${TEST_EMAIL}\n`);

  // Test welcome email
  console.log('1. Sending welcome email...');
  const welcomeResult = await sendWelcomeEmail(TEST_EMAIL, 'TestUser', 'en');
  console.log(welcomeResult ? '   ✅ Welcome email sent!' : '   ❌ Welcome email failed');

  // Test purchase confirmation
  console.log('2. Sending purchase confirmation...');
  const purchaseResult = await sendPurchaseConfirmation(
    TEST_EMAIL,
    'TestUser',
    25, // credits
    10.0, // amount
    35, // new balance
    'en'
  );
  console.log(purchaseResult ? '   ✅ Purchase email sent!' : '   ❌ Purchase email failed');

  console.log('\n✨ Done! Check your inbox.\n');
}

main().catch(console.error);
