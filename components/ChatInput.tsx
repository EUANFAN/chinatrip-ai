"use client";

import { Pencil, Send } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask about your China trip...",
  className = "",
}: ChatInputProps) {
  const canSubmit = value.trim().length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight when text is deleted
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      setIsOverflowing(scrollHeight > 120);
    }
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSubmit) {
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/8">
        <Pencil
          className="mb-2.5 h-5 w-5 shrink-0 rotate-180 text-slate-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="relative mb-2 flex-1">
          {value.length === 0 && (
            <div className="pointer-events-none absolute left-0 top-0 text-[0.95rem] leading-6 text-slate-400">
              <span className="truncate">{placeholder}</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className={`block max-h-[120px] w-full resize-none bg-transparent py-0 text-[0.95rem] leading-6 text-slate-900 outline-none ${
              isOverflowing ? "overflow-y-auto" : "overflow-hidden"
            }`}
            aria-label={placeholder}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-slate-400 ${
            canSubmit
              ? "bg-[rgba(104,52,0,0.88)] text-white hover:bg-[rgba(86,40,0,0.96)]"
              : "cursor-not-allowed bg-[#0006] text-white"
          }`}
          aria-label="Send message"
        >
          <Send
            className="h-4.5 w-4.5 fill-current"
            strokeWidth={2.35}
          />
        </button>
      </div>
    </form>
  );
}
