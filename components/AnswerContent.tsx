type AnswerSection = {
  title: string | null;
  blocks: AnswerBlock[];
};

type AnswerBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] };

type SectionTone = {
  label: string;
  title: string;
  marker: string;
  line: string;
  number: string;
  numberRing: string;
};

const SECTION_TONES: Record<string, SectionTone> = {
  direct: {
    label: "Direct Answer",
    title: "text-[#8A552B]",
    marker: "bg-[#D49A52]",
    line: "from-[#D49A52]/45",
    number: "text-[#8A552B]",
    numberRing: "border-[#E6D8C7] bg-[#FFF8EF]",
  },
  steps: {
    label: "Practical Steps",
    title: "text-sky-700",
    marker: "bg-sky-500",
    line: "from-sky-300/70",
    number: "text-sky-700",
    numberRing: "border-sky-100 bg-sky-50",
  },
  watch: {
    label: "Watch Outs",
    title: "text-amber-700",
    marker: "bg-amber-500",
    line: "from-amber-300/80",
    number: "text-amber-700",
    numberRing: "border-amber-100 bg-amber-50",
  },
  phrases: {
    label: "Useful Phrases",
    title: "text-emerald-700",
    marker: "bg-emerald-500",
    line: "from-emerald-300/75",
    number: "text-emerald-700",
    numberRing: "border-emerald-100 bg-emerald-50",
  },
  summary: {
    label: "Quick Summary",
    title: "text-indigo-700",
    marker: "bg-indigo-500",
    line: "from-indigo-300/75",
    number: "text-indigo-700",
    numberRing: "border-indigo-100 bg-indigo-50",
  },
  general: {
    label: "",
    title: "text-[#8A552B]",
    marker: "bg-[#8A552B]",
    line: "from-[#E6D8C7]",
    number: "text-[#8A552B]",
    numberRing: "border-[#E6D8C7] bg-[#FFF8EF]",
  },
};

function cleanInlineText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

function getSectionKey(title: string | null) {
  const normalized = (title ?? "").toLowerCase();

  if (normalized.includes("direct")) {
    return "direct";
  }

  if (
    normalized.includes("step") ||
    normalized.includes("itinerary") ||
    normalized.includes("plan")
  ) {
    return "steps";
  }

  if (
    normalized.includes("watch") ||
    normalized.includes("warning") ||
    normalized.includes("note") ||
    normalized.includes("careful")
  ) {
    return "watch";
  }

  if (normalized.includes("phrase") || normalized.includes("chinese")) {
    return "phrases";
  }

  if (normalized.includes("summary")) {
    return "summary";
  }

  return "general";
}

function parseBlocks(lines: string[]): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  let ordered: string[] = [];
  let unordered: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraph });
      paragraph = [];
    }
  }

  function flushOrdered() {
    if (ordered.length > 0) {
      blocks.push({ type: "ordered", items: ordered });
      ordered = [];
    }
  }

  function flushUnordered() {
    if (unordered.length > 0) {
      blocks.push({ type: "unordered", items: unordered });
      unordered = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushOrdered();
      flushUnordered();
      flushParagraph();
      continue;
    }

    const orderedMatch = line.match(/^\d+[\.)]\s+(.+)$/);

    if (orderedMatch) {
      flushParagraph();
      flushUnordered();
      ordered.push(cleanInlineText(orderedMatch[1]));
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);

    if (unorderedMatch) {
      flushParagraph();
      flushOrdered();
      unordered.push(cleanInlineText(unorderedMatch[1]));
      continue;
    }

    flushOrdered();
    flushUnordered();
    paragraph.push(cleanInlineText(line));
  }

  flushOrdered();
  flushUnordered();
  flushParagraph();

  return blocks;
}

function parseAnswerContent(content: string): AnswerSection[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const sections: Array<{ title: string | null; lines: string[] }> = [];
  let currentSection: { title: string | null; lines: string[] } = {
    title: null,
    lines: [],
  };

  for (const rawLine of lines) {
    const headingMatch = rawLine.match(/^#{2,3}\s+(.+)$/);

    if (headingMatch) {
      if (currentSection.title || currentSection.lines.some(Boolean)) {
        sections.push(currentSection);
      }

      currentSection = {
        title: cleanInlineText(headingMatch[1]),
        lines: [],
      };
      continue;
    }

    currentSection.lines.push(rawLine);
  }

  if (currentSection.title || currentSection.lines.some(Boolean)) {
    sections.push(currentSection);
  }

  return sections
    .map((section) => ({
      title: section.title,
      blocks: parseBlocks(section.lines),
    }))
    .filter((section) => section.blocks.length > 0);
}

function TypingCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[#8A552B]"
      aria-hidden="true"
    />
  );
}

