import React, { useState } from 'react';
import { Lock, User, Sparkles, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { loginUser } from '../api';

interface LoginModalProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginUser(username.trim(), password.trim());
      if (res.success && res.token) {
        onLoginSuccess(res.token, username.trim());
      } else {
        setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0d0d]/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#191919] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6 relative">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-400 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Đăng nhập ViLao AI Chat</h2>
          <p className="text-xs text-zinc-400 mt-1">
            API Key được bảo vệ tuyệt mật tại Backend server, không lộ ra client.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" /> Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 bg-[#121212] border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" /> Mật khẩu truy cập
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-3.5 py-2.5 bg-[#121212] border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Vào phòng Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chế độ Public an toàn: Bảo vệ ví tiền & Quota API</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">
            Tài khoản mặc định: <code className="text-zinc-300">admin</code> | Mật khẩu: <code className="text-zinc-300">vilao@2026</code>
          </div>
        </div>
      </div>
    </div>
  );
};
