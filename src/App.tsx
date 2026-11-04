import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Send, 
  Sparkles, 
  Loader2, 
  Zap, 
  Terminal, 
  Layers, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  LogOut,
  Globe,
  Brain,
  ZapOff
} from 'lucide-react';
import type { ChatSession, Message, ToastMessage, ModelOption } from './types';
import { 
  FALLBACK_MODELS, 
  fetchRemoteModels, 
  sendChatMessage, 
  calculateCostVnd 
} from './api';
import { Sidebar } from './components/Sidebar';
import { ModelSelector } from './components/ModelSelector';
import { MessageItem } from './components/MessageItem';
import { ToastContainer } from './components/ToastContainer';
import { LoginModal } from './components/LoginModal';

const STORAGE_KEY_SESSIONS = 'vilao_chat_sessions_v4';
const STORAGE_KEY_AUTH = 'vilao_auth_token_v4';
const STORAGE_KEY_USER = 'vilao_auth_user_v4';

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication state
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH);
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_USER) || 'admin';
  });

  // Models list
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-v4.1-flash");
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  // Sessions and messages
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed[0].id : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Input state
  const [inputMessage, setInputMessage] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [compressTokenEnabled, setCompressTokenEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  const handleLoginSuccess = (token: string, username: string) => {
    setAuthToken(token);
    setCurrentUser(username);
    localStorage.setItem(STORAGE_KEY_AUTH, token);
    localStorage.setItem(STORAGE_KEY_USER, username);
    addToast('success', 'Đăng nhập thành công', `Chào mừng ${username}! API Key đã được bảo vệ trên máy chủ.`);
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_USER);
    addToast('info', 'Đã đăng xuất', 'Bạn đã đăng xuất khỏi phiên làm việc an toàn.');
  };

  // Sync models from ViLao API via backend
  const refreshModelsList = async (showToast = true) => {
    if (!authToken) return;
    setIsRefreshingModels(true);
    try {
      const remoteList = await fetchRemoteModels(authToken);
      
      // Hoàn toàn cập nhật theo danh sách mới nhất từ ViLao API
      // Model nào người dùng đã xoá trên web ViLao sẽ tự động biến mất khỏi list
      if (remoteList.length > 0) {
        setModels(remoteList);
        
        // Nếu model đang chọn không còn nằm trong danh sách API mới, tự động chuyển về model hợp lệ đầu tiên
        setSelectedModel((prevSelected) => {
          const isStillValid = remoteList.some(m => m.id === prevSelected);
          return isStillValid ? prevSelected : remoteList[0].id;
        });
      }

      if (showToast) {
        addToast(
          'success',
          'Đã đồng bộ danh sách Model',
          `Cập nhật thành công ${remoteList.length} model đang hoạt động từ ViLao AI.`
        );
      }
    } catch (err: any) {
      if (showToast) {
        addToast(
          'warning',
          'Không thể tải model từ API',
          err.message || 'Hệ thống dùng danh sách model hiện có.'
        );
      }
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      refreshModelsList(false);
    }
  }, [authToken]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  const addToast = (type: 'error' | 'warning' | 'info' | 'success', title: string, message: string, detail?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message, detail }]);

    const timeout = type === 'error' ? 9000 : 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Đoạn chat mới',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      selectedModel: selectedModel,
      totalCostVnd: 0,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteChat = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
    addToast('info', 'Đã xóa đoạn chat', 'Đoạn hội thoại đã được xóa khỏi lịch sử.');
  };

  const handleClearAllChats = () => {
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    addToast('info', 'Đã dọn dẹp lịch sử', 'Tất cả các đoạn chat cũ đã được xoá sạch.');
  };

  const handleCustomModelAdd = (customModelId: string) => {
    if (!models.some((m) => m.id === customModelId)) {
      setModels((prev) => [
        ...prev,
        {
          id: customModelId,
          name: customModelId,
          description: 'Model tự nhập của người dùng',
          isAvailableInKey: false,
          provider: 'Tùy chỉnh',
          badge: 'Tự thêm',
        },
      ]);
    }
    setSelectedModel(customModelId);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || isLoading) return;

    if (!authToken) {
      addToast('warning', 'Yêu cầu đăng nhập', 'Vui lòng đăng nhập để sử dụng chat.');
      return;
    }

    let targetSessionId = currentSessionId;
    let currentSessionObj = sessions.find((s) => s.id === targetSessionId);

    if (!targetSessionId || !currentSessionObj) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        selectedModel: selectedModel,
        totalCostVnd: 0,
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      targetSessionId = newSession.id;
      currentSessionObj = newSession;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...(currentSessionObj?.messages || []), userMsg];
    const activeModel = selectedModel;
    const newTitle =
      (currentSessionObj?.messages.length || 0) === 0
        ? textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '')
        : currentSessionObj?.title || 'Đoạn chat mới';

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
              selectedModel: selectedModel,
            }
          : s
      )
    );

    setInputMessage('');
    setIsLoading(true);

    try {
      // Chuẩn bị toàn bộ lịch sử chat để gửi lên (Cross-model conversation memory)
      const apiPayload = updatedMessages
        .filter((m) => !m.error)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { reply, usage, usedWebSearch, reasoningContent } = await sendChatMessage({
        authToken,
        model: activeModel,
        messages: apiPayload,
        webSearch: webSearchEnabled,
        memoryEnabled: memoryEnabled,
        compressToken: compressTokenEnabled,
      });

      const modelMeta = models.find((m) => m.id === activeModel || m.id.endsWith(activeModel) || activeModel.endsWith(m.id));
      const costVnd = calculateCostVnd(usage, modelMeta?.pricing);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        modelUsed: activeModel,
        costVnd: costVnd,
        usage: usage,
        usedWebSearch: usedWebSearch,
        reasoningContent: reasoningContent,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { 
                ...s, 
                messages: [...s.messages, assistantMsg], 
                updatedAt: Date.now(),
                totalCostVnd: (s.totalCostVnd || 0) + costVnd 
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('API Error:', err);
      const errorMsgText = err.errorDetail || err.message || 'Lỗi không xác định khi gọi API';

      if (err.statusCode === 401 || err.statusCode === 403) {
        handleLogout();
        addToast('error', 'Phiên hết hạn', 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      addToast(
        'error',
        `Lỗi gọi API (${selectedModel})`,
        `Yêu cầu đến ViLao API thất bại: ${errorMsgText.length > 120 ? errorMsgText.slice(0, 120) + '...' : errorMsgText}`,
        `Model: ${selectedModel}\nChi tiết phản hồi: ${errorMsgText}`
      );

      const errorAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Không thể tạo câu trả lời với model \`${selectedModel}\`**\n\n> **Phản hồi từ ViLao API:**\n\`\`\`json\n${errorMsgText}\n\`\`\`\n\n*Gợi ý:* Hãy kiểm tra model này đã được kích hoạt trên gói API key chưa, hoặc bấm nút **"Cập nhật Model"** để làm mới danh sách.`,
        timestamp: Date.now(),
        modelUsed: selectedModel,
        error: true,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, messages: [...s.messages, errorAssistantMsg], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#171717] text-zinc-100 font-sans">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Login Modal if not authenticated */}
      {!authToken && <LoginModal onLoginSuccess={handleLoginSuccess} />}

      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleCreateNewChat}
        onSelectChat={(id) => setCurrentSessionId(id)}
        onDeleteChat={handleDeleteChat}
        onClearAllChats={handleClearAllChats}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-[#262626] flex items-center justify-between px-3 md:px-5 shrink-0 bg-[#171717]/80 backdrop-blur z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors md:hidden"
              aria-label="Mở Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm md:text-base text-zinc-200">
                {currentSession ? currentSession.title : 'ViLao Chat'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono border border-zinc-700/60 hidden sm:inline-block">
                {selectedModel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Key ẩn an toàn</span>
            </div>

            <button
              onClick={() => refreshModelsList(true)}
              disabled={isRefreshingModels}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#212121] hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 transition-colors"
              title="Đồng bộ danh sách model mới từ ViLao"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingModels ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Cập nhật Model</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto w-full relative">
          {(!currentSession || currentSession.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-400 flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Hôm nay tôi có thể giúp gì cho bạn?
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm mb-6 leading-relaxed">
                Được kết nối an toàn với ViLao AI qua Proxy Server. API Key được giữ bí mật 100%. 
                Bạn có thể trò chuyện với <strong className="text-emerald-400 font-mono">Claude Opus 4.8</strong> hoặc <strong className="text-emerald-400 font-mono">DeepSeek v4.1 Flash</strong>.
              </p>

              {/* Quick suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                <button
                  onClick={() => {
                    setSelectedModel("occ/claude-opus-4-8");
                    handleSendMessage("Hãy giới thiệu ngắn gọn về sức mạnh của Claude Opus và ViLao API");
                  }}
                  className="p-3.5 rounded-xl bg-[#212121] hover:bg-[#282828] border border-zinc-800 text-xs transition-all text-zinc-300 hover:text-white group"
                >
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Chat với Claude Opus 4.8
                  </div>
                  <div className="text-[11px] text-zinc-500 group-hover:text-zinc-400">
                    Model cao cấp đã kích hoạt, xem lượng token và chi phí từng câu
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel("deepseek-v4.1-flash");
                    handleSendMessage("Chào bạn! Giới thiệu về model DeepSeek v4.1 Flash");
                  }}
                  className="p-3.5 rounded-xl bg-[#212121] hover:bg-[#282828] border border-zinc-800 text-xs transition-all text-zinc-300 hover:text-white group"
                >
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-1">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Model DeepSeek v4.1 Flash
                  </div>
                  <div className="text-[11px] text-zinc-500 group-hover:text-zinc-400">
                    Model mới bạn vừa cập nhật trên web ViLao (Miễn phí)
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel("gpt-4o");
                    handleSendMessage("Test gọi model gpt-4o để kiểm tra hệ thống thông báo lỗi");
                  }}
                  className="p-3.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-xs transition-all text-zinc-300 hover:text-white group sm:col-span-2"
                >
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-rose-400" /> Thử nghiệm: Gọi model chưa kích hoạt (GPT-4o)
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Bấm vào đây để hệ thống tự động đổi sang "gpt-4o" và hiển thị Announcement Box bắt lỗi trả về từ ViLao API.
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/40 pb-6">
              {currentSession.messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="py-6 px-4 md:px-6 w-full flex justify-center bg-[#1e1e1e]/40">
                  <div className="max-w-3xl w-full flex gap-4 md:gap-5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>ViLao AI ({selectedModel}) đang xử lý...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Area */}
        <div className="p-3 md:p-4 bg-gradient-to-t from-[#171717] via-[#171717]/90 to-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Input Container */}
            <div className="bg-[#212121] border border-zinc-700/60 focus-within:border-zinc-500 rounded-2xl p-2.5 shadow-2xl transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Nhắn tin với ${selectedModel}... (Nhấn Enter để gửi, Shift+Enter xuống dòng)`}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none px-2 py-1 max-h-44"
              />

              {/* Bottom controls inside input box */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ModelSelector
                    models={models}
                    selectedModel={selectedModel}
                    onSelectModel={(id) => setSelectedModel(id)}
                    onCustomModelAdd={handleCustomModelAdd}
                    onRefreshModels={() => refreshModelsList(true)}
                    isRefreshing={isRefreshingModels}
                  />

                  {/* Memory Context Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !memoryEnabled;
                      setMemoryEnabled(next);
                      if (!next) {
                        addToast('info', 'Đã tắt Ngữ cảnh (Siêu tiết kiệm Token)', 'Mỗi câu hỏi sẽ được xử lý độc lập, không gửi kèm lịch sử chat cũ.');
                      } else {
                        addToast('info', 'Đã bật Ngữ cảnh', 'AI sẽ nhớ lại toàn bộ các câu chat trước đó.');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                      memoryEnabled
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                    }`}
                    title="Bật/Tắt gửi kèm lịch sử chat để tiết kiệm token"
                  >
                    <Brain className={`w-3.5 h-3.5 ${memoryEnabled ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span>Ngữ cảnh</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
                      memoryEnabled ? 'bg-indigo-500 text-white' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {memoryEnabled ? 'Bật' : 'Tắt'}
                    </span>
                  </button>

                  {/* Token Compressor Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !compressTokenEnabled;
                      setCompressTokenEnabled(next);
                      if (next) {
                        addToast('success', 'Đã bật Siêu nén Token', 'Tự động rút gọn câu từ đệm tiếng Việt & Anh, tiết kiệm 30-50% token.');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                      compressTokenEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                    }`}
                    title="Nén văn bản tối giản token (loại bỏ từ rườm rà nhưng giữ nguyên ngữ nghĩa)"
                  >
                    <ZapOff className={`w-3.5 h-3.5 ${compressTokenEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span>Siêu nén Token</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
                      compressTokenEnabled ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {compressTokenEnabled ? 'Bật' : 'Tắt'}
                    </span>
                  </button>

                  {/* Web Search Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !webSearchEnabled;
                      setWebSearchEnabled(next);
                      if (next) {
                        addToast('info', 'Đã bật Tìm kiếm Web', 'Bot sẽ tra cứu kết quả Google/Web thực tế trước khi trả lời.');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                      webSearchEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
                    }`}
                    title="Bật/Tắt tìm kiếm dữ liệu internet thời gian thực"
                  >
                    <Globe className={`w-3.5 h-3.5 ${webSearchEnabled ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
                    <span>Tìm kiếm Web</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
                      webSearchEnabled ? 'bg-cyan-400 text-black' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {webSearchEnabled ? 'Bật' : 'Tắt'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-500 transition-all shadow-md active:scale-95"
                    aria-label="Gửi tin nhắn"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom info disclaimer */}
            <div className="mt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Hỗ trợ Desktop & Mobile UI</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Bảo mật API Key Tuyệt Đối</span>
              <span>•</span>
              <a 
                href="https://vilao.ai/vi/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Dashboard ViLao <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
