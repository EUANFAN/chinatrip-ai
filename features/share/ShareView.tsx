"use client";

import { ChatInput } from "@/components/ChatInput";
import {
  ChatMessage,
  DEFAULT_QUESTION,
  LAST_QUESTION_KEY,
  createInitialMockChat,
} from "@/features/chat/mock-chat";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

function getFirstCompletePair(messages: ChatMessage[]) {
  const question = messages.find((message) => message.role === "user");
  const answer = messages.find(
    (message) => message.role === "assistant" && message.status !== "loading",
  );

  return { question, answer };
}

function getRelatedPairs(messages: ChatMessage[], count = 2) {
  const pairs: Array<{ question: ChatMessage; answer: ChatMessage }> = [];

  for (let index = 0; index < messages.length - 1; index += 1) {
    const question = messages[index];
    const answer = messages[index + 1];

    if (
      question?.role === "user" &&
      answer?.role === "assistant" &&
      answer.status !== "loading"
    ) {
      pairs.push({ question, answer });
    }

    if (pairs.length >= count + 1) {
      break;
    }
  }

  return pairs.slice(1, count + 1);
}

function formatSharedDate(value?: string) {
  if (!value) {
    return "Shared travel answer";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function previewText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > 150 ? `${normalized.slice(0, 150)}...` : normalized;
}

export function ShareView() {
  const router = useRouter();
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [question, setQuestion] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const sharedChat = useMemo(
    () => createInitialMockChat(DEFAULT_QUESTION),
    [],
  );
  const { question: sharedQuestion, answer: sharedAnswer } = useMemo(
    () => getFirstCompletePair(sharedChat.messages),
    [sharedChat.messages],
  );
  const relatedPairs = useMemo(
    () => getRelatedPairs(sharedChat.messages, 2),
    [sharedChat.messages],
  );

  const sharedQuestionText = sharedQuestion?.content ?? DEFAULT_QUESTION;
  const sharedAnswerText =
    sharedAnswer?.content ??
    "ChinaTrip AI can help answer practical travel questions about payments, transport, food, apps, and trip planning.";

  function showToast(message: string) {
    setToast(message);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => setToast(null), 1800);
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(successMessage);
    } catch {
      showToast("Copy failed. Please try again.");
    }
  }

  function handleCopyAnswer() {
    void copyText(sharedAnswerText, "Answer copied");
  }

  function handleCopyLink() {
    void copyText(window.location.href, "Share link copied");
  }

  function handleSubmit() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    window.sessionStorage.setItem(LAST_QUESTION_KEY, trimmedQuestion);
    router.push("/chat/mock");
  }

  return (
    <main className="min-h-dvh bg-[#F8F5EF] bg-[linear-gradient(135deg,#F8F5EF_0%,#EEF4F6_52%,#F7F0E6_100%)] text-[#172033]">
      <header className="sticky top-0 z-30 border-b border-[#E6D8C7] bg-white/76 px-4 py-3 shadow-[0_8px_30px_rgba(20,36,58,0.04)] backdrop-blur-xl sm:px-7">
        <div className="mx-auto flex w-full max-w-[60rem] items-center justify-between gap-3">
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
            <span className="truncate text-lg font-semibold tracking-tight text-[#172033] sm:text-xl">
              ChinaTrip AI
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#8A552B,#14243A)] px-3 text-sm font-semibold text-[#FFF8EF] shadow-[0_10px_22px_rgba(20,36,58,0.10)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#D49A52]/45 sm:px-4"
          >
            <span className="hidden sm:inline">Ask your own question</span>
            <span className="sm:hidden">Ask</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[60rem] flex-col gap-8 px-4 py-8 sm:px-7 sm:py-12">
        <section className="rounded-[1.25rem] border border-[#E6D8C7] bg-[#FFFDF9] p-5 shadow-[0_18px_45px_rgba(20,36,58,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6D8C7]/70 pb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E6D8C7] bg-[#EEF4F6] px-3 py-1.5 text-sm font-medium text-[#8A552B]">
              <Share2 className="h-4 w-4" />
              Shared travel answer
            </div>
            <span className="text-sm text-[#756A60]">
              {formatSharedDate(sharedAnswer?.createdAt)}
            </span>
          </div>

          <div className="mt-7">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#9A8D80]">
              Question
            </p>
            <h1 className="mt-3 w-full rounded-[1.25rem] rounded-tr-sm bg-[linear-gradient(135deg,#8A552B,#14243A)] px-4 py-3 text-2xl font-bold leading-tight tracking-tight text-[#FFF8EF] shadow-[0_10px_22px_rgba(20,36,58,0.10)] sm:px-6 sm:py-4 sm:text-4xl">
              {sharedQuestionText}
            </h1>
          </div>

          <article className="mt-7 rounded-[1.25rem] rounded-tl-sm border border-[#E6D8C7] bg-white p-5 text-[0.94rem] leading-7 text-[#26384D] shadow-[0_18px_45px_rgba(20,36,58,0.06)] sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#E6D8C7]/70 pb-4">
              <Image
                src="/logo-img.png"
                alt="ChinaTrip AI"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full bg-[#FFFDF9] object-cover ring-1 ring-[#E6D8C7]"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#172033]">
                  ChinaTrip AI
                </p>
                <p className="truncate text-xs text-[#756A60]">
                  Practical guidance for China travel
                </p>
              </div>
            </div>
            <div className="mt-5 whitespace-pre-line">{sharedAnswerText}</div>
          </article>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyAnswer}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E6D8C7] bg-[#FFFDF9] px-3 text-sm font-medium text-[#6F6258] transition hover:bg-[#F3EEE7] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
            >
              <Copy className="h-4 w-4 text-amber-600" />
              Copy answer
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E6D8C7] bg-[#FFFDF9] px-3 text-sm font-medium text-[#6F6258] transition hover:bg-[#F3EEE7] hover:text-[#14243A] focus-visible:ring-2 focus-visible:ring-[#D49A52]/40"
            >
              <ExternalLink className="h-4 w-4 text-sky-600" />
              Copy link
            </button>
          </div>
        </section>

        {relatedPairs.length > 0 ? (
          <section aria-labelledby="related-questions">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#9A8D80]" />
              <h2
                id="related-questions"
                className="text-base font-semibold text-[#14243A]"
              >
                Related travel context
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPairs.map((pair) => (
                <article
                  key={pair.question.id}
                  className="rounded-xl border border-[#E6D8C7] bg-[#FFFDF9] p-4 shadow-[0_18px_45px_rgba(20,36,58,0.06)]"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-[#172033]">
                    {pair.question.content}
                  </h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#6F6258]">
                    {previewText(pair.answer.content)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.25rem] border border-[#E6D8C7] bg-[#FFFDF9] p-5 shadow-[0_18px_45px_rgba(20,36,58,0.06)] sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-[#14243A]">
              Ask your own China travel question
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#756A60]">
              Start a new chat with ChinaTrip AI and get practical answers for
              your itinerary, apps, payments, transport, and food.
            </p>
          </div>

          <ChatInput
            value={question}
            onChange={setQuestion}
            onSubmit={handleSubmit}
          />
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#172033] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#172033]/20">
          <Check className="h-4 w-4 text-emerald-300" />
          {toast}
        </div>
      ) : null}
    </main>
  );
}
