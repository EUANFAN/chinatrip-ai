type AnswerSection = {
  title: string | null;
  blocks: AnswerBlock[];
};

type NumberedGroupItem = {
  title: string;
  body: string[];
};

type AnswerBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "subheading"; title: string }
  | { type: "minorHeading"; title: string }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] }
  | { type: "numberedGroup"; items: NumberedGroupItem[] }
  | { type: "table"; headers: string[]; rows: string[][] };

type SectionTone = {
  label: string;
  title: string;
  marker: string;
  line: string;
  number: string;
  numberRing: string;
  softBg: string;
  border: string;
};

const SECTION_TONES: Record<string, SectionTone> = {
  direct: {
    label: "Direct Answer",
    title: "text-[#8A552B]",
    marker: "bg-[#D49A52]",
    line: "from-[#D49A52]/45",
    number: "text-[#8A552B]",
    numberRing: "border-[#E6D8C7] bg-[#FFF8EF]",
    softBg: "bg-[#FFF8EF]/55",
    border: "border-[#E6D8C7]/70",
  },
  steps: {
    label: "Practical Steps",
    title: "text-sky-700",
    marker: "bg-sky-500",
    line: "from-sky-300/70",
    number: "text-sky-700",
    numberRing: "border-sky-100 bg-sky-50",
    softBg: "bg-sky-50/55",
    border: "border-sky-100",
  },
  watch: {
    label: "Watch Outs",
    title: "text-amber-700",
    marker: "bg-amber-500",
    line: "from-amber-300/80",
    number: "text-amber-700",
    numberRing: "border-amber-100 bg-amber-50",
    softBg: "bg-amber-50/60",
    border: "border-amber-100",
  },
  phrases: {
    label: "Useful Phrases",
    title: "text-emerald-700",
    marker: "bg-emerald-500",
    line: "from-emerald-300/75",
    number: "text-emerald-700",
    numberRing: "border-emerald-100 bg-emerald-50",
    softBg: "bg-emerald-50/55",
    border: "border-emerald-100",
  },
  summary: {
    label: "Quick Summary",
    title: "text-indigo-700",
    marker: "bg-indigo-500",
    line: "from-indigo-300/75",
    number: "text-indigo-700",
    numberRing: "border-indigo-100 bg-indigo-50",
    softBg: "bg-indigo-50/55",
    border: "border-indigo-100",
  },
  general: {
    label: "",
    title: "text-[#8A552B]",
    marker: "bg-[#8A552B]",
    line: "from-[#E6D8C7]",
    number: "text-[#8A552B]",
    numberRing: "border-[#E6D8C7] bg-[#FFF8EF]",
    softBg: "bg-[#FFF8EF]/45",
    border: "border-[#E6D8C7]/65",
  },
};

function cleanInlineText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

function isTableLine(line: string) {
  return line.startsWith("|") && line.endsWith("|") && line.includes("|");
}

function isTableSeparatorLine(line: string) {
  if (!isTableLine(line)) {
    return false;
  }

  return line
    .split("|")
    .slice(1, -1)
    .every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseTableCells(line: string) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cleanInlineText(cell));
}

