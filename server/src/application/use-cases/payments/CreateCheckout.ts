/**
 * CreateCheckout Use Case
 * Handles creating checkout sessions for payment
 */

import type { IPaymentGateway, CreditPackage } from '../../ports/services/IPaymentGateway.js';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';
import type { ITransactionRepository } from '../../ports/repositories/ITransactionRepository.js';

// Input DTO
export interface CreateCheckoutInput {
  userId: string;
  packageId: string;
  provider: 'stripe' | 'stripe_link' | 'paypal';
  frontendUrl: string;
}

// Output DTO
export interface CreateCheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string | null;
  error?: string;
  errorCode?: 'PROVIDER_NOT_CONFIGURED' | 'INVALID_PACKAGE' | 'USER_NOT_FOUND' | 'INTERNAL_ERROR';
}

// Credit packages (shared with routes)
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    credits: 10,
    priceEur: 5.0,
    name: 'Starter',
    nameEn: 'Starter',
    nameFr: 'Démarrage',
    labelEn: 'Try It Out',
    labelFr: 'Essayez',
    discount: 0,
    badge: null,
  },
  {
    id: 'basic',
    credits: 25,
    priceEur: 10.0,
    name: 'Basic',
    nameEn: 'Basic',
    nameFr: 'Basique',
    labelEn: 'Popular',
    labelFr: 'Populaire',
    discount: 20,
    badge: null,
  },
  {
    id: 'popular',
    credits: 60,
    priceEur: 20.0,
    name: 'Popular',
    nameEn: 'Popular',
    nameFr: 'Populaire',
    labelEn: '⭐ MOST POPULAR',
    labelFr: '⭐ LE PLUS POPULAIRE',
    discount: 34,
    badge: 'popular',
  },
  {
    id: 'value',
    credits: 100,
    priceEur: 30.0,
    name: 'Enthusiast',
    nameEn: 'Enthusiast',
    nameFr: 'Passionné',
    labelEn: '✨ ENTHUSIAST',
    labelFr: '✨ PASSIONNÉ',
    discount: 40,
    badge: 'enthusiast',
  },
  {
    id: 'premium',
    credits: 200,
    priceEur: 50.0,
    name: 'Best Value',
    nameEn: 'Best Value',
    nameFr: 'Meilleur Prix',
    labelEn: '💰 BEST VALUE',
    labelFr: '💰 MEILLEUR PRIX',
    discount: 50,
    badge: 'value',
  },
];

// Quick-buy price per credit
const QUICK_BUY_PRICE_PER_CREDIT = 0.5;

// Helper to get package by ID (supports both predefined and quick-buy)
function getPackageForId(packageId: string): CreditPackage | null {
  // Check if it's a quick-buy package
  const quickBuyMatch = packageId.match(/^quick-([1-5])$/);
  if (quickBuyMatch) {
    const credits = parseInt(quickBuyMatch[1], 10);
    return {
      id: packageId,
      credits,
      priceEur: credits * QUICK_BUY_PRICE_PER_CREDIT,
      name: `Quick Buy ${credits}`,
      nameEn: `${credits} Credit${credits > 1 ? 's' : ''}`,
      nameFr: `${credits} Crédit${credits > 1 ? 's' : ''}`,
      labelEn: 'Quick Buy',
      labelFr: 'Achat Rapide',
      discount: 0,
      badge: null,
    };
  }

  // Otherwise look up in predefined packages
  return CREDIT_PACKAGES.find(p => p.id === packageId) || null;
}

export class CreateCheckoutUseCase {
  private gateways: Map<string, IPaymentGateway> = new Map();

  constructor(
    private userRepository: IUserRepository,
    private transactionRepository: ITransactionRepository,
    paymentGateways: IPaymentGateway[]
  ) {
    // Register gateways by provider
    for (const gateway of paymentGateways) {
      this.gateways.set(gateway.provider.toLowerCase(), gateway);
    }
  }

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    try {
      // 1. Get the appropriate gateway
      const gateway = this.gateways.get(input.provider);
      if (!gateway || !gateway.isConfigured()) {
        return {
          success: false,
          error: `${input.provider} payments not configured`,
          errorCode: 'PROVIDER_NOT_CONFIGURED',
        };
      }

      // 2. Find the credit package
      const creditPackage = getPackageForId(input.packageId);
      if (!creditPackage) {
        return {
          success: false,
          error: 'Invalid package',
          errorCode: 'INVALID_PACKAGE',
        };
      }

      // 3. Get the user
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'USER_NOT_FOUND',
        };
      }

      // 4. Create checkout session
      const session = await gateway.createCheckoutSession({
        userId: input.userId,
        userEmail: user.email,
        packageId: input.packageId,
        creditPackage,
        successUrl: `${input.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=${input.provider}`,
        cancelUrl: `${input.frontendUrl}/payment/cancelled`,
      });

      // 5. Create pending transaction
      await this.transactionRepository.create({
        userId: input.userId,
        type: 'PURCHASE',
        amount: creditPackage.credits,
        description: `Purchase: ${creditPackage.name}`,
        paymentProvider: session.provider,
        paymentId: session.sessionId,
        paymentAmount: creditPackage.priceEur,
        currency: 'EUR',
        paymentStatus: 'PENDING',
      });

      return {
        success: true,
        sessionId: session.sessionId,
        url: session.url,
      };
    } catch (error) {
      console.error('[CreateCheckout] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default CreateCheckoutUseCase;
