/**
 * Admin Use Cases Index
 * Export all admin use cases
 */

// User Use Cases
export {
  ListUsersUseCase,
  GetUserUseCase,
  UpdateUserStatusUseCase,
  AdjustUserCreditsUseCase,
  ToggleUserAdminUseCase,
  type ListUsersInput,
  type ListUsersResult,
  type UserListItem,
  type GetUserInput,
  type GetUserResult,
  type UserDetail,
  type UpdateUserStatusInput,
  type UpdateUserStatusResult,
  type AdjustUserCreditsInput,
  type AdjustUserCreditsResult,
  type ToggleUserAdminInput,
  type ToggleUserAdminResult,
} from './users/index.js';

// Package Use Cases
export {
  ListPackagesUseCase,
  CreatePackageUseCase,
  UpdatePackageUseCase,
  DeletePackageUseCase,
  SeedPackagesUseCase,
  type ListPackagesResult,
  type CreatePackageInput,
  type CreatePackageResult,
  type UpdatePackageInput,
  type UpdatePackageResult,
  type DeletePackageInput,
  type DeletePackageResult,
  type SeedPackagesResult,
} from './packages/index.js';

// Template Use Cases
export {
  ListTemplatesUseCase,
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  DeleteTemplateUseCase,
  SeedTemplatesUseCase,
  type ListTemplatesResult,
  type CreateTemplateInput,
  type CreateTemplateResult,
  type UpdateTemplateInput,
  type UpdateTemplateResult,
  type DeleteTemplateInput,
  type DeleteTemplateResult,
  type SeedTemplatesResult,
} from './templates/index.js';

// Settings Use Cases
export {
  GetSettingsUseCase,
  UpdateSettingUseCase,
  type GetSettingsResult,
  type SettingInfo,
  type UpdateSettingInput,
  type UpdateSettingResult,
} from './settings/index.js';
