import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const SALT_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 10000

function getKey(salt: Buffer): Buffer {
  // Use env key or default development key (ensure production-ready fallback warning)
  const secret = process.env.ENCRYPTION_KEY || 'default-dev-namma-ai-secret-encryption-key-32chars'
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256')
}

/**
 * Encrypts a plain-text token securely using AES-256-GCM.
 */
export function encrypt(text: string): string {
  if (!text) return ''
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getKey(salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  const parts = encryptedText.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted token format')
  }
  
  const salt = Buffer.from(parts[0], 'hex')
  const iv = Buffer.from(parts[1], 'hex')
  const authTag = Buffer.from(parts[2], 'hex')
  const encrypted = parts[3]
  
  const key = getKey(salt)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
