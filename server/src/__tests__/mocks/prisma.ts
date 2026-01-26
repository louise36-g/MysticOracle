/**
 * Prisma Mock
 * Mock implementation of PrismaClient for testing
 *
 * This uses a custom interface instead of MockedObject<PrismaClient>
 * because PrismaClient's complex generic types don't work well with
 * Vitest's mock types. Each method is explicitly typed as Mock to
 * ensure .mockResolvedValue() and other mock methods are available.
 */

import { vi, type Mock } from 'vitest';

// Type alias for mock functions - uses a generic function type for flexibility
// In Vitest 4.x, Mock<T> only takes one type argument (a function type)
type MockFn = Mock<(...args: any[]) => any>;

// Define mock interfaces for each Prisma model delegate
interface MockUserDelegate {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  update: MockFn;
  delete: MockFn;
  count: MockFn;
  upsert: MockFn;
}

interface MockReadingDelegate {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  update: MockFn;
  delete: MockFn;
  count: MockFn;
}

interface MockFollowUpQuestionDelegate {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  update: MockFn;
  delete: MockFn;
}

interface MockTransactionDelegate {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  update: MockFn;
  updateMany: MockFn;
  delete: MockFn;
  count: MockFn;
  aggregate: MockFn;
  groupBy: MockFn;
}

interface MockHoroscopeCacheDelegate {
  findUnique: MockFn;
  findFirst: MockFn;
  create: MockFn;
  update: MockFn;
  upsert: MockFn;
}

/**
 * MockPrismaClient interface
 * Provides a properly typed mock of PrismaClient where all methods
 * are Vitest Mock functions with access to .mockResolvedValue(), etc.
 */
export interface MockPrismaClient {
  user: MockUserDelegate;
  reading: MockReadingDelegate;
  followUpQuestion: MockFollowUpQuestionDelegate;
  transaction: MockTransactionDelegate;
  horoscopeCache: MockHoroscopeCacheDelegate;
  $transaction: MockFn;
  $connect: MockFn;
  $disconnect: MockFn;
}

/**
 * Creates a mock PrismaClient with all methods as Vitest mocks.
 * Use ReturnType<typeof createMockPrismaClient> for type inference in tests.
 *
 * @example
 * ```typescript
 * let mockPrisma: ReturnType<typeof createMockPrismaClient>;
 *
 * beforeEach(() => {
 *   mockPrisma = createMockPrismaClient();
 * });
 *
 * it('should find user', async () => {
 *   mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
 *   // ...
 * });
 * ```
 */
export function createMockPrismaClient(): MockPrismaClient {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    reading: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    followUpQuestion: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    horoscopeCache: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

// Default mock instance for convenience
export const mockPrisma = createMockPrismaClient();
