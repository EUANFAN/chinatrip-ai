"use client";

import { ChatInput } from "@/components/ChatInput";
import { LoginModal } from "@/components/LoginModal";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Check,
  CirclePlus,
  Copy,
  History,
  LogOut,
  Menu,
  MoreHorizontal,
  Share2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComponentType, SVGProps, useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  DEFAULT_QUESTION,
  LAST_QUESTION_KEY,
  MockChat,
  createChatTitle,
  createInitialMockChat,
  createMessage,
  generateMockAnswer,
  mockHistoryItems,
} from "./mock-chat";

function UserAvatar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_30%,#f6c9a7_0_24%,#d79b78_25%_36%,#1f2f46_37%_100%)] shadow-sm ring-2 ring-white/90 ${className}`}
    >
      <div className="mt-[18px] h-5 w-full bg-gradient-to-b from-[#253854] to-[#14243A]" />
    </div>
  );
}

function BotBadge() {
  return (
    <div className="hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E6D8C7] bg-[#FFFDF9] shadow-[0_8px_22px_rgba(20,36,58,0.08)] sm:flex">
      <Image
        src="/logo-img.png"
        alt="ChinaTrip AI"
        width={36}
        height={36}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function Sidebar({
  currentTitle,
  onNewChat,
  onSelectChat,
  onClose,
  onOpenLogin,
}: {
  currentTitle: string;
  onNewChat: () => void;
  onSelectChat?: () => void;
  onClose?: () => void;
  onOpenLogin: () => void;
}) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const chatHistory = [
    {
      id: "current-chat",
      title: currentTitle,
      preview: "Current mock conversation",
      active: true,
    },
    ...mockHistoryItems,
  ];

  return (
    <aside className="flex h-full w-[17.125rem] max-w-[86vw] shrink-0 flex-col border-r border-[#E6D8C7] bg-white/82 text-[#172033] shadow-[12px_0_36px_rgba(20,36,58,0.05)] backdrop-blur-xl">
      <div className="flex h-[4.25rem] shrink-0 items-center justify-between gap-3 border-b border-[#E6D8C7]/70 px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
          aria-label="ChinaTrip AI home"
        >
          <Image
            src="/logo-img.png"
            alt="ChinaTrip AI logo"
            width={40}
            height={40}
            priority
            className="h-9 w-9 shrink-0 rounded-full bg-[#FFFDF9] object-cover shadow-sm ring-1 ring-[#E6D8C7]"
          />
          <span className="truncate text-xl font-semibold tracking-tight">
            ChinaTrip AI
          </span>
        </Link>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#74685C] transition hover:bg-[#EEF4F6] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40 lg:hidden"
            aria-label="Close chat history"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <button
          type="button"
          onClick={onNewChat}
          className="flex h-11 w-full items-center justify-between rounded-xl bg-[linear-gradient(135deg,#8A552B,#14243A)] px-4 text-left text-sm font-semibold text-[#FFF8EF] shadow-[0_10px_22px_rgba(20,36,58,0.10)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#D49A52]/45"
        >
          <span className="inline-flex items-center gap-2">
            <CirclePlus className="h-4.5 w-4.5" />
            New Chat
          </span>
        </button>

        <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pb-3 pr-1">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={onSelectChat}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition focus-visible:ring-2 focus-visible:ring-[#D49A52]/40 ${
                chat.id === "current-chat" ? "bg-[#EEF4F6]" : "hover:bg-[#F4F7F7]"
              }`}
            >
              {chat.id === "current-chat" ? (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#D49A52]" />
              ) : null}
              <History
                className={`h-4.5 w-4.5 shrink-0 ${
                  chat.id === "current-chat" ? "text-[#8A552B]" : "text-[#9A8D80]"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-medium ${
                    chat.id === "current-chat"
                      ? "text-[#172033]"
                      : "text-[#3F4C5F]"
                  }`}
                >
                  {chat.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[#74685C]">
                  {chat.preview}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="relative z-30 shrink-0 border-t border-[#E6D8C7]/70 px-5 py-4">
        {isAccountMenuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsAccountMenuOpen(false)}
              aria-label="Close account menu"
            />
            <div className="absolute bottom-[4.4rem] right-5 z-20 w-40 rounded-xl border border-[#E6D8C7] bg-[#FFFDF9] p-1.5 shadow-lg shadow-[#14243A]/10">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#6F6258] transition hover:bg-[#EEF4F6] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
              >
                <LogOut className="h-4 w-4 text-[#9A8D80]" />
                Log out
              </button>
            </div>
          </>
        ) : null}

        <div className="flex items-center gap-3">
          <div
            onClick={onOpenLogin}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenLogin();
              }
            }}
            role="button"
            tabIndex={0}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-left transition hover:bg-[#EEF4F6] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
          >
            <UserAvatar />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#172033]">
                Guest User
              </p>
              <p className="truncate text-xs text-[#74685C]">Sign in to save</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((value) => !value)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9A8D80] transition hover:bg-[#EEF4F6] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
            aria-label="Account options"
            aria-expanded={isAccountMenuOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function UserMessageBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start justify-end gap-0 sm:gap-4">
      <div className="max-w-[36rem] whitespace-pre-line rounded-[1.25rem] rounded-tr-sm bg-[linear-gradient(135deg,#8A552B,#14243A)] px-4 py-3 text-[0.94rem] leading-7 text-[#FFF8EF] shadow-[0_10px_22px_rgba(20,36,58,0.10)] sm:px-6 sm:py-4">
        {content}
      </div>
      <UserAvatar className="hidden sm:block" />
    </div>
  );
}

type MessageActionTone = "save" | "share" | "copy";

const actionToneClasses: Record<
  MessageActionTone,
  { iconWrap: string; icon: string }
> = {
  save: {
    iconWrap: "bg-emerald-50",
    icon: "text-emerald-600",
  },
  share: {
    iconWrap: "bg-sky-50",
    icon: "text-sky-600",
  },
  copy: {
    iconWrap: "bg-amber-50",
    icon: "text-amber-600",
  },
};

function MessageActionButton({
  Icon,
  label,
  tone,
  onClick,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  tone: MessageActionTone;
  onClick: () => void;
}) {
  const toneClasses = actionToneClasses[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E6D8C7] bg-[#FFFDF9] px-2.5 pr-3 text-sm font-medium text-[#6F6258] transition hover:bg-[#F3EEE7] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${toneClasses.iconWrap}`}
      >
        <Icon className={`h-3.5 w-3.5 ${toneClasses.icon}`} />
      </span>
      {label}
    </button>
  );
}

