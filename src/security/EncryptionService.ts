import * as SecureStore from 'expo-secure-store';
import Crypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

const KEY_ALIAS = 'billbell_master_key_v1';

// 1. Get or Generate the Master Key
async function getMasterKey(): Promise<Buffer> {
  let hexKey = await SecureStore.getItemAsync(KEY_ALIAS);
  
  if (!hexKey) {
    console.log("Creating new encryption key...");
    // Generate a random 256-bit key
    const key = Crypto.randomBytes(32); 
    hexKey = key.toString('hex');
    await SecureStore.setItemAsync(KEY_ALIAS, hexKey);
  }
  
  return Buffer.from(hexKey, 'hex');
}

// 2. Encrypt (AES-256-GCM)
// RENAMED from encryptText -> encryptData
export async function encryptData(text: string): Promise<string> {
  if (!text) return "";
  try {
    const key = await getMasterKey();
    const iv = Crypto.randomBytes(12); 
    const cipher = Crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error("Encryption failed", e);
    return text; 
  }
}

// 3. Decrypt
// RENAMED from decryptText -> decryptData
export async function decryptData(encryptedString: string): Promise<string> {
  // 1. Fast check: If it doesn't look like our format "iv:tag:cipher", it's definitely plain text.
  if (!encryptedString || typeof encryptedString !== 'string' || !encryptedString.includes(':')) {
    return encryptedString || "";
  }
  
  try {
    const parts = encryptedString.split(':');
    
    // 2. Formatting Check: Must have exactly 3 parts for our AES-GCM format
    if (parts.length !== 3) {
        return encryptedString; // Return original if it's just a note like "Re: Subject"
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = await getMasterKey();
    
    const decipher = Crypto.createDecipheriv(
      'aes-256-gcm', 
      key, 
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex') as any);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;

  } catch (e) {
    // 3. FALLBACK: If decryption crashes (e.g., wrong key, or it was actually plain text),
    // strictly return the original string so the user can see their data.
    console.warn("Decryption failed, displaying raw text:", encryptedString.substring(0, 10) + "..."); 
    return encryptedString; 
  }
}

// 4. Key Export
export async function exportKeyForBackup(): Promise<string> {
    const key = await SecureStore.getItemAsync(KEY_ALIAS);
    return key || "";
}