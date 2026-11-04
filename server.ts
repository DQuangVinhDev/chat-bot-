import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { performSmartSearch } from './search';
import { compressTextForTokens } from './src/compressor';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Secret API key on server only
const VILAO_API_KEY = process.env.VILAO_API_KEY || '';
const VILAO_BASE_URL = process.env.VILAO_BASE_URL || 'https://api.vilao.ai/v1';

// Login credentials
const ADMIN_USERNAME = process.env.APP_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.APP_ADMIN_PASSWORD || 'vilao@2026';
const AUTH_SECRET_TOKEN = process.env.AUTH_SECRET_TOKEN || 'vilao_auth_secret_token_123';

app.use(cors());
app.use(express.json());

// 1. Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
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
});

// Middleware to verify session token
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc không có quyền truy cập.' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== AUTH_SECRET_TOKEN) {
    return res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  next();
};

// 2. Fetch Models (Backend forwards request with hidden API Key)
app.get('/api/vilao/models', requireAuth, async (req, res) => {
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
    return res.json(data);
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi gọi ViLao models API' });
  }
});

// 3. Chat Completions with Web Search & Memory Control
app.post('/api/vilao/chat', requireAuth, async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature, webSearch, memoryEnabled, compressToken } = req.body;
    const url = `${VILAO_BASE_URL.replace(/\/+$/, '')}/chat/completions`;

    let inputMessages = [...(messages || [])];

    // Áp dụng cơ chế nén Token nếu bật tính năng
    if (compressToken) {
      inputMessages = inputMessages.map((m: any) => ({
        role: m.role,
        content: m.role === 'user' ? compressTextForTokens(m.content) : m.content,
      }));
    }

    // Nếu tắt cơ chế duy trì ngữ cảnh (Memory OFF): Chỉ lấy tin nhắn user mới nhất
    let finalMessages: any[] = [];
    if (memoryEnabled === false) {
      const lastUser = [...inputMessages].reverse().find((m: any) => m.role === 'user');
      finalMessages = lastUser ? [lastUser] : inputMessages.slice(-1);
    } else {
      finalMessages = inputMessages;
    }

    let searchContext = '';

    // Nếu bật Web Search: cào dữ liệu internet thời gian thực
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

            // Khi người dùng hỏi tin nóng / tin hôm nay, không nhét lại cụm "hôm nay có gì hot"
            // vào câu hỏi để tránh kích hoạt phản xạ "tôi không có internet" của LLM
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
        max_tokens: max_tokens || 2048,
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
    return res.json(data);
  } catch (error: any) {
    console.error('Error proxying chat completion:', error);
    return res.status(500).json({ error: error.message || 'Lỗi kết nối từ server tới ViLao API' });
  }
});

app.listen(port, () => {
  console.log(`> Proxy Backend Server running at http://localhost:${port}`);
  console.log(`> Live Web Search & News feed active.`);
});
