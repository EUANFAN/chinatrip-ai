"use client";

import { ChatInput } from "@/components/ChatInput";
import { AnswerContent } from "@/components/AnswerContent";
import { LoginModal } from "@/components/LoginModal";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import {
  ChatDetailMessage,
  ChatDetailResponse,
  ChatHistoryItem,
  ChatHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  StreamMessageEvent,
} from "@/lib/api/types";
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
import {
  ComponentType,
  MouseEvent,
  SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChatMessage,
  MockChat,
  createChatTitle,
  createMessage,
} from "./mock-chat";

const CHAT_DETAIL_LOADING_AFTER_RESPONSE_MS = 1000;
const GENERATION_DONE_HOLD_MS = 250;
const GENERATION_PROGRESS_INTERVAL_MS = 180;
const STREAM_TYPEWRITER_INTERVAL_MS = 24;
const STREAM_SCROLL_THROTTLE_MS = 120;
const STREAM_BOTTOM_THRESHOLD_PX = 96;
const FORCE_BOTTOM_SECOND_PASS_DELAY_MS = 100;

type DetailLoadingReason = "initial" | "history" | null;

type StreamBuffer = {
  targetChatId: string;
  text: string;
};

function toChatMessage(message: ChatDetailMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content:
      message.status === "failed"
        ? message.errorMessage || "Message failed."
        : message.content,
    createdAt: message.createdAt,
    status: message.status === "pending" ? "loading" : "complete",
  };
}

function toUserChatMessage(
  message: SendMessageResponse["userMessage"],
): ChatMessage {
  return {
    id: message.id,
    role: "user",
    content: message.content,
    createdAt: message.createdAt,
    status: "complete",
  };
}

function toAssistantChatMessage(
  message: SendMessageResponse["assistantMessage"],
): ChatMessage {
  return {
    id: message.id,
    role: "assistant",
    content:
      message.status === "failed"
        ? message.errorMessage || "Message failed."
        : message.content,
    createdAt: message.createdAt,
    status: message.status,
  };
}

function toPendingAssistantChatMessage(
  message: Extract<StreamMessageEvent, { type: "created" }>["assistantMessage"],
): ChatMessage {
  return {
    id: message.id,
    role: "assistant",
    content: "",
    createdAt: message.createdAt,
    status: "loading",
    progress: 1,
  };
}

function parseStreamEvent(rawEvent: string): StreamMessageEvent | null {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) {
    return null;
  }

  return JSON.parse(dataLines.join("\n")) as StreamMessageEvent;
}

function UserAvatar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#E6D8C7] bg-[radial-gradient(circle_at_50%_30%,#f6c9a7_0_24%,#d79b78_25%_36%,#1f2f46_37%_100%)] shadow-[0_8px_22px_rgba(20,36,58,0.08)] ${className}`}
    >
      <div className="mt-[18px] h-5 w-full bg-gradient-to-b from-[#253854] to-[#14243A]" />
    </div>
  );
}

function BotBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E6D8C7] bg-[#FFFDF9] shadow-[0_8px_22px_rgba(20,36,58,0.08)] ${className}`}
    >
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
  currentChatId,
  chatHistory,
  isLoadingHistory,
  onNewChat,
  onSelectChat,
  onClose,
  onOpenLogin,
}: {
  currentChatId: string;
  chatHistory: ChatHistoryItem[];
  isLoadingHistory: boolean;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onClose?: () => void;
  onOpenLogin: () => void;
}) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <aside className="flex h-full w-[17.125rem] max-w-[86vw] shrink-0 flex-col border-r border-[#E6D8C7] bg-white/82 text-[#172033] shadow-[12px_0_36px_rgba(20,36,58,0.05)] backdrop-blur-xl">
      <div className="flex h-[4.25rem] shrink-0 items-center justify-between gap-3 px-5">
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
          {isLoadingHistory ? (
            <div className="rounded-xl px-3 py-3 text-sm font-medium text-[#74685C]">
              Loading chats...
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="rounded-xl px-3 py-3 text-sm font-medium text-[#74685C]">
              No chats yet
            </div>
          ) : (
            chatHistory.map((chat) => {
              const isActive = chat.id === currentChatId;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onSelectChat(chat.id)}
                  className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition focus-visible:ring-2 focus-visible:ring-[#D49A52]/40 ${
                    isActive
                      ? "bg-[linear-gradient(135deg,#8A552B,#14243A)] text-[#FFF8EF] shadow-[0_10px_22px_rgba(20,36,58,0.10)]"
                      : "hover:bg-[#F4F7F7]"
                  }`}
                >
                  <History
                    className={`h-4.5 w-4.5 shrink-0 ${
                      isActive ? "text-[#FFF8EF]" : "text-[#9A8D80]"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-medium ${
                        isActive ? "text-[#FFF8EF]" : "text-[#3F4C5F]"
                      }`}
                    >
                      {chat.title}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        isActive ? "text-[#FFF8EF]/70" : "text-[#74685C]"
                      }`}
                    >
                      {chat.preview ?? "No messages yet"}
                    </span>
                  </span>
                </button>
              );
            })
          )}
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
      <div className="max-w-[36rem] whitespace-pre-line rounded-[1.25rem] rounded-tr-sm border border-white/45 bg-[linear-gradient(135deg,#8A552B,#14243A)] px-4 py-3 text-[0.94rem] leading-7 text-[#FFF8EF] shadow-[0_18px_42px_rgba(2,8,23,0.28),0_0_34px_rgba(255,255,255,0.24)] ring-1 ring-white/28 sm:px-6 sm:py-4">
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
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const toneClasses = actionToneClasses[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex h-9 items-center gap-2 rounded-xl border border-white/80 bg-transparent px-2.5 pr-3 text-sm font-semibold text-[#5E5148] shadow-[0_8px_18px_rgba(20,36,58,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] ring-1 ring-[#E6D8C7]/60 transition duration-200 hover:-translate-y-0.5 hover:border-[#D49A52]/45 hover:bg-white/35 hover:text-[#14243A] hover:shadow-[0_14px_28px_rgba(20,36,58,0.13),0_1px_0_rgba(255,255,255,0.95)_inset] focus-visible:ring-2 focus-visible:ring-[#D49A52]/45 active:translate-y-0"
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full shadow-[0_4px_10px_rgba(20,36,58,0.08)] transition duration-200 group-hover:scale-105 ${toneClasses.iconWrap}`}
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
  progress,
  loadingLabel,
  onCopy,
  onShare,
}: {
  status?: ChatMessage["status"];
  content: string;
  progress?: number;
  loadingLabel?: string;
  onCopy: (content: string, event: MouseEvent<HTMLButtonElement>) => void;
  onShare: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const isLoading = status === "loading";
  const isFailed = status === "failed";
  const isStreaming = isLoading && content.trim().length > 0;
  const progressValue = Math.max(1, Math.min(100, Math.round(progress ?? 1)));

  function renderProgress(label: string) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8A552B]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D49A52]" />
            </span>
            {label}
          </div>
          <span className="shrink-0 rounded-full border border-[#E6D8C7]/70 bg-[#FFF8EF] px-2.5 py-1 text-xs font-bold text-[#8A552B] shadow-[0_6px_14px_rgba(20,36,58,0.06)]">
            {progressValue}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF4F6] shadow-[inset_0_1px_2px_rgba(20,36,58,0.08)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#D49A52,#8A552B,#14243A)] shadow-[0_0_14px_rgba(212,154,82,0.34)] transition-all duration-500 ease-out"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0 sm:gap-4">
      <BotBadge className="hidden sm:flex" />
      <article className="relative w-full overflow-hidden rounded-[1.25rem] rounded-tl-sm border border-white/80 bg-white p-5 text-[0.94rem] leading-7 text-[#26384D] shadow-[0_28px_70px_rgba(10,18,30,0.22),0_8px_18px_rgba(10,18,30,0.08),0_1px_0_rgba(255,255,255,0.95)_inset] ring-1 ring-[#E6D8C7]/60 sm:p-7">
        <div
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          aria-hidden="true"
        />
        <div className="relative z-10">
          {isStreaming ? (
            <div className="space-y-5">
              <AnswerContent content={content} showCursor />
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E6D8C7]/70 bg-[#FFF8EF]/76 px-3 py-1.5 text-xs font-semibold text-[#8A552B] shadow-[0_8px_18px_rgba(20,36,58,0.06)]">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D49A52]" />
                </span>
                Writing answer
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-5 text-[#74685C]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2.5">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF7EA] shadow-[0_8px_18px_rgba(138,85,43,0.12)] ring-1 ring-[#E6D8C7]/70">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-[#D49A52]/18" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-[#D49A52]" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#26384D]">
                      {loadingLabel ?? "Generating answer"}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-[#74685C]">
                      Organizing practical travel guidance
                    </span>
                  </span>
                </div>
              </div>
              {renderProgress("Drafting response")}

              <div className="space-y-2.5 rounded-2xl border border-[#E6D8C7]/55 bg-[#FFFDF9]/72 p-4 shadow-[0_10px_24px_rgba(20,36,58,0.05)_inset]">
                <div className="h-3 w-full animate-pulse rounded-full bg-[#E6D8C7]" />
                <div className="h-3 w-11/12 animate-pulse rounded-full bg-[#EEF4F6]" />
                <div className="h-3 w-4/5 animate-pulse rounded-full bg-[#EEF4F6]" />
              </div>

            </div>
          ) : isFailed ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                Generation failed
              </div>
              <div className="whitespace-pre-line text-[#6F3E36]">
                {content || "Failed to generate answer. Please try again."}
              </div>
            </div>
          ) : (
            <>
              <AnswerContent content={content} />
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
                  onClick={(event) => onCopy(content, event)}
                />
              </div>
            </>
          )}
        </div>
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
  onCopy: (content: string, event: MouseEvent<HTMLButtonElement>) => void;
  onShare: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (message.role === "user") {
    return <UserMessageBubble content={message.content} />;
  }

  return (
    <AssistantMessageBubble
      status={message.status}
      content={message.content}
      progress={message.progress}
      loadingLabel={message.loadingLabel}
      onCopy={onCopy}
      onShare={onShare}
    />
  );
}

function waitForChatDetailLoadingAfterResponse() {
  return new Promise((resolve) => {
    setTimeout(resolve, CHAT_DETAIL_LOADING_AFTER_RESPONSE_MS);
  });
}

export function ChatView({ chatId }: { chatId: string }) {
  const router = useRouter();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generationIntervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const streamTypewriterIntervalsRef = useRef<
    ReturnType<typeof setInterval>[]
  >([]);
  const streamBuffersRef = useRef(new Map<string, StreamBuffer>());
  const lastAutoScrollAtRef = useRef(0);
  const loadedChatDetailsRef = useRef(new Map<string, MockChat>());
  const detailLoadingReasonRef = useRef<DetailLoadingReason>("initial");
  const lastCompletedDetailReasonRef = useRef<DetailLoadingReason>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoadingChatDetail, setIsLoadingChatDetail] = useState(true);
  const [detailLoadingReason, setDetailLoadingReason] =
    useState<DetailLoadingReason>("initial");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [toast, setToast] = useState<{
    message: string;
    x: number;
    y: number;
  } | null>(null);
  const [chat, setChat] = useState<MockChat | null>(null);
  const currentTitle = chat?.title;
  const shouldShowHistorySkeleton =
    isLoadingChatDetail && detailLoadingReason === "history";
  const rowVirtualizer = useVirtualizer({
    count: chat?.messages.length ?? 0,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 220,
    getItemKey: (index) => chat?.messages[index]?.id ?? index,
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

  function forceScrollToBottomAfterMessageInsert() {
    scrollToBottom("smooth");

    generationTimeoutsRef.current.push(
      setTimeout(() => {
        scrollToBottom("smooth");
      }, FORCE_BOTTOM_SECOND_PASS_DELAY_MS),
    );
  }

  function scrollToBottomIfNearBottom(behavior: ScrollBehavior = "smooth") {
    const scrollElement = scrollParentRef.current;

    if (!scrollElement) {
      return;
    }

    const distanceFromBottom =
      scrollElement.scrollHeight -
      scrollElement.scrollTop -
      scrollElement.clientHeight;

    if (distanceFromBottom > STREAM_BOTTOM_THRESHOLD_PX) {
      return;
    }

    const now = Date.now();

    if (now - lastAutoScrollAtRef.current < STREAM_SCROLL_THROTTLE_MS) {
      return;
    }

    lastAutoScrollAtRef.current = now;
    scrollToBottom(behavior);
  }

  function updateDetailLoadingReason(reason: DetailLoadingReason) {
    detailLoadingReasonRef.current = reason;
    setDetailLoadingReason(reason);
  }

  function clearGenerationTimers() {
    generationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    generationTimeoutsRef.current = [];
    generationIntervalsRef.current.forEach((interval) => clearInterval(interval));
    generationIntervalsRef.current = [];
    streamTypewriterIntervalsRef.current.forEach((interval) =>
      clearInterval(interval),
    );
    streamTypewriterIntervalsRef.current = [];
    streamBuffersRef.current.clear();
  }

  function setChatAndCache(nextChat: MockChat) {
    loadedChatDetailsRef.current.set(nextChat.id, nextChat);
    setChat(nextChat);
  }

  function updateChatAndCache(updater: (currentChat: MockChat) => MockChat) {
    setChat((currentChat) => {
      if (!currentChat) {
        return currentChat;
      }

      const nextChat = updater(currentChat);
      loadedChatDetailsRef.current.set(nextChat.id, nextChat);
      return nextChat;
    });
  }

  function updateChatByIdAndCache(
    targetChatId: string,
    updater: (currentChat: MockChat) => MockChat,
  ) {
    const cachedChat = loadedChatDetailsRef.current.get(targetChatId);

    if (cachedChat) {
      loadedChatDetailsRef.current.set(targetChatId, updater(cachedChat));
    }

    setChat((currentChat) => {
      if (!currentChat || currentChat.id !== targetChatId) {
        return currentChat;
      }

      const nextChat = updater(currentChat);
      loadedChatDetailsRef.current.set(targetChatId, nextChat);
      return nextChat;
    });
  }

  function takeTypewriterChunk(text: string) {
    if (text.length <= 5) {
      return text;
    }

    const chunkSize = Math.min(5, Math.max(2, Math.ceil(text.length / 24)));
    const candidate = text.slice(0, chunkSize);
    const nextCharacter = text.at(chunkSize);
    const lastSpaceIndex = candidate.lastIndexOf(" ");

    if (
      lastSpaceIndex >= 2 &&
      nextCharacter &&
      /[A-Za-z]/.test(nextCharacter)
    ) {
      return text.slice(0, lastSpaceIndex + 1);
    }

    if (
      nextCharacter &&
      /[A-Za-z]/.test(candidate.at(-1) ?? "") &&
      /[A-Za-z]/.test(nextCharacter)
    ) {
      const nextSpaceIndex = text.slice(chunkSize, chunkSize + 10).indexOf(" ");

      if (nextSpaceIndex >= 0) {
        return text.slice(0, chunkSize + nextSpaceIndex + 1);
      }
    }

    return candidate;
  }

  function appendStreamBuffer(assistantMessageId: string, content: string) {
    const buffer = streamBuffersRef.current.get(assistantMessageId);

    if (!buffer) {
      return;
    }

    streamBuffersRef.current.set(assistantMessageId, {
      ...buffer,
      text: `${buffer.text}${content}`,
    });
  }

  function flushStreamBuffer(targetChatId: string, assistantMessageId: string) {
    const buffer = streamBuffersRef.current.get(assistantMessageId);

    if (!buffer?.text) {
      return;
    }

    const remainingText = buffer.text;

    streamBuffersRef.current.set(assistantMessageId, {
      ...buffer,
      text: "",
    });

    updateChatByIdAndCache(targetChatId, (currentChat) => ({
      ...currentChat,
      messages: currentChat.messages.map((chatMessage) =>
        chatMessage.id === assistantMessageId
          ? {
              ...chatMessage,
              content: `${chatMessage.content}${remainingText}`,
              status: "loading",
              loadingLabel: undefined,
            }
          : chatMessage,
      ),
    }));
    scrollToBottomIfNearBottom("smooth");
  }

  function startStreamTypewriter(
    targetChatId: string,
    assistantMessageId: string,
  ) {
    if (streamBuffersRef.current.has(assistantMessageId)) {
      return;
    }

    streamBuffersRef.current.set(assistantMessageId, {
      targetChatId,
      text: "",
    });

    const interval = setInterval(() => {
      const buffer = streamBuffersRef.current.get(assistantMessageId);

      if (!buffer?.text) {
        return;
      }

      const nextChunk = takeTypewriterChunk(buffer.text);

      streamBuffersRef.current.set(assistantMessageId, {
        ...buffer,
        text: buffer.text.slice(nextChunk.length),
      });

      updateChatByIdAndCache(buffer.targetChatId, (currentChat) => ({
        ...currentChat,
        messages: currentChat.messages.map((chatMessage) =>
          chatMessage.id === assistantMessageId
            ? {
                ...chatMessage,
                content: `${chatMessage.content}${nextChunk}`,
                status: "loading",
                loadingLabel: undefined,
              }
            : chatMessage,
        ),
      }));
      scrollToBottomIfNearBottom("smooth");
    }, STREAM_TYPEWRITER_INTERVAL_MS);

    streamTypewriterIntervalsRef.current.push(interval);
  }

  function startGenerationProgress(targetChatId: string, loadingMessageId: string) {
    clearGenerationTimers();
    setIsGenerating(true);
    let hasDelta = false;
    let currentLoadingMessageId = loadingMessageId;

    updateChatByIdAndCache(targetChatId, (currentChat) => ({
      ...currentChat,
      messages: currentChat.messages.map((chatMessage) =>
        chatMessage.id === loadingMessageId
          ? { ...chatMessage, progress: 1 }
          : chatMessage,
      ),
    }));

    generationIntervalsRef.current.push(
      setInterval(() => {
        updateChatByIdAndCache(targetChatId, (currentChat) => ({
          ...currentChat,
          messages: currentChat.messages.map((chatMessage) => {
            if (
              chatMessage.id !== currentLoadingMessageId ||
              chatMessage.status !== "loading"
            ) {
              return chatMessage;
            }

            const currentProgress = chatMessage.progress ?? 1;
            const maxProgress = hasDelta ? 95 : 90;
            let increment = 1;

            if (hasDelta) {
              increment = 1;
            } else if (currentProgress < 35) {
              increment = 4;
            } else if (currentProgress < 70) {
              increment = 2;
            }

            return {
              ...chatMessage,
              progress: Math.min(maxProgress, currentProgress + increment),
            };
          }),
        }));
      }, GENERATION_PROGRESS_INTERVAL_MS),
    );

    generationTimeoutsRef.current.push(
      setTimeout(() => {
        updateChatByIdAndCache(targetChatId, (currentChat) => ({
          ...currentChat,
          messages: currentChat.messages.map((chatMessage) =>
            chatMessage.id === currentLoadingMessageId &&
            chatMessage.status === "loading" &&
            !chatMessage.content
              ? { ...chatMessage, loadingLabel: "Still working..." }
              : chatMessage,
          ),
        }));
      }, 3000),
    );

    return {
      setLoadingMessageId(nextLoadingMessageId: string) {
        currentLoadingMessageId = nextLoadingMessageId;
      },
      markDelta() {
        hasDelta = true;
      },
    };
  }

  function updateHistoryPreview(targetChatId: string, preview: string) {
    const now = new Date().toISOString();

    setChatHistory((currentHistory) =>
      currentHistory
        .map((historyItem) =>
          historyItem.id === targetChatId
            ? {
                ...historyItem,
                preview,
                updatedAt: now,
                lastMessageAt: now,
              }
            : historyItem,
        )
        .sort(
          (first, second) =>
            new Date(second.lastMessageAt).getTime() -
            new Date(first.lastMessageAt).getTime(),
        ),
    );
  }

  async function sendMessageToApi({
    targetChatId,
    requestBody,
    loadingMessageId,
    optimisticUserMessageId,
  }: {
    targetChatId: string;
    requestBody: SendMessageRequest;
    loadingMessageId: string;
    optimisticUserMessageId?: string;
  }) {
    const progressController = startGenerationProgress(
      targetChatId,
      loadingMessageId,
    );
    let activeAssistantMessageId = loadingMessageId;

    try {
      const response = await fetch(`/api/chats/${targetChatId}/messages/stream`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        let messageText = response.statusText || "Failed to generate answer.";

        try {
          const body = await response.json() as {
            error?: { message?: string };
          };
          messageText = body.error?.message ?? messageText;
        } catch {
          // Keep the HTTP status text fallback.
        }

        throw new ApiClientError({
          status: response.status,
          code: "STREAM_REQUEST_FAILED",
          message: messageText,
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const rawEvents = buffer.split(/\r?\n\r?\n/);
        buffer = rawEvents.pop() ?? "";

        for (const rawEvent of rawEvents) {
          const event = parseStreamEvent(rawEvent);

          if (!event) {
            continue;
          }

          if (event.type === "created") {
            const userMessage = toUserChatMessage(event.userMessage);
            const assistantMessage = toPendingAssistantChatMessage(
              event.assistantMessage,
            );
            activeAssistantMessageId = assistantMessage.id;
            progressController.setLoadingMessageId(activeAssistantMessageId);
            startStreamTypewriter(targetChatId, activeAssistantMessageId);

            updateChatByIdAndCache(targetChatId, (currentChat) => {
              const messagesWithoutTemporary = currentChat.messages.filter(
                (chatMessage) =>
                  chatMessage.id !== loadingMessageId &&
                  chatMessage.id !== optimisticUserMessageId,
              );
              const hasPersistedUserMessage = messagesWithoutTemporary.some(
                (chatMessage) => chatMessage.id === userMessage.id,
              );

              return {
                ...currentChat,
                messages: [
                  ...messagesWithoutTemporary,
                  ...(hasPersistedUserMessage ? [] : [userMessage]),
                  {
                    ...assistantMessage,
                    progress:
                      currentChat.messages.find(
                        (chatMessage) => chatMessage.id === loadingMessageId,
                      )?.progress ?? 1,
                  },
                ],
              };
            });
          }

          if (event.type === "delta") {
            progressController.markDelta();
            streamedContent += event.content;
            startStreamTypewriter(targetChatId, activeAssistantMessageId);
            appendStreamBuffer(activeAssistantMessageId, event.content);
            const estimatedProgress = Math.min(
              95,
              Math.max(55, 55 + Math.floor(streamedContent.length / 24)),
            );

            updateChatByIdAndCache(targetChatId, (currentChat) => ({
              ...currentChat,
              messages: currentChat.messages.map((chatMessage) =>
                chatMessage.id === activeAssistantMessageId
                  ? {
                      ...chatMessage,
                      status: "loading",
                      progress: Math.max(
                        estimatedProgress,
                        chatMessage.progress ?? 1,
                      ),
                      loadingLabel: undefined,
                    }
                  : chatMessage,
              ),
            }));
          }

          if (event.type === "done") {
            const assistantMessage = toAssistantChatMessage(
              event.assistantMessage,
            );

            flushStreamBuffer(targetChatId, activeAssistantMessageId);
            updateChatByIdAndCache(targetChatId, (currentChat) => ({
              ...currentChat,
              messages: currentChat.messages.map((chatMessage) =>
                chatMessage.id === activeAssistantMessageId
                  ? {
                      ...chatMessage,
                      status: "loading",
                      progress: 100,
                      loadingLabel: undefined,
                    }
                  : chatMessage,
              ),
            }));
            await new Promise((resolve) =>
              setTimeout(resolve, GENERATION_DONE_HOLD_MS),
            );
            updateChatByIdAndCache(targetChatId, (currentChat) => ({
              ...currentChat,
              messages: currentChat.messages.map((chatMessage) =>
                chatMessage.id === activeAssistantMessageId
                  ? assistantMessage
                  : chatMessage,
              ),
            }));
            updateHistoryPreview(targetChatId, assistantMessage.content);
          }

          if (event.type === "error") {
            const errorMessage =
              event.assistantMessage
                ? toAssistantChatMessage(event.assistantMessage)
                : {
                    id: activeAssistantMessageId,
                    role: "assistant" as const,
                    content: event.error.message,
                    createdAt: new Date().toISOString(),
                    status: "failed" as const,
                  };

            updateChatByIdAndCache(targetChatId, (currentChat) => ({
              ...currentChat,
              messages: currentChat.messages.map((chatMessage) =>
                chatMessage.id === activeAssistantMessageId
                  ? {
                      ...errorMessage,
                      progress: undefined,
                      loadingLabel: undefined,
                    }
                  : chatMessage,
              ),
            }));
          }
        }
      }
    } catch (error) {
      updateChatByIdAndCache(targetChatId, (currentChat) => ({
        ...currentChat,
        messages: currentChat.messages.map((chatMessage) =>
          chatMessage.id === activeAssistantMessageId ||
          chatMessage.id === loadingMessageId
            ? {
                ...chatMessage,
                content:
                  error instanceof ApiClientError
                    ? error.message
                    : "Failed to generate answer.",
                status: "failed",
                progress: undefined,
                loadingLabel: undefined,
              }
            : chatMessage,
        ),
      }));
    } finally {
      clearGenerationTimers();
      setIsGenerating(false);
      scrollToBottom("smooth");
    }
  }

  useEffect(() => {
    updateDetailLoadingReason("initial");
    setActiveChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    function syncActiveChatFromHistory() {
      const nextChatId = window.location.pathname.match(
        /^\/chat\/([^/?#]+)/,
      )?.[1];

      if (nextChatId) {
        updateDetailLoadingReason(
          loadedChatDetailsRef.current.has(decodeURIComponent(nextChatId))
            ? null
            : "history",
        );
        setActiveChatId(decodeURIComponent(nextChatId));
      }
    }

    window.addEventListener("popstate", syncActiveChatFromHistory);

    return () => {
      window.removeEventListener("popstate", syncActiveChatFromHistory);
    };
  }, []);

  useEffect(() => {
    if (hasInitialScrolledRef.current || !chat || chat.messages.length === 0) {
      return;
    }

    hasInitialScrolledRef.current = true;
    scrollToBottom("auto");
  }, [chat]);

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      setIsLoadingHistory(true);

      try {
        const historyResponse = await apiFetch<ChatHistoryResponse>("/chats");

        if (!isActive) {
          return;
        }

        setChatHistory(historyResponse.chats);
      } catch {
        if (!isActive) {
          return;
        }

        setChatHistory([]);
      } finally {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const cachedChat = loadedChatDetailsRef.current.get(activeChatId);

    setChatError(null);
    clearGenerationTimers();
    setIsGenerating(false);
    hasInitialScrolledRef.current = false;

    if (cachedChat) {
      setChat(cachedChat);
      setIsLoadingChatDetail(false);
      updateDetailLoadingReason(null);
      return () => {
        isActive = false;
      };
    }

    async function loadChatDetail() {
      setIsLoadingChatDetail(true);
      setChat(null);
      const shouldHoldLoading = detailLoadingReasonRef.current === "history";

      try {
        const chatResponse = await apiFetch<ChatDetailResponse>(
          `/chats/${activeChatId}`,
        );

        if (shouldHoldLoading) {
          await waitForChatDetailLoadingAfterResponse();
        }

        if (!isActive) {
          return;
        }

        lastCompletedDetailReasonRef.current = detailLoadingReasonRef.current;
        setChatAndCache({
          id: chatResponse.chat.id,
          title: chatResponse.chat.title,
          messages: chatResponse.messages.map(toChatMessage),
        });
      } catch (error) {
        if (shouldHoldLoading) {
          await waitForChatDetailLoadingAfterResponse();
        }

        if (!isActive) {
          return;
        }

        setChat(null);
        setChatError(
          error instanceof ApiClientError
            ? error.message
            : "Failed to load chat.",
        );
      } finally {
        if (isActive) {
          setIsLoadingChatDetail(false);
          updateDetailLoadingReason(null);
        }
      }
    }

    void loadChatDetail();

    return () => {
      isActive = false;
    };
  }, [activeChatId]);

  useEffect(() => {
    if (
      isLoadingChatDetail ||
      chatError ||
      !chat ||
      isGenerating ||
      lastCompletedDetailReasonRef.current !== "initial"
    ) {
      return;
    }

    const firstUserMessage = chat.messages.find(
      (chatMessage) => chatMessage.role === "user",
    );
    const hasAssistantMessage = chat.messages.some(
      (chatMessage) => chatMessage.role === "assistant",
    );
    const hasOnlyOneUserMessage =
      chat.messages.length === 1 && chat.messages[0]?.role === "user";

    if (!firstUserMessage || hasAssistantMessage || !hasOnlyOneUserMessage) {
      lastCompletedDetailReasonRef.current = null;
      return;
    }

    lastCompletedDetailReasonRef.current = null;
    const loadingMessage: ChatMessage = {
      id: `assistant-initial-loading-${chat.id}`,
      role: "assistant",
      content: "Generating answer",
      createdAt: new Date().toISOString(),
      status: "loading",
      progress: 1,
    };

    updateChatAndCache((currentChat) => ({
      ...currentChat,
      messages: [...currentChat.messages, loadingMessage],
    }));
    forceScrollToBottomAfterMessageInsert();
    void sendMessageToApi({
      targetChatId: chat.id,
      requestBody: {},
      loadingMessageId: loadingMessage.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, chatError, isGenerating, isLoadingChatDetail]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      clearGenerationTimers();
    };
  }, []);

  function showToast(
    messageText: string,
    target: HTMLButtonElement,
  ) {
    const rect = target.getBoundingClientRect();

    setToast({
      message: messageText,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => setToast(null), 1800);
  }

  function handleSubmit() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isGenerating || !chat) {
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
      progress: 1,
    };

    updateChatAndCache((currentChat) => ({
      ...currentChat,
      title:
        currentChat.messages.length === 0
          ? createChatTitle(trimmedMessage)
          : currentChat.title,
      messages: [...currentChat.messages, userMessage, loadingMessage],
    }));
    setMessage("");
    forceScrollToBottomAfterMessageInsert();
    void sendMessageToApi({
      targetChatId: chat.id,
      requestBody: {
        message: trimmedMessage,
      },
      loadingMessageId,
      optimisticUserMessageId: userMessage.id,
    });
  }

  async function copyText(
    text: string,
    successMessage: string,
    target: HTMLButtonElement,
  ) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, target);
    } catch {
      showToast("Copy failed. Please try again.", target);
    }
  }

  function handleCopy(
    content: string,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    void copyText(content, "Copied", event.currentTarget);
  }

  function handleShare(event: MouseEvent<HTMLButtonElement>) {
    const shareUrl = `${window.location.origin}/share/mock`;
    void copyText(shareUrl, "Share link copied", event.currentTarget);
  }

  function handleNewChat() {
    router.push("/");
  }

  function handleSelectChat(selectedChatId: string) {
    updateDetailLoadingReason(
      loadedChatDetailsRef.current.has(selectedChatId) ? null : "history",
    );
    setActiveChatId(selectedChatId);

    if (window.location.pathname !== `/chat/${selectedChatId}`) {
      window.history.pushState(null, "", `/chat/${selectedChatId}`);
    }
  }

  function handleSelectChatFromDrawer(selectedChatId: string) {
    setIsDrawerOpen(false);
    handleSelectChat(selectedChatId);
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#F8F5EF] bg-[linear-gradient(135deg,#F8F5EF_0%,#EEF4F6_52%,#F7F0E6_100%)] text-[#172033]">
      <div className="flex h-full">
        <div className="hidden lg:block">
          <Sidebar
            currentChatId={activeChatId}
            chatHistory={chatHistory}
            isLoadingHistory={isLoadingHistory}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
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
                currentChatId={activeChatId}
                chatHistory={chatHistory}
                isLoadingHistory={isLoadingHistory}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChatFromDrawer}
                onClose={() => setIsDrawerOpen(false)}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            </div>
          </div>
        ) : null}

        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/home-great-wall.png")',
              backgroundPosition: "center center",
              backgroundSize: "cover",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-black/34"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/68 via-black/18 to-black/68"
            aria-hidden="true"
          />

          <header className="relative z-10 flex min-h-[4.25rem] shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-7">
            <div className="flex w-full min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/14 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden"
                aria-label="Open chat history"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                {isLoadingChatDetail ? (
                  <div className="space-y-2">
                    <div className="h-5 w-52 max-w-full animate-pulse rounded-full bg-white/22 sm:h-6 sm:w-[26rem]" />
                    <div className="h-3 w-36 animate-pulse rounded-full bg-white/14" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg font-bold leading-snug tracking-tight text-white max-sm:truncate sm:whitespace-normal sm:overflow-visible sm:break-words sm:text-xl sm:[overflow-wrap:anywhere]">
                      {currentTitle ?? "Chat"}
                    </h1>
                    <p className="truncate text-sm text-white/72">
                      ChinaTrip AI conversation
                    </p>
                  </>
                )}
              </div>
            </div>
          </header>

          <div
            ref={scrollParentRef}
            className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-12 sm:px-7 sm:pb-5 sm:pt-16"
          >
            {shouldShowHistorySkeleton ? (
              <div className="mx-auto w-full max-w-[52rem] space-y-7">
                <div className="flex items-start justify-end gap-0 sm:gap-4">
                  <div className="w-full max-w-[36rem] rounded-[1.25rem] rounded-tr-sm border border-white/35 bg-[linear-gradient(135deg,rgba(138,85,43,0.72),rgba(20,36,58,0.82))] px-4 py-3 shadow-[0_18px_42px_rgba(2,8,23,0.22),0_0_28px_rgba(255,255,255,0.16)] ring-1 ring-white/22 sm:px-6 sm:py-4">
                    <div className="space-y-2.5">
                      <div className="h-3 w-11/12 animate-pulse rounded-full bg-white/36" />
                      <div className="h-3 w-7/12 animate-pulse rounded-full bg-white/24" />
                    </div>
                  </div>
                  <span className="hidden h-9 w-9 shrink-0 animate-pulse rounded-full border border-[#E6D8C7] bg-[#E6D8C7] sm:block" />
                </div>

                <div className="flex items-start gap-0 sm:gap-4">
                  <span className="hidden h-9 w-9 shrink-0 animate-pulse rounded-full border border-[#E6D8C7] bg-white/86 sm:block" />
                  <div className="relative w-full overflow-hidden rounded-[1.25rem] rounded-tl-sm border border-white/80 bg-white/90 p-5 shadow-[0_28px_70px_rgba(10,18,30,0.18),0_8px_18px_rgba(10,18,30,0.08),0_1px_0_rgba(255,255,255,0.95)_inset] ring-1 ring-[#E6D8C7]/60 sm:p-7">
                    <div
                      className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                      aria-hidden="true"
                    />
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-32 animate-pulse rounded-full bg-[#D49A52]/45" />
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.2s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-[#D49A52] [animation-delay:-0.1s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-[#D49A52]" />
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3 w-full animate-pulse rounded-full bg-[#E6D8C7]" />
                        <div className="h-3 w-11/12 animate-pulse rounded-full bg-[#EEF4F6]" />
                        <div className="h-3 w-5/6 animate-pulse rounded-full bg-[#EEF4F6]" />
                        <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#EEF4F6]" />
                      </div>
                      <div className="flex gap-2 border-t border-[#E6D8C7]/70 pt-4">
                        <span className="h-8 w-20 animate-pulse rounded-xl border border-white/80 bg-white/55 ring-1 ring-[#E6D8C7]/50" />
                        <span className="h-8 w-20 animate-pulse rounded-xl border border-white/80 bg-white/55 ring-1 ring-[#E6D8C7]/50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isLoadingChatDetail ? (
              <div className="mx-auto w-full max-w-[52rem] py-10 text-center text-sm font-semibold text-white/70">
                Loading conversation...
              </div>
            ) : chatError ? (
              <div className="mx-auto w-full max-w-[52rem] rounded-[1.25rem] border border-white/70 bg-white/88 p-5 text-sm font-medium text-[#74685C] shadow-[0_18px_45px_rgba(20,36,58,0.12)]">
                {chatError}
              </div>
            ) : (
              <div
                className="relative mx-auto w-full max-w-[52rem]"
                style={{ height: rowVirtualizer.getTotalSize() }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const chatMessage = chat?.messages[virtualItem.index];

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
            )}
          </div>

          <div className="pointer-events-none relative z-10 shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-6 sm:px-7">
            <div className="pointer-events-auto mx-auto w-full max-w-[52rem]">
              <ChatInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSubmit}
                placeholder={
                  isLoadingChatDetail
                    ? "Loading conversation..."
                    : isGenerating
                    ? "Generating answer..."
                    : "Ask about your China trip..."
                }
                disabled={
                  isLoadingChatDetail || Boolean(chatError) || isGenerating
                }
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
        <div
          className="fixed z-50 inline-flex -translate-x-1/2 -translate-y-[calc(100%+0.625rem)] items-center gap-2 rounded-full bg-[#172033] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#172033]/20"
          style={{
            left: toast.x,
            top: toast.y,
          }}
        >
          <Check className="h-4 w-4 text-emerald-300" />
          {toast.message}
        </div>
      ) : null}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  );
}
