import type { CampaignExport } from './campaignExport'

/**
 * WHY: Version migrations for backward compatibility (Issue #23 - Phase 2)
 * Allows loading older campaign saves by migrating them to current format
 */

// WHY: Current version of the export format
export const CURRENT_VERSION = '1.0.0'

/**
 * WHY: Migration functions to transform old versions to current format
 * Each key is the source version, function transforms to next version
 */
export const MIGRATIONS: Record<string, (data: any) => CampaignExport> = {
  // WHY: Example migration from 0.9.0 to 1.0.0
  '0.9.0': (data: any): CampaignExport => {
    return {
      ...data,
      version: '1.0.0',
      // WHY: Add any new fields with defaults for 1.0.0
      // Example: auditLog: data.auditLog || { entries: [], version: '1.0.0' }
    }
  }
}

/**
 * WHY: Check if version needs migration
 */
export function needsMigration(version: string): boolean {
  return version !== CURRENT_VERSION && version in MIGRATIONS
}

/**
 * WHY: Get migration path from source version to current
 * Returns array of version steps to migrate through
 */
export function getMigrationPath(fromVersion: string): string[] {
  const path: string[] = []
  let currentVer = fromVersion

  // WHY: Build chain of migrations needed
  while (currentVer !== CURRENT_VERSION && currentVer in MIGRATIONS) {
    path.push(currentVer)
    // WHY: For now, all migrations go to CURRENT_VERSION
    // In future, could chain: 0.9.0 → 1.0.0 → 1.1.0 → current
    currentVer = CURRENT_VERSION
  }

  return path
}