function renderTextWithOptionalCursor(text: string, shouldShowCursor: boolean) {
  return (
    <>
      {text}
      {shouldShowCursor ? <TypingCursor /> : null}
    </>
  );
}

function splitItemTitle(item: string) {
  const separatorMatch = item.match(/^([^:：\n-]{2,48})(?:[:：]| - )\s+(.+)$/);

  if (!separatorMatch) {
    return {
      title: null,
      body: item,
    };
  }

  return {
    title: separatorMatch[1].trim(),
    body: separatorMatch[2].trim(),
  };
}

function NumberedItemContent({
  item,
  showCursor,
}: {
  item: string;
  showCursor: boolean;
}) {
  const { title, body } = splitItemTitle(item);

  if (!title) {
    return (
      <span className="block min-w-0 flex-1 break-words pt-0.5 leading-7 text-[#26384D] [overflow-wrap:anywhere]">
        {renderTextWithOptionalCursor(body, showCursor)}
      </span>
    );
  }

  return (
    <span className="block min-w-0 flex-1 space-y-1.5 pt-0.5 [overflow-wrap:anywhere]">
      <span className="block break-words text-[0.95rem] font-bold leading-6 text-[#172033]">
        {title}
      </span>
      <span className="block max-w-[45rem] break-words leading-7 text-[#4C5B6C]">
        {renderTextWithOptionalCursor(body, showCursor)}
      </span>
    </span>
  );
}

function AnswerBlockView({
  block,
  isLastBlock,
  showCursor,
  tone,
}: {
  block: AnswerBlock;
  isLastBlock: boolean;
  showCursor: boolean;
  tone: SectionTone;
}) {
  if (block.type === "ordered" || block.type === "unordered") {
    return (
      <ol className="space-y-4">
        {block.items.map((item, index) => {
          const isLastItem = index === block.items.length - 1;

          return (
            <li key={`${item}-${index}`} className="relative flex gap-3.5">
              {!isLastItem ? (
                <span
                  className={`absolute left-[0.8125rem] top-8 h-[calc(100%-1rem)] w-px bg-gradient-to-b ${tone.line} to-transparent`}
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold shadow-[0_7px_16px_rgba(20,36,58,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] ${tone.numberRing} ${tone.number}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <NumberedItemContent
                item={item}
                showCursor={showCursor && isLastBlock && isLastItem}
              />
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="max-w-[48rem] space-y-3">
      {block.lines.map((line, index) => {
        const isLastLine = index === block.lines.length - 1;

        return (
          <p
            key={`${line}-${index}`}
            className="break-words text-[0.96rem] leading-8 text-[#314257] [overflow-wrap:anywhere]"
          >
            {renderTextWithOptionalCursor(
              line,
              showCursor && isLastBlock && isLastLine,
            )}
          </p>
        );
      })}
    </div>
  );
}

export function AnswerContent({
  content,
  showCursor = false,
}: {
  content: string;
  showCursor?: boolean;
}) {
  const sections = parseAnswerContent(content);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-7 text-[#26384D]">
      {sections.map((section, sectionIndex) => {
        const sectionKey = getSectionKey(section.title);
        const tone = SECTION_TONES[sectionKey] ?? SECTION_TONES.general;
        const isLastSection = sectionIndex === sections.length - 1;
        const sectionTitle = section.title ?? tone.label;

        return (
          <section
            key={`${section.title ?? "answer"}-${sectionIndex}`}
            className={`relative space-y-4 ${
              sectionIndex === 0
                ? ""
                : "border-t border-[#E6D8C7]/60 pt-6"
            }`}
          >
            {sectionTitle ? (
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${tone.marker} shadow-[0_0_0_4px_rgba(212,154,82,0.10)]`}
                />
                <h3
                  className={`shrink-0 text-xs font-extrabold uppercase tracking-[0.14em] ${tone.title}`}
                >
                  {sectionTitle}
                </h3>
                <span
                  className={`h-px min-w-6 flex-1 bg-gradient-to-r ${tone.line} to-transparent`}
                  aria-hidden="true"
                />
              </div>
            ) : null}

            <div className="space-y-4">
              {section.blocks.map((block, blockIndex) => (
                <AnswerBlockView
                  key={`${block.type}-${blockIndex}`}
                  block={block}
                  isLastBlock={
                    isLastSection && blockIndex === section.blocks.length - 1
                  }
                  showCursor={showCursor}
                  tone={tone}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
