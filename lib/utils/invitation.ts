import { randomBytes } from 'crypto'

/**
 * Generate cryptographically secure invitation token
 * WHY: Tokens must be unpredictable for security
 *
 * @returns 32-byte hex token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Check if invitation has expired
 * WHY: Invitations should have limited validity (7 days)
 *
 * @param expiresAt - Expiration timestamp
 * @returns true if expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Create invitation link
 * WHY: Generates full URL for email/sharing
 *
 * @param token - Invitation token
 * @returns Full invitation URL
 */
export function createInvitationLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/join/${token}`
}

/**
 * Calculate expiration date (7 days from now)
 * WHY: Standard invitation validity period
 *
 * @returns Expiration date
 */
export function getExpirationDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date
}
