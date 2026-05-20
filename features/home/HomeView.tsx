"use client";

import {
  CarTaxiFront,
  Smartphone,
  TrainFront,
  Utensils,
  WalletCards,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChatInput } from "../../components/ChatInput";
import { LoginModal } from "../../components/LoginModal";
import { useState } from "react";

const classicQuestions = [
  {
    label: "Paying in China",
    question:
      "How can I pay in China with Alipay, WeChat Pay, or an international card?",
    Icon: WalletCards,
    colorClass: "text-blue-400",
  },
  {
    label: "Essential apps",
    question: "What apps should I download before traveling to China?",
    Icon: Smartphone,
    colorClass: "text-purple-400",
  },
  {
    label: "Internet & SIM",
    question:
      "How can I get mobile data, eSIM, VPN, or Wi-Fi access in China?",
    Icon: Wifi,
    colorClass: "text-emerald-400",
  },
  {
    label: "Taxi & Didi",
    question: "How do I take a taxi or use Didi in China as a foreigner?",
    Icon: CarTaxiFront,
    colorClass: "text-amber-400",
  },
  {
    label: "High-speed trains",
    question:
      "How can foreign tourists book and take high-speed trains in China?",
    Icon: TrainFront,
    colorClass: "text-red-400",
  },
  {
    label: "Ordering food",
    question: "How can I order food in China if I don’t speak Chinese?",
    Icon: Utensils,
    colorClass: "text-orange-400",
  },
];

export function HomeView() {
  const [question, setQuestion] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  function handleSubmit() {
    // Handle submission
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#14243a] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("/home-great-wall.png")',
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
        aria-hidden="true"
      />
      {/* Darkened gradient overlays for better contrast */}
      <div
        className="absolute inset-0 bg-black/20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-4 pb-[env(safe-area-inset-bottom,1rem)] sm:px-8 sm:py-6 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl text-white outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/50 sm:gap-3"
            aria-label="ChinaTrip AI home"
          >
            <Image
              src="/logo-img.png"
              alt="ChinaTrip AI logo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 shrink-0 rounded-full bg-white object-cover shadow-[0_0_15px_rgba(255,255,255,0.2)] sm:h-10 sm:w-10"
            />
            <span className="truncate text-xl font-medium tracking-tight text-white sm:text-[1.45rem] lg:text-[1.55rem]">
              ChinaTrip AI
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-3 sm:gap-4">
            {/* Language switcher hidden for now; default UI language is English.
            <div className="group relative flex">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 sm:gap-2 sm:px-4"
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
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="cursor-pointer rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 sm:px-5"
            >
              Log in
            </button>
          </nav>
        </header>

        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center pb-20 pt-10 text-center sm:pt-16 lg:-mt-8 lg:pb-24">
          <h1 className="max-w-5xl text-balance text-[2.5rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[4.45rem] lg:text-[5.5rem]">
            Your AI Travel Guide for China
          </h1>
          <p className="mt-4 max-w-3xl text-[0.95rem] font-normal leading-relaxed text-white/80 sm:mt-6 sm:text-xl sm:leading-8">
            Ask practical questions about China travel, payments, transport,
            apps, food, and local tips. Get answers you can save and share.
          </p>

          <ChatInput
            value={question}
            onChange={setQuestion}
            onSubmit={handleSubmit}
            className="mt-8 w-full max-w-[45rem] sm:mt-12 lg:max-w-[49rem]"
          />

          <div className="mt-6 flex w-full max-w-[72rem] flex-wrap items-center justify-center gap-2 sm:mt-10 sm:gap-4">
            {classicQuestions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setQuestion(item.question)}
                className="inline-flex h-10 max-w-full cursor-pointer items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3.5 text-[0.85rem] font-medium text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 sm:h-[44px] sm:gap-2.5 sm:px-5 sm:text-sm"
              >
                <item.Icon
                  className={`h-[16px] w-[16px] shrink-0 sm:h-[18px] sm:w-[18px] ${item.colorClass}`}
                  strokeWidth={2.5}
                />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
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
