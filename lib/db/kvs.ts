// ============================================
// Key-Value Store (KVS) Database Operations
// ============================================

import { createClient } from "@/lib/supabase/server"
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
 */
export async function getKVS(key: string): Promise<string | null> {
  console.log(`[KVS] Getting value for key: ${key}`)
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("kvs")
    .select("value")
    .eq("key", key)
    .single()

  if (error) {
    // If the key doesn't exist, return null instead of throwing
    if (error.code === 'PGRST116') {
      console.log(`[KVS] Key not found: ${key}`)
      return null
    }
    console.error(`[KVS] Error getting key ${key}:`, error)
    throw error
  }

  // If value is null or empty, return null
  if (!data?.value) {
    console.log(`[KVS] Value is null/empty for key: ${key}`)
    return null
  }

  try {
    const decrypted = decryptToken(data.value)
    console.log(`[KVS] Successfully decrypted value for key: ${key}`)
    return decrypted
  } catch (error) {
    console.error(`[KVS] Failed to decrypt value for key ${key}:`, error)
    throw new Error(`Failed to decrypt value for key: ${key}`)
  }
}

/**
 * Set a value in the KVS
 * Automatically encrypts the value before storing
 */
export async function setKVS(key: string, value: string | null): Promise<KVSEntry> {
  console.log(`[KVS] Setting value for key: ${key}`)
  
  const supabase = await createClient()
  
  let encryptedValue: string | null = null
  if (value !== null && value !== "") {
    try {
      encryptedValue = encryptToken(value)
      console.log(`[KVS] Successfully encrypted value for key: ${key}`)
    } catch (error) {
      console.error(`[KVS] Failed to encrypt value for key ${key}:`, error)
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
    console.error(`[KVS] Error setting key ${key}:`, error)
    throw error
  }

  console.log(`[KVS] Successfully set value for key: ${key}`)
  return data
}

