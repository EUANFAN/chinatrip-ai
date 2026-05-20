"use client";

import { ChatInput } from "@/components/ChatInput";
import { LoginModal } from "@/components/LoginModal";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronDown,
  CirclePlus,
  Clock3,
  History,
  LogOut,
  Menu,
  MoreHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const chatHistory = [
  {
    id: "beijing-xian",
    title: "Planning trip to Beijing & Xi'an",
    preview: "Visa requirements and a 10-day itinerary...",
    active: true,
  },
  {
    id: "alipay-tourcard",
    title: "Setting up Alipay",
    preview: "How can I pay in China with a foreign card?",
  },
  {
    id: "train-booking",
    title: "High-speed train booking",
    preview: "Can foreign tourists book trains online?",
  },
  {
    id: "translation-apps",
    title: "Translation apps",
    preview: "Which apps work best for signs and menus?",
  },
  {
    id: "local-food",
    title: "Local food tips",
    preview: "What should I order if I do not speak Chinese?",
  },
];

const promptChips = [
  "Show me the 10-day itinerary",
  "How to set up Alipay?",
  "Do I need a VPN?",
];

function UserAvatar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_30%,#f3c6a3_0_22%,#1f2937_23%_36%,#111827_37%_100%)] ring-2 ring-white shadow-sm ${className}`}
    >
      <div className="mt-[18px] h-5 w-full bg-gradient-to-b from-[#1f2937] to-black" />
    </div>
  );
}

