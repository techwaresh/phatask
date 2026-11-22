// src/config/jwt.js
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.error('❌ JWT secrets not configured! Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

/**
 * إنشاء Access Token
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

/**
 * إنشاء Refresh Token
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

/**
 * التحقق من Access Token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * التحقق من Refresh Token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
