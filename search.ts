import https from 'https';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// 1. Lấy tin tức nóng cập nhật 24/7 trực tiếp từ luồng RSS thời sự Việt Nam
export async function fetchLiveNews(): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    const req = https.get('https://vnexpress.net/rss/tin-moi-nhat.rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const results: SearchResult[] = [];
          const items = data.split('<item>');

          for (let i = 1; i < Math.min(items.length, 6); i++) {
            const rawTitle = items[i].split('<title>')[1]?.split('</title>')[0] || '';
            const rawDesc = items[i].split('<description>')[1]?.split('</description>')[0] || '';
            const rawLink = items[i].split('<link>')[1]?.split('</link>')[0] || '';

            const title = rawTitle.replace('<![CDATA[', '').replace(']]>', '').trim();
            const desc = rawDesc.replace(/<[^>]+>/g, '').replace('<![CDATA[', '').replace(']]>', '').trim();

            if (title && desc) {
              results.push({
                title,
                url: rawLink.trim(),
                snippet: `${title}: ${desc}`,
              });
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
  });
}

// 2. Tìm kiếm DuckDuckGo cho các câu hỏi tra cứu thông tin cụ thể
export async function searchDuckDuckGo(query: string, maxResults = 3): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: 'html.duckduckgo.com',
      path: `/html/?q=${encoded}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,vi-VN,en-US,en;q=0.9',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const results: SearchResult[] = [];
          const parts = data.split('result__snippet');

          for (let i = 1; i < parts.length && results.length < maxResults; i++) {
            const startText = parts[i].indexOf('>');
            const closing = parts[i].indexOf('</a>');
            if (startText !== -1 && closing !== -1) {
              const raw = parts[i].substring(startText + 1, closing);
              const cleanSnippet = raw.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();

              if (cleanSnippet.length > 25 && !cleanSnippet.includes('Booking.com') && !cleanSnippet.includes('Klook')) {
                results.push({
                  title: query,
                  url: 'https://duckduckgo.com',
                  snippet: cleanSnippet,
                });
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
    req.setTimeout(3500, () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}

// 3. Router tìm kiếm thông minh: Tự chọn nguồn dữ liệu tốt nhất
export async function performSmartSearch(query: string): Promise<SearchResult[]> {
  const isHotNewsQuery = /hôm nay|hot|tin tức|tin mới|có gì mới|sự kiện|thời sự/i.test(query);
  
  if (isHotNewsQuery) {
    const liveNews = await fetchLiveNews();
    if (liveNews.length > 0) {
      return liveNews;
    }
  }

  return await searchDuckDuckGo(query);
}
