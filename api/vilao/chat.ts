import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

// --- Token Compressor ---
function compressTextForTokens(text: string): string {
  if (!text || text.trim().length === 0) return text;
  let cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n');
  const fillerPatterns = [
    /\b(xin chào|chào bạn|cho mình hỏi|cho tôi hỏi|làm ơn|bạn có thể|có thể cho mình biết|dạ|vâng|ạ|nhé|nha|với lại|ừm|à|thì là mà)\b/gi,
    /\b(hello|hi there|could you please|please kindly|can you tell me|i would like to know|as you know|by the way)\b/gi,
  ];
  for (const pattern of fillerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : text.trim();
}

// --- Live News RSS / Smart Search ---
async function fetchLiveNews(): Promise<Array<{ title: string; snippet: string }>> {
  return new Promise((resolve) => {
    const req = https.get('https://vnexpress.net/rss/tin-moi-nhat.rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const results: Array<{ title: string; snippet: string }> = [];
          const items = data.split('<item>');
          for (let i = 1; i < Math.min(items.length, 6); i++) {
            const rawTitle = items[i].split('<title>')[1]?.split('</title>')[0] || '';
            const rawDesc = items[i].split('<description>')[1]?.split('</description>')[0] || '';
            const title = rawTitle.replace('<![CDATA[', '').replace(']]>', '').trim();
            const desc = rawDesc.replace(/<[^>]+>/g, '').replace('<![CDATA[', '').replace(']]>', '').trim();
            if (title && desc) {
              results.push({ title, snippet: `${title}: ${desc}` });
            }
          }
          resolve(results);
        } catch {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(2500, () => {
      req.destroy();
      resolve([]);
    });
  });
}

async function searchDuckDuckGo(query: string): Promise<Array<{ title: string; snippet: string }>> {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: 'html.duckduckgo.com',
      path: `/html/?q=${encoded}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'vi,vi-VN,en;q=0.9',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const results: Array<{ title: string; snippet: string }> = [];
          const parts = data.split('result__snippet');
          for (let i = 1; i < parts.length && results.length < 3; i++) {
            const startText = parts[i].indexOf('>');
            const closing = parts[i].indexOf('</a>');
            if (startText !== -1 && closing !== -1) {
              const raw = parts[i].substring(startText + 1, closing);
              const cleanSnippet = raw.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
              if (cleanSnippet.length > 25 && !cleanSnippet.includes('Booking.com') && !cleanSnippet.includes('Klook')) {
                results.push({ title: query, snippet: cleanSnippet });
              }
            }
          }
          resolve(results);
        } catch {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}

async function performSmartSearch(query: string): Promise<Array<{ title: string; snippet: string }>> {
  if (/hôm nay|hot|tin tức|tin mới|có gì mới|sự kiện|thời sự/i.test(query)) {
    const live = await fetchLiveNews();
    if (live.length > 0) return live;
  }
  return await searchDuckDuckGo(query);
}

// --- Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const VILAO_API_KEY = process.env.VILAO_API_KEY || '';
  const VILAO_BASE_URL = process.env.VILAO_BASE_URL || 'https://api.vilao.ai/v1';
  const AUTH_SECRET_TOKEN = process.env.AUTH_SECRET_TOKEN || 'vilao_auth_secret_token_123';

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

    if (compressToken) {
      inputMessages = inputMessages.map((m: any) => ({
        role: m.role,
        content: m.role === 'user' ? compressTextForTokens(m.content) : m.content,
      }));
    }

    let finalMessages: any[] = [];
    if (memoryEnabled === false) {
      const lastUser = [...inputMessages].reverse().find((m: any) => m.role === 'user');
      finalMessages = lastUser ? [lastUser] : inputMessages.slice(-1);
    } else {
      finalMessages = inputMessages;
    }

    let searchContext = '';

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
          console.warn('Web search error:', searchErr);
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
