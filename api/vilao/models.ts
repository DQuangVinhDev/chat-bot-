import type { VercelRequest, VercelResponse } from '@vercel/node';

const VILAO_API_KEY = process.env.VILAO_API_KEY || '';
const VILAO_BASE_URL = process.env.VILAO_BASE_URL || 'https://api.vilao.ai/v1';
const AUTH_SECRET_TOKEN = process.env.AUTH_SECRET_TOKEN || 'vilao_auth_secret_token_123';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc không có quyền truy cập.' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== AUTH_SECRET_TOKEN) {
    return res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  try {
    const url = `${VILAO_BASE_URL.replace(/\/+$/, '')}/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VILAO_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi gọi ViLao models API' });
  }
}
