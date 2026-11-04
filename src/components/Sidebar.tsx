import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Sparkles, 
  X, 
  ExternalLink,
  Coins,
  LogOut,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import type { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearAllChats: () => void;
  onLogout: () => void;
  currentUser: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  isOpen,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClearAllChats,
  onLogout,
  currentUser,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(id);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#171717] border-r border-[#262626] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-3.5 flex items-center justify-between border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                ViLao AI Chat
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                  v1.2
                </span>
              </h1>
              <p className="text-[11px] text-zinc-500">Đồng bộ Model Real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] hover:border-zinc-500/40 text-zinc-200 text-sm font-medium transition-all group shadow-sm active:scale-[0.98]"
          >
            <span className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              Đoạn chat mới
            </span>
            <span className="text-[10px] text-zinc-500 border border-zinc-700/60 rounded px-1.5 py-0.5 group-hover:border-zinc-500 transition-colors">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Chat History Header with Clear All option */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Lịch sử đoạn chat
            </span>
            {sessions.length > 0 && !showClearAllConfirm && (
              <button
                onClick={() => setShowClearAllConfirm(true)}
                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                title="Xoá tất cả lịch sử chat"
              >
                Xoá tất cả
              </button>
            )}
          </div>

          {showClearAllConfirm && (
            <div className="p-2 mb-2 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
              <div className="flex items-center gap-1.5 font-medium mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Xoá toàn bộ lịch sử chat?</span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] hover:bg-zinc-700"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => {
                    onClearAllChats();
                    setShowClearAllConfirm(false);
                  }}
                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-semibold"
                >
                  Xác nhận xoá
                </button>
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-zinc-500 text-xs">
              Chưa có đoạn chat nào. Bắt đầu chat ngay!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isConfirming = deleteConfirmId === session.id;
              const sessionCost = (session.messages || []).reduce((acc, m) => acc + (m.costVnd || 0), 0);

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectChat(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#212121] text-white shadow-sm font-medium'
                      : 'text-zinc-400 hover:bg-[#1f1f1f] hover:text-zinc-200'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <div className="truncate flex-1">
                    <div className="truncate">{session.title || 'Đoạn chat mới'}</div>
                    {sessionCost > 0 && (
                      <div className="text-[10px] text-amber-400/80 font-mono mt-0.5 flex items-center gap-1">
                        <Coins className="w-2.5 h-2.5" />
                        Đã dùng: ~{sessionCost.toFixed(1)} ₫
                      </div>
                    )}
                  </div>
                  
                  {/* Delete controls: Hover or Confirming */}
                  {isConfirming ? (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleConfirmDelete(session.id, e)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        title="Xác nhận xoá"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="p-1 text-zinc-400 hover:bg-zinc-700/50 rounded transition-colors"
                        title="Huỷ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                      title="Xóa đoạn chat này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Security & Key Safe badge */}
        <div className="p-3 mx-2 my-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>API Key ẩn & Bảo mật</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Khóa ViLao được lưu trữ an toàn trong máy chủ Backend, người lạ không thể xem hay lấy trộm.
          </p>
          <div className="mt-2 pt-2 border-t border-emerald-900/20 flex justify-end">
            <a
              href="https://vilao.ai/vi/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
            >
              Dashboard ViLao <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer User & Logout */}
        <div className="p-2 border-t border-[#262626] flex items-center justify-between">
          <div className="flex-1 flex items-center gap-2.5 px-2.5 py-2 text-zinc-300 text-xs font-medium">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="truncate text-zinc-200 font-semibold">{currentUser}</div>
              <div className="text-[10px] text-emerald-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Đã xác thực
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
