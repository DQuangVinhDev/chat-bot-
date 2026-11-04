# 🚀 HƯỚNG DẪN CHẠY VÀ PUBLIC DỰ ÁN VILAO AI CHAT

Dự án gồm 2 phần chạy song song:
1. **Backend Server (Port 3001)**: Giữ bí mật API Key ViLao và xử lý đăng nhập an toàn.
2. **Frontend UI (Port 5173)**: Giao diện web chat ChatGPT/Claude.

---

## ⚡ CÁCH 1: CLICK ĐÚP CHUỘT (DỄ NHẤT CHO WINDOWS)
Trong thư mục dự án `C:\Users\thitr\Downloads\chatbot_nofree`, bạn chỉ cần:
👉 **Click đúp chuột vào file: `RUN_APP.bat`**

File này sẽ tự động bật đồng thời cả Backend và Frontend. Sau đó bạn mở trình duyệt vào:
👉 **`http://localhost:5173`**

---

## 💻 CÁCH 2: CHẠY BẰNG DÒNG LỆNH (TERMINAL / POWERSHELL / CMD)
Mỗi khi khởi động lại máy tính:
1. Mở PowerShell hoặc Terminal tại thư mục dự án:
   ```powershell
   cd C:\Users\thitr\Downloads\chatbot_nofree
   ```
2. Gõ duy nhất 1 lệnh:
   ```bash
   npm run start
   ```
3. Mở trình duyệt vào:
   👉 **`http://localhost:5173`**

---

## 🔑 THÔNG TIN ĐĂNG NHẬP
Khi web mở ra, bạn nhập thông tin bảo vệ:
- **Tài khoản:** `admin`
- **Mật khẩu:** `vilao@2026`

*(Bạn có thể đổi tài khoản và mật khẩu bất cứ lúc nào trong file `.env`)*

---

## 🌐 CÁCH PUBLIC RA INTERNET (CHO NGƯỜI NGOÀI TRUY CẬP AN TOÀN)
Vì bạn muốn public web mà không lo bị lộ API Key hay mất tiền ví:
1. Sử dụng **Cloudflare Tunnel** hoặc **Ngrok**:
   ```bash
   npx cloudflared tunnel --url http://localhost:5173
   # hoặc
   npx ngrok http 5173
   ```
2. Bạn sẽ nhận được 1 đường link công khai (ví dụ: `https://xyz.trycloudflare.com`).
3. Chỉ ai có tài khoản & mật khẩu bạn cấp mới có thể đăng nhập và trò chuyện.
4. Người ngoài xem mã nguồn qua F12 Network cũng **hoàn toàn KHÔNG THẤY API Key** vì toàn bộ request đã được giấu sau Backend Server.
