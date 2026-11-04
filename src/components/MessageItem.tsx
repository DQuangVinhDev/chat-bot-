import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Copy, Check, Sparkles, AlertOctagon, Coins, Cpu, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatVnd = (amount?: number) => {
    if (amount === undefined || amount === null) return null;
    if (amount === 0) return '0 ₫ (Miễn phí)';
    if (amount < 1) {
      return `${amount.toFixed(2)} ₫`;
    }
    return `${amount.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ₫`;
  };

  return (
    <div
      className={`py-6 px-4 md:px-6 w-full flex justify-center transition-colors ${
        isAssistant ? 'bg-[#1e1e1e]/40' : 'bg-transparent'
      }`}
    >
      <div className="max-w-3xl w-full flex gap-4 md:gap-5">
        {/* Avatar */}
        <div className="shrink-0">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              {message.error ? (
                <AlertOctagon className="w-4 h-4 text-rose-300" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-zinc-700 flex items-center justify-center text-zinc-300 font-semibold text-xs">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs text-zinc-200">
                {isAssistant ? 'ViLao Assistant' : 'Bạn'}
              </span>
              {message.modelUsed && (
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                  {message.modelUsed}
                </span>
              )}
              {isAssistant && message.costVnd !== undefined && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  message.costVnd > 0 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  <Coins className="w-3 h-3" />
                  Chi phí: {formatVnd(message.costVnd)}
                </span>
              )}
              {isAssistant && message.usedWebSearch && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  Đã tìm kiếm Web
                </span>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Sao chép tin nhắn"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Thought process (Reasoning) if available */}
          {isAssistant && message.reasoningContent && (
            <div className="mb-3 rounded-xl bg-zinc-900/80 border border-zinc-800 p-2.5 text-xs">
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className="flex items-center justify-between w-full text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quá trình suy nghĩ nội bộ (Reasoning)
                </span>
                {showThinking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showThinking && (
                <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {message.reasoningContent}
                </div>
              )}
            </div>
          )}

          {/* Text body */}
          <div className="prose prose-invert prose-sm max-w-none break-words text-zinc-200 leading-relaxed">
            {message.error ? (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs">
                {message.content}
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    return inline ? (
                      <code className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-black/60 border border-zinc-800 rounded-xl p-3 my-2 text-xs font-mono overflow-x-auto text-zinc-200">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0 text-sm">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 my-2 space-y-1 text-sm">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 my-2 space-y-1 text-sm">{children}</ol>;
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                        {children}
                      </a>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Usage Token details bar */}
          {isAssistant && message.usage && !message.error && (
            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
              <span>Tokens: {message.usage.total_tokens.toLocaleString()}</span>
              <span>• Prompt: {message.usage.prompt_tokens.toLocaleString()}</span>
              <span>• Trả lời: {message.usage.completion_tokens.toLocaleString()}</span>
              {message.usage.prompt_tokens_details?.cached_tokens ? (
                <span className="text-emerald-500">• Cached: {message.usage.prompt_tokens_details.cached_tokens.toLocaleString()}</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
