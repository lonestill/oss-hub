"use client";

import { TaskClaim, TaskMessage } from "@/lib/claims";
import Link from "next/link";
import { X, ExternalLink, GitPullRequest, Send } from "lucide-react";

interface CrmClaimDrawerProps {
  claim: TaskClaim;
  onClose: () => void;
  onClaimStatusChange: (
    claimId: string,
    newStatus: "pending" | "assigned" | "completed" | "rejected"
  ) => Promise<void>;
  messages: TaskMessage[];
  isLoadingChat: boolean;
  isSendingChat: boolean;
  newChatText: string;
  onChangeNewChatText: (val: string) => void;
  onSendReply: (e: React.FormEvent) => Promise<void>;
}

export function CrmClaimDrawer({
  claim,
  onClose,
  onClaimStatusChange,
  messages,
  isLoadingChat,
  isSendingChat,
  newChatText,
  onChangeNewChatText,
  onSendReply,
}: CrmClaimDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-[#30363d] bg-[#161b22] p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-md text-[#8b949e] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[11px] font-mono text-[#58a6ff] block">
            CRM Диалог // Задача #{claim.issue_number}
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5 truncate">
            {claim.issue_title}
          </h3>
        </div>

        {/* Contributor Profile Header */}
        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {claim.user_avatar ? (
              <img
                src={claim.user_avatar}
                alt={claim.user_login}
                className="w-8 h-8 rounded-md border border-[#30363d]"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-[#21262d] flex items-center justify-center font-bold text-white">
                {claim.user_login.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <Link
                href={`/users/${claim.user_login}`}
                target="_blank"
                className="font-semibold text-white hover:underline flex items-center gap-1"
              >
                <span>@{claim.user_login}</span>
                <ExternalLink className="w-3 h-3 text-[#8b949e]" />
              </Link>
              <span className="text-[11px] text-[#8b949e]">
                Статус: <strong className="text-white">{claim.status}</strong>
              </span>
            </div>
          </div>

          {/* Status Action Buttons */}
          <div className="flex items-center gap-1.5">
            {claim.status !== "assigned" && claim.status !== "completed" && (
              <button
                type="button"
                onClick={() => onClaimStatusChange(claim.id, "assigned")}
                className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-semibold"
              >
                Назначить
              </button>
            )}
            {claim.status === "assigned" && (
              <button
                type="button"
                onClick={() => onClaimStatusChange(claim.id, "completed")}
                className="px-2.5 py-1 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[11px] font-semibold"
              >
                Завершить
              </button>
            )}
          </div>
        </div>

        {/* Contributor Pitch */}
        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#8b949e] block">
            Питч контрибьютора:
          </span>
          <p className="text-[#c9d1d9] leading-relaxed">{claim.pitch}</p>
        </div>

        {claim.pr_url && (
          <div className="p-2.5 rounded-lg bg-[#a371f7]/10 border border-[#a371f7]/30 text-xs flex items-center justify-between gap-2">
            <span className="text-white font-medium flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5 text-[#a371f7]" />
              <span>Pull Request:</span>
            </span>
            <a
              href={claim.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58a6ff] hover:underline font-mono text-[11px] flex items-center gap-1 truncate max-w-xs"
            >
              <span className="truncate">{claim.pr_url}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-lg bg-[#0d1117] border border-[#30363d] min-h-[140px] max-h-[260px]">
          {isLoadingChat ? (
            <div className="text-center py-6 text-xs text-[#8b949e]">
              Загрузка сообщений...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#8b949e]">
              Сообщений в треде пока нет. Ответьте кандидату здесь.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-lg text-xs space-y-1 ${
                  msg.is_author
                    ? "bg-[#21262d] border border-[#30363d] ml-6"
                    : "bg-[#161b22] border border-[#30363d] mr-6"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                  <span className="font-semibold text-white">
                    @{msg.sender_login} {msg.is_author && "(Вы)"}
                  </span>
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[#c9d1d9] leading-relaxed">{msg.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Reply Input */}
        <form onSubmit={onSendReply} className="flex gap-2">
          <input
            type="text"
            value={newChatText}
            onChange={(e) => onChangeNewChatText(e.target.value)}
            placeholder="Ответить контрибьютору..."
            className="flex-1 rounded-md bg-[#0d1117] border border-[#30363d] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58a6ff]"
            required
          />
          <button
            type="submit"
            disabled={isSendingChat || !newChatText.trim()}
            className="px-4 py-2 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
}
