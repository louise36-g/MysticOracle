/**
 * Express type extensions for DI container
 */

import type { AwilixContainer } from 'awilix';
import type { ContainerDependencies } from '../shared/di/types.js';

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer<ContainerDependencies>;
    }
  }
}

export {};
