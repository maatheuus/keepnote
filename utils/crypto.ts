import CryptoJS from 'crypto-js';

// Generate a random salt
export const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
};

// Hash password for storage (verification only)
export const hashPassword = (password: string, salt: string): string => {
  return CryptoJS.SHA256(password + salt).toString();
};

// Encrypt data using AES
export const encryptData = (data: any, key: string): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

// Decrypt data using AES
export const decryptData = (ciphertext: string, key: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