function getSectionKey(title: string | null) {
  const normalized = (title ?? "").toLowerCase();

  if (normalized.includes("direct")) {
    return "direct";
  }

  if (
    normalized.includes("step") ||
    normalized.includes("itinerary") ||
    normalized.includes("plan") ||
    normalized.includes("route")
  ) {
    return "steps";
  }

  if (
    normalized.includes("watch") ||
    normalized.includes("warning") ||
    normalized.includes("note") ||
    normalized.includes("careful") ||
    normalized.includes("must handle") ||
    normalized.includes("foreign visitor") ||
    normalized.includes("backup") ||
    normalized.includes("fail")
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
  let numberedGroup: NumberedGroupItem[] = [];
  let table:
    | {
        headers: string[];
        rows: string[][];
        hasSeparator: boolean;
      }
    | null = null;

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

  function flushNumberedGroup() {
    if (numberedGroup.length > 0) {
      if (
        numberedGroup.length === 1 &&
        numberedGroup[0].body.length === 0
      ) {
        ordered.push(numberedGroup[0].title);
      } else {
        blocks.push({ type: "numberedGroup", items: numberedGroup });
      }

      numberedGroup = [];
    }
  }

  function flushUnordered() {
    if (unordered.length > 0) {
      blocks.push({ type: "unordered", items: unordered });
      unordered = [];
    }
  }

  function flushTable() {
    if (table?.hasSeparator && table.headers.length > 0 && table.rows.length > 0) {
      blocks.push({
        type: "table",
        headers: table.headers,
        rows: table.rows,
      });
    } else if (table) {
      paragraph.push(
        ...[
          table.headers,
          ...table.rows,
        ].map((cells) => cells.join(" | ")),
      );
    }

    table = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushTable();
      flushNumberedGroup();
      flushOrdered();
      flushUnordered();
      flushParagraph();
      continue;
    }

    if (!line) {
      flushTable();
      flushUnordered();
      if (numberedGroup.length === 0) {
        flushOrdered();
        flushParagraph();
      }
      continue;
    }

    if (isTableLine(line)) {
      flushNumberedGroup();
      flushOrdered();
      flushUnordered();

      if (isTableSeparatorLine(line)) {
        if (table && table.headers.length > 0) {
          table.hasSeparator = true;
        }
        continue;
      }

      const cells = parseTableCells(line);

      if (!table) {
        flushParagraph();
        table = {
          headers: cells,
          rows: [],
          hasSeparator: false,
        };
      } else if (table.hasSeparator) {
        table.rows.push(cells);
      } else {
        table.rows.push(cells);
      }

      continue;
    }

    const minorHeadingMatch = line.match(/^####\s+(.+)$/);

    if (minorHeadingMatch) {
      flushTable();
      flushNumberedGroup();
      flushOrdered();
      flushUnordered();
      flushParagraph();
      blocks.push({
        type: "minorHeading",
        title: cleanInlineText(minorHeadingMatch[1]),
      });
      continue;
    }

    const subheadingMatch = line.match(/^###\s+(.+)$/);

    if (subheadingMatch) {
      flushTable();
      flushNumberedGroup();
      flushOrdered();
      flushUnordered();
      flushParagraph();
      blocks.push({
        type: "subheading",
        title: cleanInlineText(subheadingMatch[1]),
      });
      continue;
    }

    const orderedMatch = line.match(/^\d+[\.)]\s+(.+)$/);

    if (orderedMatch) {
      flushTable();
      flushParagraph();
      flushOrdered();
      flushUnordered();
      numberedGroup.push({
        title: cleanInlineText(orderedMatch[1]),
        body: [],
      });
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);

    if (unorderedMatch) {
      flushTable();
      flushNumberedGroup();
      flushParagraph();
      flushOrdered();
      unordered.push(cleanInlineText(unorderedMatch[1]));
      continue;
    }

    flushTable();
    flushUnordered();
    if (numberedGroup.length > 0) {
      numberedGroup[numberedGroup.length - 1].body.push(cleanInlineText(line));
      continue;
    }

    flushOrdered();
    paragraph.push(cleanInlineText(line));
  }

  flushTable();
  flushNumberedGroup();
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
    const headingMatch = rawLine.match(/^##\s+(.+)$/);

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

function NumberedBadge({
  index,
  tone,
}: {
  index: number;
  tone: SectionTone;
}) {
  return (
    <span
      className={`relative z-10 mt-0.5 inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-extrabold shadow-[0_6px_14px_rgba(20,36,58,0.07),0_1px_0_rgba(255,255,255,0.95)_inset] ${tone.numberRing} ${tone.number}`}
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

function NumberedGroupItemContent({
  item,
  showCursor,
}: {
  item: NumberedGroupItem;
  showCursor: boolean;
}) {
  const { title, body } = splitItemTitle(item.title);
  const bodyLines = title ? [body, ...item.body] : item.body;

  return (
    <div className="min-w-0 flex-1 space-y-3 pt-0.5 [overflow-wrap:anywhere]">
      <div className="break-words text-[1rem] font-extrabold leading-6 text-[#172033]">
        {title ?? item.title}
      </div>
      {bodyLines.length > 0 ? (
        <div className="max-w-[48rem] space-y-2.5">
          {bodyLines.map((line, index) => {
            const isLastLine = index === bodyLines.length - 1;

            return (
              <p
                key={`${line}-${index}`}
                className="break-words text-[0.95rem] leading-7 text-[#4C5B6C] [overflow-wrap:anywhere]"
              >
                {renderTextWithOptionalCursor(
                  line,
                  showCursor && isLastLine,
                )}
              </p>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AnswerTableView({
  headers,
  rows,
  tone,
  showCursor,
}: {
  headers: string[];
  rows: string[][];
  tone: SectionTone;
  showCursor: boolean;
}) {
  const normalizedRows = rows.map((row) =>
    headers.map((_, index) => row[index] ?? ""),
  );

  return (
    <div
      className={`overflow-hidden rounded-[0.9rem] border ${tone.border} ${tone.softBg} shadow-[0_12px_28px_rgba(20,36,58,0.045),0_1px_0_rgba(255,255,255,0.92)_inset]`}
    >
      <div
        className={`hidden border-b ${tone.border} bg-white/45 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] ${tone.title} sm:grid`}
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
        }}
      >
        {headers.map((header, index) => (
          <div
            key={`${header}-${index}`}
            className={`border-r ${tone.border} px-4 py-3 last:border-r-0`}
          >
            {header}
          </div>
        ))}
      </div>

      <div className="hidden divide-y divide-[#E6D8C7]/55 sm:block">
        {normalizedRows.map((row, rowIndex) => (
          <div
            key={`desktop-row-${rowIndex}`}
            className="grid bg-white/55"
            style={{
              gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell, cellIndex) => {
              const isLikelyChinesePhrase =
                /chinese|phrase/i.test(headers[cellIndex] ?? "") ||
                /[\u3400-\u9fff]/.test(cell);

              return (
                <div
                  key={`${cell}-${cellIndex}`}
                  className={`min-w-0 border-r ${tone.border} px-4 py-3 text-[0.92rem] leading-6 last:border-r-0 ${
                    isLikelyChinesePhrase
                      ? "font-semibold text-emerald-800"
                      : "text-[#314257]"
                  } [overflow-wrap:anywhere]`}
                >
                  {renderTextWithOptionalCursor(
                    cell,
                    showCursor &&
                      rowIndex === normalizedRows.length - 1 &&
                      cellIndex === row.length - 1,
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="divide-y divide-[#E6D8C7]/60 sm:hidden">
        {normalizedRows.map((row, rowIndex) => (
          <div
            key={`mobile-row-${rowIndex}`}
            className="space-y-3 bg-white/60 p-4"
          >
            {row.map((cell, cellIndex) => {
              const header = headers[cellIndex] ?? `Item ${cellIndex + 1}`;
              const isLikelyChinesePhrase =
                /chinese|phrase/i.test(header) || /[\u3400-\u9fff]/.test(cell);

              return (
                <div key={`${header}-${cellIndex}`} className="space-y-1">
                  <div
                    className={`text-[0.68rem] font-extrabold uppercase tracking-[0.12em] ${tone.title}`}
                  >
                    {header}
                  </div>
                  <div
                    className={`break-words text-[0.93rem] leading-6 ${
                      isLikelyChinesePhrase
                        ? "font-semibold text-emerald-800"
                        : "text-[#314257]"
                    } [overflow-wrap:anywhere]`}
                  >
                    {renderTextWithOptionalCursor(
                      cell,
                      showCursor &&
                        rowIndex === normalizedRows.length - 1 &&
                        cellIndex === row.length - 1,
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
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
  if (block.type === "subheading") {
    return (
      <div className="flex items-center gap-2 pt-1.5">
        <span
          className={`h-5 w-1 rounded-full ${tone.marker} shadow-[0_0_0_3px_rgba(255,255,255,0.75)]`}
          aria-hidden="true"
        />
        <h4
          className={`break-words text-[0.8rem] font-extrabold uppercase tracking-[0.12em] ${tone.title} [overflow-wrap:anywhere]`}
        >
          {renderTextWithOptionalCursor(block.title, showCursor && isLastBlock)}
        </h4>
      </div>
    );
  }

  if (block.type === "minorHeading") {
    return (
      <h5
        className={`break-words rounded-[0.7rem] border ${tone.border} ${tone.softBg} px-3 py-2 text-[0.9rem] font-bold leading-6 text-[#1F2F43] [overflow-wrap:anywhere]`}
      >
        {renderTextWithOptionalCursor(block.title, showCursor && isLastBlock)}
      </h5>
    );
  }

  if (block.type === "ordered" || block.type === "unordered") {
    return (
      <ol className="space-y-4">
        {block.items.map((item, index) => {
          const isLastItem = index === block.items.length - 1;

          return (
            <li key={`${item}-${index}`} className="relative flex gap-3.5">
              {!isLastItem ? (
                <span
                  className={`absolute left-[0.78125rem] top-8 h-[calc(100%-1rem)] w-px bg-gradient-to-b ${tone.line} to-transparent`}
                  aria-hidden="true"
                />
              ) : null}
              <NumberedBadge index={index} tone={tone} />
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

  if (block.type === "numberedGroup") {
    return (
      <ol className="space-y-5">
        {block.items.map((item, index) => {
          const isLastItem = index === block.items.length - 1;

          return (
            <li key={`${item.title}-${index}`} className="relative flex gap-3.5">
              {!isLastItem ? (
                <span
                  className={`absolute left-[0.78125rem] top-8 h-[calc(100%-1rem)] w-px bg-gradient-to-b ${tone.line} to-transparent`}
                  aria-hidden="true"
                />
              ) : null}
              <NumberedBadge index={index} tone={tone} />
              <NumberedGroupItemContent
                item={item}
                showCursor={showCursor && isLastBlock && isLastItem}
              />
            </li>
          );
        })}
      </ol>
    );
  }

  if (block.type === "table") {
    return (
      <AnswerTableView
        headers={block.headers}
        rows={block.rows}
        tone={tone}
        showCursor={showCursor && isLastBlock}
      />
    );
  }

  return (
    <div className="max-w-[48rem] space-y-3.5">
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
            className={`relative space-y-4.5 ${
              sectionIndex === 0
                ? ""
                : "border-t border-[#E6D8C7]/60 pt-6"
            }`}
          >
            {sectionTitle ? (
              <div
                className={`flex items-center gap-3 rounded-[0.85rem] border ${tone.border} ${tone.softBg} px-3.5 py-2.5`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.marker} shadow-[0_0_0_4px_rgba(212,154,82,0.10)]`}
                />
                <h3
                  className={`min-w-0 break-words text-[0.72rem] font-extrabold uppercase tracking-[0.14em] ${tone.title} [overflow-wrap:anywhere]`}
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