function AssistantMessageBubble({
  status,
  content,
  onCopy,
  onShare,
}: {
  status?: ChatMessage["status"];
  content: string;
  onCopy: (content: string) => void;
  onShare: () => void;
}) {
  const isLoading = status === "loading";

  return (
    <div className="flex items-start gap-4">
      <BotBadge />
      <article className="w-full rounded-[1.25rem] rounded-tl-sm border border-[#E6D8C7] bg-white p-5 text-[0.94rem] leading-7 text-[#26384D] shadow-[0_18px_45px_rgba(20,36,58,0.06)] sm:p-7">
        {isLoading ? (
          <div className="flex items-center gap-3 text-[#74685C]">
            <span className="text-sm font-medium">Generating answer</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#D49A52]" />
            </span>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-line">{content}</div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E6D8C7]/70 pt-4">
              <MessageActionButton
                Icon={Share2}
                label="Share"
                tone="share"
                onClick={onShare}
              />
              <MessageActionButton
                Icon={Copy}
                label="Copy"
                tone="copy"
                onClick={() => onCopy(content)}
              />
            </div>
          </>
        )}
      </article>
    </div>
  );
}

function MessageItem({
  message,
  onCopy,
  onShare,
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onShare: () => void;
}) {
  if (message.role === "user") {
    return <UserMessageBubble content={message.content} />;
  }

  return (
    <AssistantMessageBubble
      status={message.status}
      content={message.content}
      onCopy={onCopy}
      onShare={onShare}
    />
  );
}

