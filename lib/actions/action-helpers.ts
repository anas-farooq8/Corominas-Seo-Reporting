/**
 * Generic Action Helpers
 * Reduces duplication in CRUD actions across entities
 */

import { revalidatePath } from "next/cache"

/**
 * Generic wrapper for action functions that handles:
 * - Error handling with consistent messaging
 * - Path revalidation after mutations
 * - Try-catch blocks
 * 
 * @param fn - The database function to execute
 * @param options - Configuration for error handling and revalidation
 */
export async function withActionHandler<T>(
  fn: () => Promise<T>,
  options: {
    errorMessage: string
    revalidatePaths?: string[]
  }
): Promise<T> {
  try {
    const result = await fn()
    
    // Revalidate paths after successful operation
    if (options.revalidatePaths) {
      for (const path of options.revalidatePaths) {
        revalidatePath(path)
      }
    }
    
    return result
  } catch (error) {
    console.error(options.errorMessage, error)
    throw new Error(options.errorMessage)
  }
}

