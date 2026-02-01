/**
 * Secure storage for sensitive data (tokens, credentials)
 * 
 * Priority:
 * 1. Electron safeStorage (encrypted with OS keychain)
 * 2. Environment variable
 * 3. Plaintext (with warning)
 */

export type StorageMethod = "safeStorage" | "envVar" | "plaintext";

interface SafeStorage {
  isEncryptionAvailable(): boolean;
  encryptString(plainText: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

let safeStorage: SafeStorage | null = null;
let safeStorageAvailable: boolean | null = null;

// Try to load Electron's safeStorage
function getSafeStorage(): SafeStorage | null {
  if (safeStorageAvailable === false) return null;
  if (safeStorage) return safeStorage;

  try {
    // Attempt to require electron - this works in Obsidian desktop
    const electron = require("electron");
    if (electron?.remote?.safeStorage) {
      safeStorage = electron.remote.safeStorage;
    } else if (electron?.safeStorage) {
      safeStorage = electron.safeStorage;
    }
    
    // Verify it actually works
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      safeStorageAvailable = true;
      console.log("OpenClaw: safeStorage available");
      return safeStorage;
    }
  } catch (e) {
    console.log("OpenClaw: safeStorage not available", e);
  }

  safeStorageAvailable = false;
  return null;
}

// Check for environment variable
function getEnvToken(): string | null {
  try {
    const token = process.env.OPENCLAW_TOKEN;
    return token || null;
  } catch {
    return null;
  }
}

export class SecureTokenStorage {
  private encryptedToken: string | null = null;
  private plaintextToken: string = "";
  
  /**
   * Get the current storage method being used
   */
  getActiveMethod(): StorageMethod {
    if (getEnvToken()) return "envVar";
    if (getSafeStorage()) return "safeStorage";
    return "plaintext";
  }

  /**
   * Get human-readable status for display in settings
   */
  getStatusInfo(): { method: StorageMethod; description: string; secure: boolean } {
    const envToken = getEnvToken();
    if (envToken) {
      return {
        method: "envVar",
        description: "Using OPENCLAW_TOKEN environment variable",
        secure: true,
      };
    }

    const storage = getSafeStorage();
    if (storage) {
      return {
        method: "safeStorage",
        description: "Encrypted with OS keychain (Keychain/DPAPI/libsecret)",
        secure: true,
      };
    }

    return {
      method: "plaintext",
      description: "⚠️ Stored in plaintext - avoid syncing plugin folder",
      secure: false,
    };
  }

  /**
   * Store a token securely
   */
  setToken(token: string): { encrypted: string | null; plaintext: string } {
    // If using env var, don't store anything
    if (getEnvToken()) {
      return { encrypted: null, plaintext: "" };
    }

    const storage = getSafeStorage();
    if (storage && token) {
      try {
        const encrypted = storage.encryptString(token);
        this.encryptedToken = encrypted.toString("base64");
        this.plaintextToken = "";
        return { encrypted: this.encryptedToken, plaintext: "" };
      } catch (e) {
        console.error("OpenClaw: Failed to encrypt token", e);
      }
    }

    // Fall back to plaintext
    this.encryptedToken = null;
    this.plaintextToken = token;
    return { encrypted: null, plaintext: token };
  }

  /**
   * Retrieve a token
   */
  getToken(encrypted: string | null, plaintext: string): string {
    // Priority 1: Environment variable
    const envToken = getEnvToken();
    if (envToken) {
      return envToken;
    }

    // Priority 2: Encrypted storage
    if (encrypted) {
      const storage = getSafeStorage();
      if (storage) {
        try {
          const buffer = Buffer.from(encrypted, "base64");
          return storage.decryptString(buffer);
        } catch (e) {
          console.error("OpenClaw: Failed to decrypt token", e);
        }
      }
    }

    // Priority 3: Plaintext
    return plaintext || "";
  }

  /**
   * Check if safeStorage is available (for UI display)
   */
  isSafeStorageAvailable(): boolean {
    return getSafeStorage() !== null;
  }

  /**
   * Check if env var is set (for UI display)
   */
  isEnvVarSet(): boolean {
    return getEnvToken() !== null;
  }
}

// Singleton instance
export const secureTokenStorage = new SecureTokenStorage();
