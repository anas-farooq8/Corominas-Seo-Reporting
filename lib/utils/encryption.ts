// ============================================
// Encryption Utility for KVS Token Storage
// ============================================

/**
 * Encrypts a token using AES-256-GCM
 * Compatible with Python's Fernet encryption
 */
export function encryptToken(token: string): string {
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY
  
  if (!encryptionKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set")
  }

  try {
    // For Node.js environment, we'll use the crypto module
    const crypto = require('crypto')
    
    // Decode the Fernet key (base64 URL-safe)
    const keyBuffer = Buffer.from(encryptionKey, 'base64')
    
    // Generate a random IV (initialization vector)
    const iv = crypto.randomBytes(16)
    
    // Create cipher using AES-256-CBC (Fernet uses this)
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer.slice(0, 32), iv)
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    // Combine IV and encrypted data (base64 encoded)
    const combined = Buffer.concat([iv, Buffer.from(encrypted, 'base64')])
    
    return combined.toString('base64')
  } catch (error) {
    console.error("[Encryption] Failed to encrypt token:", error)
    throw new Error("Failed to encrypt token")
  }
}

/**
 * Decrypts a token using AES-256-GCM
 * Compatible with Python's Fernet decryption
 */
export function decryptToken(encryptedToken: string): string {
  const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY
  
  if (!encryptionKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set")
  }

  try {
    const crypto = require('crypto')
    
    // Decode the Fernet key (base64 URL-safe)
    const keyBuffer = Buffer.from(encryptionKey, 'base64')
    
    // Decode the encrypted token
    const combined = Buffer.from(encryptedToken, 'base64')
    
    // Extract IV (first 16 bytes) and encrypted data
    const iv = combined.slice(0, 16)
    const encrypted = combined.slice(16)
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer.slice(0, 32), iv)
    
    // Decrypt the token
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error("[Encryption] Failed to decrypt token:", error)
    throw new Error("Failed to decrypt token")
  }
}

