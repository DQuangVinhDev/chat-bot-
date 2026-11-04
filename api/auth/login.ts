import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_USERNAME = process.env.APP_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.APP_ADMIN_PASSWORD || 'vilao@2026';
const AUTH_SECRET_TOKEN = process.env.AUTH_SECRET_TOKEN || 'vilao_auth_secret_token_123';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.status(200).json({
      success: true,
      token: AUTH_SECRET_TOKEN,
      user: {
        username: ADMIN_USERNAME,
        name: 'Quản trị viên ViLao'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Tài khoản hoặc mật khẩu không chính xác.'
  });
}
