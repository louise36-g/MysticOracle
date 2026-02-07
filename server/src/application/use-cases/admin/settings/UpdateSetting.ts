/**
 * UpdateSetting Use Case
 * Updates a system setting value
 */

import { SystemSetting } from '@prisma/client';
import type { ISystemSettingRepository } from '../../../ports/repositories/ISystemSettingRepository.js';
import { EDITABLE_SETTINGS } from '../../../../shared/constants/admin.js';

export interface UpdateSettingInput {
  key: string;
  value: string;
}

export interface UpdateSettingResult {
  success: boolean;
  setting?: SystemSetting;
  error?: string;
}

export class UpdateSettingUseCase {
  constructor(private systemSettingRepository: ISystemSettingRepository) {}

  async execute(input: UpdateSettingInput): Promise<UpdateSettingResult> {
    try {
      // Validate the key is editable
      const editableSetting = EDITABLE_SETTINGS.find(s => s.key === input.key);
      if (!editableSetting) {
        return {
          success: false,
          error: `Setting '${input.key}' is not editable`,
        };
      }

      // Validate value
      if (!input.value || input.value.trim().length === 0) {
        return {
          success: false,
          error: 'Value cannot be empty',
        };
      }

      // Upsert the setting
      const setting = await this.systemSettingRepository.upsert(input.key, input.value.trim());

      return {
        success: true,
        setting,
      };
    } catch (error) {
      console.error('[UpdateSetting] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update setting',
      };
    }
  }
}

export default UpdateSettingUseCase;
