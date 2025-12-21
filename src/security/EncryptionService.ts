import * as SecureStore from "expo-secure-store";
import Crypto from "react-native-quick-crypto";
import { Buffer } from "buffer";

const PUBLIC_KEY_ALIAS = "billbell_rsa_public";
const PRIVATE_KEY_ALIAS = "billbell_rsa_private";

// Versioned family key storage
export const FAMILY_KEY_PREFIX = "billbell_family_key_cache_v";
export const FAMILY_KEY_VERSION_ALIAS = "billbell_family_key_version";

// --- RSA Key Management ---

export async function ensureKeyPair() {
  const pub = await SecureStore.getItemAsync(PUBLIC_KEY_ALIAS);
  const priv = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS);

  // FIX: Validate keys actually exist and look like PEM keys
  const isValid = pub && priv && 
                  pub.includes("BEGIN PUBLIC KEY") && 
                  priv.includes("BEGIN PRIVATE KEY");

  if (!isValid) {
    console.log("Generating new RSA Keypair...");
    const { privateKey, publicKey } = Crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    await SecureStore.setItemAsync(PUBLIC_KEY_ALIAS, publicKey as string);
    await SecureStore.setItemAsync(PRIVATE_KEY_ALIAS, privateKey as string);

    return { publicKey, privateKey };
  }

  return {
    publicKey: pub,
    privateKey: priv,
  };
}

// --- Family Key Management ---

export function generateNewFamilyKey(): string {
  return Crypto.randomBytes(32).toString("hex");
}

export function wrapKeyForUser(familyKeyHex: string, recipientPublicKeyPem: string): string {
  const bufferToEncrypt = Buffer.from(familyKeyHex, "utf8");
  const encrypted = Crypto.publicEncrypt(
    { key: recipientPublicKeyPem, padding: Crypto.constants.RSA_PKCS1_OAEP_PADDING },
    bufferToEncrypt
  );
  return encrypted.toString("base64");
}

export async function unwrapMyKey(wrappedKeyBase64: string): Promise<string> {
  const privateKeyPem = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS);
  if (!privateKeyPem) throw new Error("No private key found");

  const bufferToDecrypt = Buffer.from(wrappedKeyBase64, "base64");
  
  try {
    const decrypted = Crypto.privateDecrypt(
      { key: privateKeyPem, padding: Crypto.constants.RSA_PKCS1_OAEP_PADDING },
      bufferToDecrypt
    );
    return decrypted.toString("utf8");
  } catch (e: any) {
    const errMsg = String(e.message);
    if (errMsg.includes("oaep decoding error") || errMsg.includes("privateDecrypt failed")) {
      throw new Error("KEY_DECRYPTION_FAILED: The family key on the server cannot be decrypted by this device's private key. Your Public Key on the server is stale.");
    }
    throw e;
  }
}

function familyKeyAliasForVersion(version: number) {
  return `${FAMILY_KEY_PREFIX}${version}`;
}

export async function cacheFamilyKey(keyHex: string, keyVersion: number) {
  if (!keyHex) throw new Error("Missing family key hex");
  if (!Number.isFinite(keyVersion) || keyVersion <= 0) throw new Error("Invalid key version");

  await SecureStore.setItemAsync(familyKeyAliasForVersion(keyVersion), keyHex);
  await SecureStore.setItemAsync(FAMILY_KEY_VERSION_ALIAS, String(keyVersion));
}

export async function getCachedFamilyKeyVersion(): Promise<number | null> {
  const v = await SecureStore.getItemAsync(FAMILY_KEY_VERSION_ALIAS);
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getLatestCachedRawFamilyKeyHex(): Promise<{ hex: string; version: number } | null> {
  const v = await getCachedFamilyKeyVersion();
  if (!v) return null;

  const hex = await SecureStore.getItemAsync(familyKeyAliasForVersion(v));
  if (!hex) return null;
  
  return { hex, version: v };
}

async function getActiveFamilyKeyBuffer(): Promise<Buffer> {
  const v = await getCachedFamilyKeyVersion();
  if (!v) throw new Error("Family key not loaded. Please fetch from server.");

  const hex = await SecureStore.getItemAsync(familyKeyAliasForVersion(v));
  if (!hex) throw new Error("Family key not loaded. Please fetch from server.");
  return Buffer.from(hex, "hex");
}

async function getFallbackKeyHexesWithVersions(maxVersionsToTry: number = 5): Promise<Array<{ v: number; hex: string }>> {
  const current = await getCachedFamilyKeyVersion();
  if (!current) return [];

  const out: Array<{ v: number; hex: string }> = [];
  for (let v = current; v >= 1 && out.length < maxVersionsToTry; v--) {
    const hex = await SecureStore.getItemAsync(familyKeyAliasForVersion(v));
    if (hex) out.push({ v, hex });
  }
  return out;
}

export async function pruneFamilyKeys(keepLast: number = 5) {
  const current = await getCachedFamilyKeyVersion();
  if (!current) return;

  const minKeep = Math.max(1, current - keepLast + 1);
  for (let v = 1; v < minKeep; v++) {
    await SecureStore.deleteItemAsync(familyKeyAliasForVersion(v));
  }
}

// --- Data Encryption (AES-GCM) ---

export async function encryptData(text: string, specificKeyHex?: string): Promise<string> {
  if (!text) return "";

  try {
    const key = specificKeyHex ? Buffer.from(specificKeyHex, "hex") : await getActiveFamilyKeyBuffer();
    const iv = Crypto.randomBytes(12);
    const cipher = Crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error("Encryption failed", e);
    throw new Error("Encryption failed");
  }
}

function tryDecryptWithKey(encryptedString: string, keyHex: string): string {
  const parts = encryptedString.split(":");
  if (parts.length !== 3) return encryptedString;

  const [ivHex, authTagHex, encryptedHex] = parts;

  const key = Buffer.from(keyHex, "hex");
  const decipher = Crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex") as any);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function decryptData(encryptedString: string, specificKeyHex?: string): Promise<string> {
  const r = await decryptDataWithVersion(encryptedString, specificKeyHex);
  return r.text;
}

export async function decryptDataWithVersion(
  encryptedString: string,
  specificKeyHex?: string
): Promise<{ text: string; usedVersion: number | null }> {
  if (!encryptedString || !encryptedString.includes(":")) return { text: encryptedString || "", usedVersion: null };

  if (specificKeyHex) {
    try {
      return { text: tryDecryptWithKey(encryptedString, specificKeyHex), usedVersion: null };
    } catch (e) {
      console.warn("Decryption failed with provided key:", e);
      throw new Error("DECRYPT_FAILED_SPECIFIC_KEY");
    }
  }

  try {
    // Try current + recent previous keys (handling rotation)
    const candidates = await getFallbackKeyHexesWithVersions(50);
    let lastError: any = null; 

    for (const c of candidates) {
      try {
        return { text: tryDecryptWithKey(encryptedString, c.hex), usedVersion: c.v };
      } catch (e) {
        lastError = e;
      }
    }
    
    if (lastError) {
        throw new Error(`DECRYPT_FAILED_ALL_KEYS: ${lastError.message}`);
    }

    return { text: encryptedString, usedVersion: null };
  } catch (e) {
    throw e;
  }
}