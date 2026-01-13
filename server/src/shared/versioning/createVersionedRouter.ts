import { Router } from 'express';

export interface VersionConfig {
  version: string;
  deprecationDate?: string; // ISO 8601
  sunsetDate?: string; // ISO 8601
}

/**
 * Wraps a router with version headers
 */
export function createVersionedRouter(router: Router, config: VersionConfig): Router {
  const versionedRouter = Router();

  // Add version info to all responses
  versionedRouter.use((req, res, next) => {
    res.setHeader('API-Version', config.version);

    // Add deprecation headers if configured
    if (config.deprecationDate) {
      res.setHeader('Deprecation', `date="${config.deprecationDate}"`);
    }
    if (config.sunsetDate) {
      res.setHeader('Sunset', config.sunsetDate);
    }

    next();
  });

  versionedRouter.use(router);
  return versionedRouter;
}
