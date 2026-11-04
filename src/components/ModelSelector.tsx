import React, { useState } from 'react';
import type { ModelOption } from '../types';
import { ChevronDown, Sparkles, AlertCircle, Check, Plus, RefreshCw, Layers } from 'lucide-react';

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onCustomModelAdd?: (modelId: string) => void;
  onRefreshModels?: () => void;
  isRefreshing?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onCustomModelAdd,
  onRefreshModels,
  isRefreshing = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const current = models.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel,
    description: 'Model tùy chỉnh từ người dùng',
    isAvailableInKey: false,
    provider: 'Tùy chọn',
    badge: 'Tùy chọn'
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim();
    if (onCustomModelAdd) {
      onCustomModelAdd(clean);
    }
    onSelectModel(clean);
    setCustomInput('');
    setShowCustomInput(false);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-xs sm:text-sm font-medium text-zinc-200 transition-all shadow-sm active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-medium max-w-[140px] sm:max-w-[200px] truncate">{current.name}</span>
        {current.isAvailableInKey ? (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {current.badge || 'Sẵn sàng'}
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Chưa có key
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCustomInput(false);
            }}
          />
          <div className="absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-[300px] sm:w-[360px] max-h-[420px] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-2.5 z-50 text-zinc-200 backdrop-blur-xl">
            <div className="px-2 py-1 mb-1.5 flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Danh sách AI Model
              </span>
              
              {onRefreshModels && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefreshModels();
                  }}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md transition-colors"
                  title="Cập nhật danh sách model từ ViLao API"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Đồng bộ từ web</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              {models.map((model) => {
                const isSelected = model.id === selectedModel;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
                        : 'hover:bg-zinc-800/80 border border-transparent text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold truncate text-zinc-100">{model.name}</span>
                        {model.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                              model.isAvailableInKey
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                        {model.description}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono flex items-center justify-between">
                        <span>{model.id}</span>
                        {model.pricing && (
                          <span className="text-zinc-400">
                            {model.pricing.price_per_input_token > 0 
                              ? `${model.pricing.price_per_input_token.toLocaleString()}đ / 1M`
                              : 'Miễn phí'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-zinc-800">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nhập model thủ công khác...</span>
                </button>
              ) : (
                <form onSubmit={handleAddCustom} className="flex gap-1.5 p-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="VD: deepseek-v4.1-flash hoặc gpt-4o"
                    autoFocus
                    className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                  >
                    Chọn
                  </button>
                </form>
              )}
            </div>

            <div className="mt-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Nhấn <b>"Đồng bộ từ web"</b> bất cứ khi nào bạn bật thêm model trên ViLao.ai để danh sách cập nhật ngay lập tức!
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
