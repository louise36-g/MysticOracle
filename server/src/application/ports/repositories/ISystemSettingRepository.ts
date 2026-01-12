/**
 * ISystemSettingRepository - System Setting data access interface
 * Abstracts database operations for SystemSetting entity
 */

import type { SystemSetting } from '@prisma/client';

/**
 * System Setting Repository Interface
 * Defines all system setting-related database operations
 */
export interface ISystemSettingRepository {
  // Basic operations
  findByKey(key: string): Promise<SystemSetting | null>;
  findAll(): Promise<SystemSetting[]>;
  upsert(key: string, value: string): Promise<SystemSetting>;
  delete(key: string): Promise<void>;

  // Bulk operations
  findByKeys(keys: string[]): Promise<SystemSetting[]>;
  deleteByKey(key: string): Promise<boolean>;
}

export default ISystemSettingRepository;
