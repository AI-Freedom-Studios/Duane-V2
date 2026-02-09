import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, 32);
}

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('ENCRYPTION_KEY must be set and at least 16 characters');
  }
  return secret;
}

export function encrypt(plaintext: string): string {
  const secret = getEncryptionSecret();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted,
  ].join(':');
}

export function decrypt(ciphertext: string): string {
  const secret = getEncryptionSecret();
  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];

  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
