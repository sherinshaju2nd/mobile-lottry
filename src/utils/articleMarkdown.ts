/**
 * Tiny, dependency-free Markdown parser for admin-written articles.
 * Produces a plain AST that the web (React DOM) and mobile (React Native) renderers turn
 * into elements — no HTML strings, so article content can never inject markup/scripts (XSS).
 *
 * Supported: # / ## / ### headings, paragraphs, **bold**, *italic*, `code`, [links](url),
 * ![images](url "caption"), - / * / 1. lists, > quotes, > [!TIP] / [!WARNING] callouts,
 * --- dividers, ``` code blocks and simple | pipe | tables |.
 *
 * Mirror of frontend/lib/articleMarkdown.ts (separate package) — keep the two in sync.
 */

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: InlineNode[] };

export type CalloutTone = "tip" | "warning" | "info";

export type BlockNode =
  | { type: "heading"; level: 2 | 3 | 4; id: string; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "quote"; children: InlineNode[] }
  | { type: "callout"; tone: CalloutTone; children: InlineNode[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "code"; text: string }
  | { type: "table"; header: InlineNode[][]; rows: InlineNode[][][] }
  | { type: "divider" };

/** Allows https/http, mailto:, tel: and site-relative links only. */
export const sanitizeHref = (raw: string): string | null => {
  const href = raw.trim();
  if (/^\/(?!\/)/.test(href) || href.startsWith("#")) return href;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  return null;
};

/** Images: https or site-relative only. */
export const sanitizeImageSrc = (raw: string): string | null => {
  const src = raw.trim();
  if (/^https:\/\//i.test(src) || /^\/(?!\/)/.test(src)) return src;
  return null;
};

export const headingId = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "section";

const INLINE_PATTERN =
  /(\*\*([^*]+?)\*\*)|(__([^_]+?)__)|(`([^`]+?)`)|(\[([^\]]+?)\]\(([^)\s]+)\))|(\*([^*\s][^*]*?)\*)|(_([^_\s][^_]*?)_)/;

export const parseInline = (input: string): InlineNode[] => {
  const nodes: InlineNode[] = [];
  let rest = input;

  while (rest.length > 0) {
    const match = INLINE_PATTERN.exec(rest);
    if (!match) {
      nodes.push({ type: "text", text: rest });
      break;
    }
    if (match.index > 0) nodes.push({ type: "text", text: rest.slice(0, match.index) });

    const [whole] = match;
    if (match[2] ?? match[4]) {
      nodes.push({ type: "bold", children: parseInline(match[2] ?? match[4]) });
    } else if (match[6] !== undefined) {
      nodes.push({ type: "code", text: match[6] });
    } else if (match[8] !== undefined) {
      const href = sanitizeHref(match[9] ?? "");
      const children = parseInline(match[8]);
      nodes.push(href ? { type: "link", href, children } : { type: "text", text: match[8] });
    } else if (match[11] ?? match[13]) {
      nodes.push({ type: "italic", children: parseInline(match[11] ?? match[13]) });
    } else {
      nodes.push({ type: "text", text: whole });
    }
    rest = rest.slice(match.index + whole.length);
  }

  return nodes;
};

export const inlineToText = (nodes: InlineNode[]): string =>
  nodes
    .map((node) => {
      if (node.type === "text" || node.type === "code") return node.text;
      return inlineToText(node.children);
    })
    .join("");

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const TABLE_DIVIDER = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;

const splitTableRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const isBlockStart = (line: string): boolean =>
  /^(#{1,6}\s|>|```|---+$|\*\*\*+$)/.test(line.trim()) ||
  LIST_ITEM.test(line) ||
  IMAGE_LINE.test(line.trim()) ||
  line.trim().startsWith("|");

export const parseMarkdown = (markdown: string): BlockNode[] => {
  const lines = (markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;

  const uniqueId = (text: string): string => {
    const base = headingId(text);
    const seen = usedIds.get(base) ?? 0;
    usedIds.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code
    if (trimmed.startsWith("```")) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    // Divider
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i += 1;
      continue;
    }

    // Heading: # and ## → h2 (the page title is the only h1), ### → h3, #### and deeper → h4
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length)) as 2 | 3 | 4;
      const children = parseInline(heading[2].replace(/#+$/, "").trim());
      blocks.push({ type: "heading", level, id: uniqueId(inlineToText(children)), children });
      i += 1;
      continue;
    }

    // Image
    const image = IMAGE_LINE.exec(trimmed);
    if (image) {
      const src = sanitizeImageSrc(image[2]);
      if (src) blocks.push({ type: "image", src, alt: image[1], caption: image[3] || undefined });
      i += 1;
      continue;
    }

    // Quote / callout
    if (trimmed.startsWith(">")) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        body.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      const callout = /^\[!(TIP|NOTE|INFO|WARNING|IMPORTANT)\]\s*/i.exec(body[0] ?? "");
      if (callout) {
        const kind = callout[1].toUpperCase();
        const tone: CalloutTone = kind === "TIP" ? "tip" : kind === "WARNING" || kind === "IMPORTANT" ? "warning" : "info";
        const text = [body[0].slice(callout[0].length), ...body.slice(1)].join(" ").trim();
        blocks.push({ type: "callout", tone, children: parseInline(text) });
      } else {
        blocks.push({ type: "quote", children: parseInline(body.join(" ")) });
      }
      continue;
    }

    // Table
    if (trimmed.startsWith("|") && TABLE_DIVIDER.test(lines[i + 1]?.trim() ?? "")) {
      const header = splitTableRow(trimmed).map(parseInline);
      i += 2;
      const rows: InlineNode[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]).map(parseInline));
        i += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // List
    const firstItem = LIST_ITEM.exec(line);
    if (firstItem) {
      const ordered = /\d/.test(firstItem[2]);
      const items: InlineNode[][] = [];
      while (i < lines.length) {
        const item = LIST_ITEM.exec(lines[i]);
        if (!item || /\d/.test(item[2]) !== ordered) break;
        items.push(parseInline(item[3]));
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // Paragraph: join consecutive plain lines
    const body: string[] = [trimmed];
    i += 1;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      body.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", children: parseInline(body.join(" ")) });
  }

  return blocks;
};

/** Table of contents from h2/h3 headings. */
export const extractToc = (blocks: BlockNode[]): { id: string; text: string; level: 2 | 3 | 4 }[] =>
  blocks.flatMap((block) =>
    block.type === "heading" && block.level <= 3
      ? [{ id: block.id, text: inlineToText(block.children), level: block.level }]
      : [],
  );
