/**
 * GetSettings Use Case
 * Gets all editable system settings with their current values
 */

import type { ISystemSettingRepository } from '../../../ports/repositories/ISystemSettingRepository.js';
import { EDITABLE_SETTINGS } from '../../../../shared/constants/admin.js';

export interface SettingInfo {
  key: string;
  value: string;
  hasValue: boolean;
  isSecret: boolean;
  source: 'database' | 'environment' | 'none';
  descriptionEn: string;
  descriptionFr: string;
}

export interface GetSettingsResult {
  settings: SettingInfo[];
}

export class GetSettingsUseCase {
  constructor(private settingRepository: ISystemSettingRepository) {}

  async execute(): Promise<GetSettingsResult> {
    const dbSettings = await this.settingRepository.findAll();
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s]));

    const settings = EDITABLE_SETTINGS.map((setting) => {
      const dbSetting = settingsMap.get(setting.key);
      const envValue = process.env[setting.key];
      const value = dbSetting?.value || envValue || '';

      return {
        key: setting.key,
        value: setting.isSecret && value ? '••••••••' + value.slice(-4) : value,
        hasValue: !!value,
        isSecret: setting.isSecret,
        source: dbSetting ? 'database' : envValue ? 'environment' : 'none',
        descriptionEn: setting.descriptionEn,
        descriptionFr: setting.descriptionFr,
      } as SettingInfo;
    });

    return { settings };
  }
}

export default GetSettingsUseCase;
