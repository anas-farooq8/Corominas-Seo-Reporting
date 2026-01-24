// ============================================
// Key-Value Store (KVS) Database Operations
// ============================================
// KVS stores sensitive data (API keys, tokens) and requires service role access

import { createServiceClient } from "@/lib/supabase/service"
import { encryptToken, decryptToken } from "@/lib/utils/encryption"

export interface KVSEntry {
  id: string
  key: string
  value: string | null
  created_at: string
  updated_at: string
}

/**
 * Get a value from the KVS
 * Automatically decrypts the value if it exists
 * Uses service role to bypass RLS (KVS contains sensitive API keys)
 */
export async function getKVS(key: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("kvs")
    .select("value")
    .eq("key", key)
    .single()

  if (error) {
    // If the key doesn't exist, return null instead of throwing
    if (error.code === 'PGRST116') {
      return null
    }
    console.error(`[KVS] Error getting key ${key}:`, error)
    throw error
  }

  // If value is null or empty, return null
  if (!data?.value) {
    return null
  }

  try {
    const decrypted = decryptToken(data.value)
    return decrypted
  } catch (error) {
    console.error(`[KVS] Decrypt failed for ${key}:`, error)
    throw new Error(`Failed to decrypt value for key: ${key}`)
  }
}

/**
 * Set a value in the KVS
 * Automatically encrypts the value before storing
 * Uses service role to bypass RLS (KVS contains sensitive API keys)
 */
export async function setKVS(key: string, value: string | null): Promise<KVSEntry> {
  const supabase = createServiceClient()
  
  let encryptedValue: string | null = null
  if (value !== null && value !== "") {
    try {
      encryptedValue = encryptToken(value)
    } catch (error) {
      console.error(`[KVS] Encrypt failed for ${key}:`, error)
      throw new Error(`Failed to encrypt value for key: ${key}`)
    }
  }

  const { data, error } = await supabase
    .from("kvs")
    .upsert({
      key,
      value: encryptedValue
    }, {
      onConflict: "key"
    })
    .select()
    .single()

  if (error) {
    console.error(`[KVS] Error setting ${key}:`, error)
    throw error
  }

  return data
}

/**
 * Delete a value from the KVS
 * Uses service role to bypass RLS (KVS contains sensitive API keys)
 */
export async function deleteKVS(key: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("kvs")
    .delete()
    .eq("key", key)

  if (error) {
    console.error(`[KVS] Error deleting ${key}:`, error)
    throw error
  }
}

