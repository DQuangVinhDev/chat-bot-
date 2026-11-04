import type { VercelRequest, VercelResponse } from '@vercel/node';
import { performSmartSearch } from '../../search';
import { compressTextForTokens } from '../../src/compressor';

const VILAO_API_KEY = process.env.VILAO_API_KEY || '';
const VILAO_BASE_URL = process.env.VILAO_BASE_URL || 'https://api.vilao.ai/v1';
const AUTH_SECRET_TOKEN = process.env.AUTH_SECRET_TOKEN || 'vilao_auth_secret_token_123';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  // Check auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc không có quyền truy cập.' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== AUTH_SECRET_TOKEN) {
    return res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  try {
    const { model, messages, max_tokens, temperature, webSearch, memoryEnabled, compressToken } = req.body || {};
    const url = `${VILAO_BASE_URL.replace(/\/+$/, '')}/chat/completions`;

    let inputMessages = [...(messages || [])];

    // Áp dụng nén token
    if (compressToken) {
      inputMessages = inputMessages.map((m: any) => ({
        role: m.role,
        content: m.role === 'user' ? compressTextForTokens(m.content) : m.content,
      }));
    }

    // Nếu tắt ngữ cảnh: chỉ lấy câu hỏi mới nhất
    let finalMessages: any[] = [];
    if (memoryEnabled === false) {
      const lastUser = [...inputMessages].reverse().find((m: any) => m.role === 'user');
      finalMessages = lastUser ? [lastUser] : inputMessages.slice(-1);
    } else {
      finalMessages = inputMessages;
    }

    let searchContext = '';

    // Nếu bật Web Search
    if (webSearch && finalMessages.length > 0) {
      const lastUserIndex = finalMessages.map((m: any) => m.role).lastIndexOf('user');
      if (lastUserIndex !== -1) {
        const userPrompt = finalMessages[lastUserIndex].content;
        try {
          const results = await performSmartSearch(userPrompt);
          if (results.length > 0) {
            searchContext = results
              .map((r, i) => `• Tin ${i + 1} (${r.title}): ${r.snippet}`)
              .join('\n\n');

            finalMessages[lastUserIndex] = {
              role: 'user',
              content: `Dưới đây là các sự kiện và tin tức nổi bật vừa được ghi nhận:\n\n${searchContext}\n\nHãy tóm tắt các điểm tin quan trọng nhất ở trên thành bản tin tổng hợp ngắn gọn, hấp dẫn cho tôi.`
            };
          }
        } catch (searchErr) {
          console.warn('Web search failed:', searchErr);
        }
      }
    }

    const systemInstruction = 'Bạn là trợ lý AI thông minh, nhiệt tình, trả lời mạch lạc bằng tiếng Việt và hỗ trợ định dạng Markdown đầy đủ.';

    const payloadMessages = [
      { role: 'system', content: systemInstruction },
      ...finalMessages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VILAO_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        model: model,
        messages: payloadMessages,
        max_tokens: max_tokens || 4096,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errJson = await response.json();
        errorDetail = errJson?.error?.message || errJson?.message || JSON.stringify(errJson);
      } catch {
        errorDetail = await response.text();
      }
      return res.status(response.status).json({
        error: errorDetail || `ViLao API returned HTTP ${response.status}`,
        statusCode: response.status,
      });
    }

    const data = await response.json();
    if (searchContext) {
      (data as any).usedWebSearch = true;
    }
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error proxying chat completion on Vercel:', error);
    return res.status(500).json({ error: error.message || 'Lỗi kết nối từ server tới ViLao API' });
  }
}
