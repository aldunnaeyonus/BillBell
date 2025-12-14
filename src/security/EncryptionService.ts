import * as SecureStore from "expo-secure-store";
import Crypto from "react-native-quick-crypto";
import { Buffer } from "buffer";

const PUBLIC_KEY_ALIAS = "billbell_rsa_public";
const PRIVATE_KEY_ALIAS = "billbell_rsa_private";
const FAMILY_KEY_ALIAS = "billbell_family_key_cache";

// --- RSA Key Management ---

export async function ensureKeyPair() {
  const pub = await SecureStore.getItemAsync(PUBLIC_KEY_ALIAS);

  if (!pub) {
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
    privateKey: await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS),
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
  const decrypted = Crypto.privateDecrypt(
    { key: privateKeyPem, padding: Crypto.constants.RSA_PKCS1_OAEP_PADDING },
    bufferToDecrypt
  );
  return decrypted.toString("utf8");
}

export async function cacheFamilyKey(keyHex: string) {
  await SecureStore.setItemAsync(FAMILY_KEY_ALIAS, keyHex);
}

async function getActiveFamilyKey(): Promise<Buffer> {
  const hex = await SecureStore.getItemAsync(FAMILY_KEY_ALIAS);
  if (!hex) throw new Error("Family key not loaded. Please fetch from server.");
  return Buffer.from(hex, "hex");
}

// --- Data Encryption (AES-GCM) ---

export async function encryptData(text: string, specificKeyHex?: string): Promise<string> {
  if (!text) return "";

  try {
    const key = specificKeyHex ? Buffer.from(specificKeyHex, "hex") : await getActiveFamilyKey();
    const iv = Crypto.randomBytes(12);
    const cipher = Crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (e) {
    // FAIL CLOSED: never return plaintext
    console.error("Encryption failed", e);
    throw new Error("Encryption failed");
  }
}

export async function decryptData(encryptedString: string, specificKeyHex?: string): Promise<string> {
  if (!encryptedString || !encryptedString.includes(":")) return encryptedString || "";

  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) return encryptedString;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = specificKeyHex ? Buffer.from(specificKeyHex, "hex") : await getActiveFamilyKey();

    const decipher = Crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex") as any);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (e) {
    console.warn("Decryption failed:", e);
    return encryptedString;
  }
}