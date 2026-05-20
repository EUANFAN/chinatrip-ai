"use client";

import { Mail, X } from "lucide-react";
import Image from "next/image";
import { MouseEvent } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) {
    return null;
  }

  function handleDialogClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 px-4 py-6 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[30rem] overflow-y-auto rounded-[1.35rem] border border-slate-200/80 bg-white px-5 pb-7 pt-12 text-center text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.30)] sm:px-10 sm:pb-9 sm:pt-11"
        onClick={handleDialogClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label="Close login modal"
        >
          <X className="h-6 w-6" strokeWidth={2.2} />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_4px_18px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/80">
          <Image
            src="/logo-img.png"
            alt="ChinaTrip AI logo"
            width={58}
            height={58}
            priority
            className="h-[58px] w-[58px] rounded-full object-cover"
          />
        </div>

        <h2
          id="login-modal-title"
          className="mt-6 text-[1.35rem] font-bold leading-8 tracking-normal text-slate-950 sm:text-[1.45rem]"
        >
          Welcome to ChinaTrip AI
        </h2>
        <p className="mt-3 text-[0.92rem] leading-6 text-slate-600 sm:text-[0.95rem]">
          Log in to save your chats and personalize your travel guide.
        </p>

        <button
          type="button"
          className="mt-7 flex h-[3.55rem] w-full items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white px-4 text-[1.08rem] font-medium text-slate-950 shadow-[0_3px_14px_rgba(15,23,42,0.10)] transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <span className="text-[1.45rem] font-bold leading-none">
            <span className="text-[#4285f4]">G</span>
          </span>
          <span className="truncate">Continue with Google</span>
        </button>

        <div className="my-7 flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          disabled
          className="flex h-[3.55rem] w-full cursor-not-allowed items-center justify-center gap-4 rounded-xl bg-[#f1f5ff] px-4 text-[1.08rem] font-medium text-[#1359b7] opacity-90"
          aria-disabled="true"
        >
          <Mail className="h-5 w-5 shrink-0 text-[#2c8df2]" strokeWidth={2.2} />
          <span className="truncate">Continue with Email</span>
        </button>

        <p className="mt-7 text-xs leading-5 text-slate-500 sm:text-[0.8rem]">
          By continuing, you agree to our{" "}
          <a
            href="#"
            className="font-medium text-[#0b66f0] transition hover:text-[#084db5]"
          >
            Terms of Use
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="font-medium text-[#0b66f0] transition hover:text-[#084db5]"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
