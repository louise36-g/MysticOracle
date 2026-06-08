/**
 * Coolify Deploy Service
 *
 * Lets the admin trigger a redeploy of the front-end app directly from
 * the CMS instead of going into the Coolify dashboard. Used after
 * publishing new articles so the pre-rendered HTML (and its self-
 * referencing canonical tags / sitemap entries) goes out immediately
 * rather than waiting for the next scheduled/incidental deploy.
 *
 * Requires env vars:
 *   COOLIFY_DEPLOY_HOST  — base URL of the Coolify instance (e.g. http://46.224.16.4:8000)
 *   COOLIFY_API_TOKEN    — token scoped to "deploy" permission only
 *   COOLIFY_APP_UUID     — UUID of the front-end application resource
 *
 * NOTE: deliberately named COOLIFY_DEPLOY_HOST (not COOLIFY_URL) —
 * Coolify auto-injects its own "magic" variables like COOLIFY_URL and
 * COOLIFY_FQDN into the app environment, and a name collision there
 * broke the deployment.
 *
 * The token is intentionally scoped to "deploy" only (not "read"), so
 * this service only triggers deploys — it can't poll for completion
 * status, which requires the broader "read" permission.
 */

import { logger } from '../lib/logger.js';

const COOLIFY_URL = (process.env.COOLIFY_DEPLOY_HOST || 'http://46.224.16.4:8000').replace(
  /\/$/,
  ''
);
const API_TOKEN = process.env.COOLIFY_API_TOKEN;
const APP_UUID = process.env.COOLIFY_APP_UUID;

export interface DeployResult {
  deploymentUuid: string | null;
  message: string;
}

/**
 * Trigger a redeploy of the front-end app.
 */
export async function triggerDeploy(): Promise<DeployResult> {
  if (!API_TOKEN || !APP_UUID) {
    throw new Error(
      'Coolify is not configured — set COOLIFY_API_TOKEN and COOLIFY_APP_UUID in the environment'
    );
  }

  const res = await fetch(`${COOLIFY_URL}/api/v1/deploy?uuid=${APP_UUID}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    logger.warn(`[Coolify] deploy trigger failed (${res.status}):`, body);
    throw new Error(body?.message || `Coolify returned ${res.status}`);
  }

  const deploymentUuid = body?.deployments?.[0]?.deployment_uuid || body?.deployment_uuid || null;

  logger.info(`[Coolify] deploy triggered: ${deploymentUuid || '(no uuid returned)'}`);

  return {
    deploymentUuid,
    message: body?.message || 'Deployment queued',
  };
}

export function isConfigured(): boolean {
  return Boolean(API_TOKEN && APP_UUID);
}

export default {
  triggerDeploy,
  isConfigured,
};