function BotBadge() {
  return (
    <div className="hidden h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm sm:flex">
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
  onSelectChat,
  onClose,
  onOpenLogin,
}: {
  onSelectChat?: () => void;
  onClose?: () => void;
  onOpenLogin: () => void;
}) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <aside className="flex h-full w-[17.125rem] max-w-[86vw] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-950">
      <div className="flex h-[4.25rem] shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="ChinaTrip AI home"
        >
          <Image
            src="/logo-img.png"
            alt="ChinaTrip AI logo"
            width={40}
            height={40}
            priority
            className="h-9 w-9 shrink-0 rounded-full bg-white object-cover shadow-sm ring-1 ring-slate-200"
          />
          <span className="truncate text-xl font-semibold tracking-tight">
            ChinaTrip AI
          </span>
        </Link>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-400 lg:hidden"
            aria-label="Close chat history"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 px-4 py-5">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between rounded-xl bg-[rgba(104,52,0,0.88)] px-4 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-[rgba(86,40,0,0.96)] focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <span className="inline-flex items-center gap-2">
            <CirclePlus className="h-4.5 w-4.5" />
            New Chat
          </span>
          <ChevronDown className="h-4 w-4 text-white/55" />
        </button>

        <nav className="mt-5 max-h-[calc(100dvh-15rem)] space-y-1 overflow-y-auto pr-1">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={onSelectChat}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:ring-2 focus-visible:ring-slate-400 ${
                chat.active ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <History
                className={`h-4.5 w-4.5 shrink-0 ${
                  chat.active ? "text-slate-950" : "text-slate-400"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-medium ${
                    chat.active ? "text-slate-950" : "text-slate-700"
                  }`}
                >
                  {chat.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {chat.preview}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="relative z-30 shrink-0 border-t border-slate-100 px-5 py-4">
        {isAccountMenuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsAccountMenuOpen(false)}
              aria-label="Close account menu"
            />
            <div className="absolute bottom-[4.4rem] right-5 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
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
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl text-left transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <UserAvatar />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">
                Guest User
              </p>
              <p className="truncate text-xs text-slate-500">Sign in to save</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((value) => !value)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-400"
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

function AiAnswerCard() {
  return (
    <div className="flex items-start gap-4">
      <BotBadge />
      <article className="w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-5 text-[0.94rem] leading-7 text-slate-700 shadow-sm sm:p-7">
        <p>
          Absolutely! A 10-day trip to Beijing and Xi&apos;an is a fantastic
          introduction to China&apos;s rich history. Here is a breakdown of what
          you need to know:
        </p>

        <section className="mt-6">
          <h3 className="flex items-center gap-3 text-sm font-bold text-slate-950">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Visa Requirements (US Citizen)
          </h3>
          <p className="mt-4">
            Yes, as a US citizen, you{" "}
            <strong className="font-bold text-slate-950">
              will need an L Visa (Tourist Visa)
            </strong>{" "}
            before you travel. China currently does not offer visa-free entry
            for US citizens for general tourism.
          </p>
          <ul className="mt-4 list-disc space-y-1.5 pl-6 text-slate-600">
            <li>
              You must apply at the Chinese Embassy or Consulate that holds
              jurisdiction over your state.
            </li>
            <li>
              Required documents usually include your passport, a completed
              application form, passport photo, and proof of itinerary.
            </li>
          </ul>

          <div className="mt-5 flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                Processing Time Alert
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Visa processing can take 1-2 weeks. Since your trip is next
                month, it&apos;s highly recommended to start immediately.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="flex items-center gap-3 text-sm font-bold text-slate-950">
            <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
            Payments in China
          </h3>
          <p className="mt-4">
            China is largely a cashless society. While some large hotels accept
            international credit cards, mobile payments are essential for
            day-to-day purchases.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-slate-700">
              Alipay (TourCard)
            </span>
            <span className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-slate-700">
              WeChat Pay
            </span>
          </div>
          <p className="mt-4 text-sm leading-5 text-slate-500">
            Both apps now allow foreign visitors to link international
            Visa/Mastercard credit cards. Download and set these up before you
            arrive.
          </p>
        </section>
      </article>
    </div>
  );
}

function ItineraryPreviewCard() {
  return (
    <div className="flex items-start gap-4">
      <BotBadge />
      <article className="w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-5 text-[0.94rem] leading-7 text-slate-700 shadow-sm sm:p-7">
        <p>
          Here is a balanced 10-day itinerary focusing on the highlights of
          Beijing and Xi&apos;an:
        </p>
        <div className="mt-5 grid grid-cols-[3.8rem_1fr] gap-4">
          <p className="text-sm font-semibold leading-5 text-slate-400">
            Days 1-4
          </p>
          <div>
            <p className="font-bold text-slate-950">Beijing (The Capital)</p>
            <p className="mt-1 text-slate-500">
              Explore the Forbidden City, Temple of Heaven, Summer Palace, and
              take a day trip to the Great Wall.
            </p>
          </div>
          <p className="text-sm font-semibold leading-5 text-slate-400">
            Day 5
          </p>
          <div>
            <p className="font-bold text-slate-950">High-Speed Train</p>
            <p className="mt-1 text-slate-500">
              Travel from Beijing to Xi&apos;an and settle into the old city.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

export function ChatView() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit() {
    setMessage("");
  }

  return (
    <main className="h-dvh overflow-hidden bg-slate-50 text-slate-950">
      <div className="flex h-full">
        <div className="hidden lg:block">
          <Sidebar onOpenLogin={() => setIsLoginModalOpen(true)} />
        </div>

        {isDrawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/45"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close chat history overlay"
            />
            <div className="relative h-full">
              <Sidebar
                onSelectChat={() => setIsDrawerOpen(false)}
                onClose={() => setIsDrawerOpen(false)}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            </div>
          </div>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[4.25rem] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-400 lg:hidden"
                aria-label="Open chat history"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">
                  Planning trip to Beijing &amp; Xi&apos;an
                </h1>
                <p className="truncate text-sm text-slate-500">
                  AI Assistant • Powered by Tourism Data
                </p>
              </div>
            </div>

            {/* Language switcher hidden for now; default UI language is English.
            <div className="group relative flex shrink-0">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[rgba(104,52,0,0.88)] px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-[rgba(86,40,0,0.96)] focus-visible:ring-2 focus-visible:ring-slate-400 sm:gap-2 sm:px-4"
                aria-label="Language selector"
              >
                <Globe2 className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="hidden sm:inline-block">English</span>
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2.5 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                Currently English only
              </div>
            </div>
            */}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-44 pt-12 sm:px-7 sm:pt-16">
            <div className="mx-auto w-full max-w-[52rem] space-y-8">
              <div className="flex items-start justify-end gap-0 sm:gap-4">
                <div className="max-w-[42rem] rounded-2xl rounded-tr-sm bg-[rgba(104,52,0,0.88)] px-4 py-3 text-[0.94rem] leading-7 text-white shadow-sm sm:px-6 sm:py-4">
                  I&apos;m planning a 10-day trip to China next month. I want to
                  visit Beijing and Xi&apos;an. Can you help me understand the
                  visa requirements for a US citizen and suggest a basic
                  itinerary? Also, how do I pay for things there?
                </div>
                <UserAvatar className="hidden sm:block" />
              </div>

              <AiAnswerCard />

              <div className="pl-0 sm:pl-[3.25rem]">
                <div className="flex flex-wrap gap-2">
                  {promptChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start justify-end gap-0 sm:gap-4">
                <div className="max-w-[22rem] rounded-2xl rounded-tr-sm bg-[rgba(104,52,0,0.88)] px-4 py-3 text-[0.94rem] leading-6 text-white shadow-sm sm:px-5 sm:py-3.5">
                  Please show me the 10-day itinerary.
                </div>
                <UserAvatar className="hidden sm:block" />
              </div>

              <ItineraryPreviewCard />
            </div>
          </div>

          <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white to-white/70 px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-6 sm:px-7 lg:left-[17.125rem]">
            <div className="pointer-events-auto mx-auto w-full max-w-[52rem]">
              <ChatInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSubmit}
                placeholder="Ask about your China trip..."
              />

              <p className="mt-4 text-center text-xs text-slate-400">
                AI can make mistakes. Verify important visa and travel
                advisories.
              </p>
            </div>
          </div>
        </section>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  );
}
