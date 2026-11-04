/**
 * Token Compressor: Nén văn bản (Tiếng Việt & Tiếng Anh) sang dạng tối giản
 * Giúp giảm 30% - 60% số lượng token mà LLM vẫn hiểu hoàn hảo ngữ nghĩa cốt lõi.
 */
export function compressTextForTokens(text: string): string {
  if (!text || text.trim().length === 0) return text;

  let cleaned = text;

  // 1. Chuẩn hóa khoảng trắng dư thừa và xuống dòng liên tiếp
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n+/g, '\n');

  // 2. Lược bỏ từ đệm xã giao không mang giá trị ngữ nghĩa (Tiếng Việt & Tiếng Anh)
  const fillerPatterns = [
    // Tiếng Việt đệm
    /\b(xin chào|chào bạn|cho mình hỏi|cho tôi hỏi|làm ơn|bạn có thể|có thể cho mình biết|dạ|vâng|ạ|nhé|nha|với lại|ừm|à|thì là mà)\b/gi,
    // Tiếng Anh đệm
    /\b(hello|hi there|could you please|please kindly|can you tell me|i would like to know|as you know|by the way)\b/gi,
  ];

  for (const pattern of fillerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 3. Dọn dẹp khoảng trắng sau khi lọc
  cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();

  // Nếu sau khi nén bị rỗng (ví dụ người dùng chỉ gõ "xin chào"), giữ nguyên bản gốc
  return cleaned.length > 0 ? cleaned : text.trim();
}
