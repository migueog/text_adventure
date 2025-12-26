import { z } from 'zod'

/**
 * Password strength requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

/**
 * Username requirements:
 * - 3-20 characters
 * - Alphanumeric and underscore only
 * - No spaces
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

/**
 * Check if password meets strength requirements
 */
export function isStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password)
}

/**
 * Signup validation schema
 */
export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(USERNAME_REGEX, 'Username must be alphanumeric'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(isStrongPassword, 'Password must have uppercase, lowercase, number')
})

/**
 * Update profile validation schema
 * All fields optional for partial updates
 */
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(USERNAME_REGEX).optional(),
  email: z.string().email().optional()
})

export type SignupInput = z.infer<typeof signupSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