export function ChatView() {
  const router = useRouter();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [chat, setChat] = useState<MockChat>(() => {
    if (typeof window === "undefined") {
      return createInitialMockChat(DEFAULT_QUESTION);
    }

    const storedQuestion = window.sessionStorage.getItem(LAST_QUESTION_KEY);
    return createInitialMockChat(storedQuestion || DEFAULT_QUESTION);
  });
  // TanStack Virtual intentionally returns imperative helpers for measuring and scrolling.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: chat.messages.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 220,
    getItemKey: (index) => chat.messages[index]?.id ?? index,
    overscan: 6,
  });

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    requestAnimationFrame(() => {
      const scrollElement = scrollParentRef.current;

      if (!scrollElement) {
        return;
      }

      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior,
      });
    });
  }

  useEffect(() => {
    if (hasInitialScrolledRef.current || chat.messages.length === 0) {
      return;
    }

    hasInitialScrolledRef.current = true;
    scrollToBottom("auto");
  }, [chat.messages.length]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  function showToast(messageText: string) {
    setToast(messageText);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => setToast(null), 1800);
  }

  function handleSubmit() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isGenerating) {
      return;
    }

    const loadingMessageId = `assistant-loading-${Date.now()}`;
    const userMessage = createMessage("user", trimmedMessage);
    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      role: "assistant",
      content: "Generating answer",
      createdAt: new Date().toISOString(),
      status: "loading",
    };

    setChat((currentChat) => ({
      ...currentChat,
      title:
        currentChat.messages.length === 0
          ? createChatTitle(trimmedMessage)
          : currentChat.title,
      messages: [...currentChat.messages, userMessage, loadingMessage],
    }));
    setMessage("");
    setIsGenerating(true);
    scrollToBottom("smooth");

    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }

    generationTimeoutRef.current = setTimeout(() => {
      setChat((currentChat) => ({
        ...currentChat,
        messages: currentChat.messages.map((chatMessage) =>
          chatMessage.id === loadingMessageId
            ? {
                ...chatMessage,
                content: generateMockAnswer(trimmedMessage),
                status: "complete",
              }
            : chatMessage,
        ),
      }));
      setIsGenerating(false);
      scrollToBottom("smooth");
    }, 1000);
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      showToast("Copy failed. Please try again.");
    }
  }

  function handleCopy(content: string) {
    void copyText(content, "Copied");
  }

  function handleShare() {
    const shareUrl = `${window.location.origin}/share/mock`;
    void copyText(shareUrl, "Share link copied");
  }

  function handleNewChat() {
    router.push("/");
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#F8F5EF] bg-[linear-gradient(135deg,#F8F5EF_0%,#EEF4F6_52%,#F7F0E6_100%)] text-[#172033]">
      <div className="flex h-full">
        <div className="hidden lg:block">
          <Sidebar
            currentTitle={chat.title}
            onNewChat={handleNewChat}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        </div>

        {isDrawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[#172033]/45 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close chat history overlay"
            />
            <div className="relative h-full">
              <Sidebar
                currentTitle={chat.title}
                onNewChat={handleNewChat}
                onSelectChat={() => setIsDrawerOpen(false)}
                onClose={() => setIsDrawerOpen(false)}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            </div>
          </div>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[4.25rem] shrink-0 items-center justify-between gap-4 border-b border-[#E6D8C7] bg-white/76 px-4 shadow-[0_8px_30px_rgba(20,36,58,0.04)] backdrop-blur-xl sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#74685C] transition hover:bg-[#EEF4F6] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40 lg:hidden"
                aria-label="Open chat history"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-[#14243A]">
                  {chat.title}
                </h1>
                <p className="truncate text-sm text-[#756A60]">
                  Mock conversation • Frontend preview
                </p>
              </div>
            </div>
          </header>

          <div
            ref={scrollParentRef}
            className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#F8F5EF_0%,#EEF4F6_58%,#F7F0E6_100%)] px-4 pb-44 pt-12 sm:px-7 sm:pt-16"
          >
            <div
              className="relative mx-auto w-full max-w-[52rem]"
              style={{ height: rowVirtualizer.getTotalSize() }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const chatMessage = chat.messages[virtualItem.index];

                if (!chatMessage) {
                  return null;
                }

                return (
                  <div
                    key={virtualItem.key}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualItem.index}
                    className="absolute left-0 top-0 w-full pb-8"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <MessageItem
                      message={chatMessage}
                      onCopy={handleCopy}
                      onShare={handleShare}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#F8F5EF] via-[#F8F5EF]/88 to-transparent px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-6 sm:px-7 lg:left-[17.125rem]">
            <div className="pointer-events-auto mx-auto w-full max-w-[52rem]">
              <ChatInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSubmit}
                variant="chat"
                placeholder={
                  isGenerating
                    ? "Generating answer..."
                    : "Ask about your China trip..."
                }
                disabled={isGenerating}
              />

              <p className="mt-4 text-center text-xs text-[#9A8D80]">
                AI can make mistakes. Verify important visa and travel
                advisories.
              </p>
            </div>
          </div>
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#172033] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#172033]/20">
          <Check className="h-4 w-4 text-emerald-300" />
          {toast}
        </div>
      ) : null}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  );
}
