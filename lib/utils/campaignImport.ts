import type { CampaignExport, ImportValidationResult, MigrationResult } from './campaignExport'
import { CURRENT_VERSION, MIGRATIONS, needsMigration, getMigrationPath } from './campaignMigrations'

/**
 * WHY: Campaign import and validation utilities (Issue #23 - Phase 2)
 * Handles loading saved campaigns with validation and version migration
 */

/**
 * WHY: Validate imported campaign data structure
 * Ensures imported JSON matches expected schema before applying
 */
export function validateImportData(data: unknown): ImportValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // WHY: Check if data is an object
  if (!isObject(data)) {
    return createErrorResult(['Import data must be an object, not ' + typeof data])
  }

  const importVersion = (data as any).version || 'unknown'
  const versionMismatch = importVersion !== CURRENT_VERSION

  // WHY: Validate required top-level fields
  validateRequiredField(data, 'version', 'string', errors)
  validateRequiredField(data, 'exportedAt', 'string', errors)
  validateRequiredField(data, 'campaign', 'object', errors)
  validateRequiredField(data, 'players', 'array', errors)
  validateRequiredField(data, 'events', 'array', errors)
  validateRequiredField(data, 'victoryData', 'object', errors)

  // WHY: Validate campaign sub-object if present
  if (isObject((data as any).campaign)) {
    const campaign = (data as any).campaign
    validateRequiredField(campaign, 'threatLevel', 'number', errors)
    validateRequiredField(campaign, 'targetThreatLevel', 'number', errors)
    validateRequiredField(campaign, 'currentRound', 'number', errors)
    validateRequiredField(campaign, 'currentPhase', 'string', errors)
    validateRequiredField(campaign, 'hexMap', 'object', errors)
  }

  // WHY: Warn on version mismatch
  if (versionMismatch) {
    warnings.push(
      `Version mismatch: importing ${importVersion}, current version is ${CURRENT_VERSION}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    versionMismatch,
    currentVersion: CURRENT_VERSION,
    importVersion
  }
}

/**
 * WHY: Migrate campaign data to current version
 */
export function migrateCampaignData(
  data: CampaignExport
): { data: CampaignExport; migration: MigrationResult } {
  const fromVersion = data.version
  const changes: string[] = []

  // WHY: No migration needed if already current version
  if (!needsMigration(fromVersion)) {
    return {
      data,
      migration: {
        migrated: false,
        fromVersion,
        toVersion: CURRENT_VERSION,
        changes: []
      }
    }
  }

  // WHY: Apply migration path
  const migrationPath = getMigrationPath(fromVersion)
  let migratedData = { ...data }

  migrationPath.forEach(version => {
    const migrateFn = MIGRATIONS[version]
    if (migrateFn) {
      migratedData = migrateFn(migratedData)
      changes.push(`Migrated from ${version} to ${migratedData.version}`)
    }
  })

  return {
    data: migratedData,
    migration: {
      migrated: true,
      fromVersion,
      toVersion: migratedData.version,
      changes
    }
  }
}

/**
 * WHY: Import campaign data from JSON file
 */
export async function importCampaignData(file: File): Promise<CampaignExport> {
  try {
    const jsonData = await parseCampaignFile(file)
    const validation = validateImportData(jsonData)

    if (!validation.valid) {
      throw new Error(`Invalid campaign data: ${validation.errors.join(', ')}`)
    }

    // WHY: Migrate if needed
    const { data } = migrateCampaignData(jsonData as CampaignExport)
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to import campaign: ${error.message}`)
    }
    throw new Error('Failed to import campaign: Unknown error')
  }
}

/**
 * WHY: Parse JSON file to unknown for validation
 */
async function parseCampaignFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * WHY: Check if value is a plain object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * WHY: Validate required field exists and has correct type
 */
function validateRequiredField(
  obj: any,
  field: string,
  expectedType: 'string' | 'number' | 'object' | 'array',
  errors: string[]
): void {
  if (!(field in obj)) {
    errors.push(`Missing required field: ${field}`)
    return
  }

  const value = obj[field]
  const actualType = Array.isArray(value) ? 'array' : typeof value

  if (actualType !== expectedType) {
    errors.push(`Field "${field}" must be ${expectedType}, got ${actualType}`)
  }
}

/**
 * WHY: Create error result for invalid data
 */
function createErrorResult(errors: string[]): ImportValidationResult {
  return {
    valid: false,
    errors,
    warnings: [],
    versionMismatch: false,
    currentVersion: CURRENT_VERSION,
    importVersion: 'unknown'
  }
}
