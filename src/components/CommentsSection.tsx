"use client";

import { useActionState, useRef, useTransition } from "react";
import { Comment } from "@/lib/types";
import { addCommentAction, deleteCommentAction } from "@/app/actions";
import { UserSession } from "@/lib/auth";
import Link from "next/link";
import { MessageSquare, Trash2 } from "lucide-react";

interface CommentsSectionProps {
  projectId: string;
  slug: string;
  comments: Comment[];
  session?: UserSession | null;
  ownerLogin?: string | null;
}

export function CommentsSection({
  projectId,
  slug,
  comments,
  session,
  ownerLogin,
}: CommentsSectionProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(async (prev: { error?: string } | null, formData: FormData) => {
    const res = await addCommentAction(prev, formData);
    if (!res?.error) {
      formRef.current?.reset();
    }
    return res;
  }, null);

  const isCurrentSessionOwner = Boolean(
    session && ownerLogin && session.login.toLowerCase() === ownerLogin.toLowerCase()
  );
  const isSuperAdmin = Boolean(
    session && session.login.toLowerCase() === "lonestill"
  );
  const canModerate = isCurrentSessionOwner || isSuperAdmin;

  const handleDelete = (commentId: string) => {
    if (!window.confirm("Удалить этот комментарий?")) return;
    startDeleteTransition(async () => {
      await deleteCommentAction(commentId, slug);
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#1d212b] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#8a92a3]" />
          <span className="font-semibold text-white">
            Обсуждение ({comments.length})
          </span>
        </div>
        {isCurrentSessionOwner && (
          <span className="px-2 py-0.5 rounded-md bg-[#e5484d]/10 text-[#e5484d] text-[11px] font-semibold border border-[#e5484d]/20">
            Режим автора
          </span>
        )}
      </div>

      {/* Comment Form */}
      <form
        ref={formRef}
        action={formAction}
        className="rounded-xl border border-[#1d212b] bg-[#151821] p-3.5 space-y-3"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="slug" value={slug} />

        {session ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0f1117] border border-[#1d212b]">
            <input type="hidden" name="authorName" value={session.name || session.login} />
            <input type="hidden" name="authorHandle" value={session.login} />

            {session.avatar_url ? (
              <img
                src={session.avatar_url}
                alt={session.login}
                className="w-6 h-6 rounded-full border border-white/10 object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                {session.login.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-xs truncate">
                  {session.name || session.login}
                </span>
                <span className="text-[#8a92a3] text-[11px]">
                  @{session.login}
                </span>
                {isCurrentSessionOwner && (
                  <span className="px-1.5 py-0.5 rounded bg-[#e5484d] text-white text-[10px] font-semibold">
                    Автор
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              name="authorName"
              required
              placeholder="Ваше имя (Гость) *"
              className="w-full bg-[#0f1117] border border-[#1d212b] px-3 py-1.5 rounded-lg text-xs text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
            />
            <input
              type="text"
              name="authorHandle"
              placeholder="Telegram или контакт (@ник, опционально)"
              className="w-full bg-[#0f1117] border border-[#1d212b] px-3 py-1.5 rounded-lg text-xs text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444]"
            />
            <div className="text-[11px] text-[#8a92a3] flex items-center justify-between pt-0.5">
              <span>Гостевой режим</span>
              <Link href="/login" className="text-white hover:underline">
                Войти через GitHub →
              </Link>
            </div>
          </div>
        )}

        <div>
          <textarea
            name="content"
            required
            rows={3}
            placeholder="Задайте вопрос автору или предложите помощь..."
            className="w-full bg-[#0f1117] border border-[#1d212b] p-3 rounded-lg text-xs text-white placeholder-[#586071] focus:outline-none focus:border-[#2e3444] resize-y"
          />
        </div>

        {state?.error && (
          <p className="text-xs text-[#e5484d]">{state.error}</p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[#e5484d] hover:bg-[#cc3e43] text-white font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm border border-[#e5484d]/40"
          >
            {isPending ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-2.5">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-[#8a92a3] text-xs rounded-xl border border-dashed border-[#1d212b]">
            Пока нет комментариев. Начните обсуждение первым.
          </div>
        ) : (
          comments.map((comment) => {
            const isGitHubUser = Boolean(comment.author_avatar && comment.author_handle);
            const isMaintainer = Boolean(
              ownerLogin &&
                isGitHubUser &&
                comment.author_handle &&
                comment.author_handle.toLowerCase().replace(/^@/, "") === ownerLogin.toLowerCase()
            );

            return (
              <div
                key={comment.id}
                className={`rounded-xl border p-3.5 space-y-2 text-xs ${
                  isMaintainer
                    ? "border-[#e5484d]/30 bg-[#e5484d]/5"
                    : "border-[#1d212b] bg-[#151821]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {isGitHubUser ? (
                      <img
                        src={comment.author_avatar!}
                        alt={comment.author_name}
                        className="w-5 h-5 rounded-full border border-white/10 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[#8a92a3] flex items-center justify-center font-bold text-[9px] shrink-0">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {isGitHubUser ? (
                      <>
                        <Link
                          href={`/users/${comment.author_handle!.replace(/^@/, "")}`}
                          className="font-semibold text-white hover:underline truncate"
                        >
                          {comment.author_name}
                        </Link>
                        <Link
                          href={`/users/${comment.author_handle!.replace(/^@/, "")}`}
                          className="text-[#8a92a3] text-[11px] truncate hover:text-white transition-colors"
                        >
                          ({comment.author_handle!.startsWith("@") ? comment.author_handle : `@${comment.author_handle}`})
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-white truncate">
                          {comment.author_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#8a92a3] text-[10px] font-medium shrink-0">
                          Гость
                        </span>
                        {comment.author_handle && (
                          <span className="text-[#8a92a3] text-[11px] truncate">
                            ({comment.author_handle.startsWith("@") ? comment.author_handle : `@${comment.author_handle}`})
                          </span>
                        )}
                      </>
                    )}

                    {isMaintainer && (
                      <span className="px-1.5 py-0.5 rounded bg-[#e5484d] text-white text-[10px] font-semibold shrink-0">
                        Автор
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#8a92a3] text-[11px]">
                      {new Date(comment.created_at).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>

                    {canModerate && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        title="Удалить комментарий"
                        className="text-[#586071] hover:text-[#e5484d] transition-colors p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#d1d5db] whitespace-pre-wrap leading-relaxed pl-7">
                  {comment.content}
                </p>
              </div>
            );
          })

        )}
      </div>
    </div>
  );
}
