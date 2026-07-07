import type { ReactNode } from "react";

type MarkdownTextProps = {
  content: string;
};

type InlineMatch = {
  type: "code" | "link" | "bold" | "italic";
  index: number;
  length: number;
  text: string;
  href?: string;
};

function findNextInlineMatch(text: string): InlineMatch | null {
  const patterns: Array<{
    type: InlineMatch["type"];
    regex: RegExp;
    pick: (match: RegExpExecArray) => Omit<InlineMatch, "type" | "index" | "length">;
  }> = [
    {
      type: "code",
      regex: /`([^`]+)`/,
      pick: (match) => ({ text: match[1] })
    },
    {
      type: "link",
      regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/,
      pick: (match) => ({ text: match[1], href: match[2] })
    },
    {
      type: "bold",
      regex: /\*\*([^*]+)\*\*|__([^_]+)__/, 
      pick: (match) => ({ text: match[1] ?? match[2] })
    },
    {
      type: "italic",
      regex: /\*([^*]+)\*|_([^_]+)_/,
      pick: (match) => ({ text: match[1] ?? match[2] })
    }
  ];

  let best: InlineMatch | null = null;

  for (const pattern of patterns) {
    const match = pattern.regex.exec(text);
    if (!match) continue;

    const candidate: InlineMatch = {
      type: pattern.type,
      index: match.index,
      length: match[0].length,
      ...pattern.pick(match)
    };

    if (!best || candidate.index < best.index) {
      best = candidate;
    }
  }

  return best;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let index = 0;

  while (rest.length > 0) {
    const match = findNextInlineMatch(rest);

    if (!match) {
      nodes.push(rest);
      break;
    }

    if (match.index > 0) {
      nodes.push(rest.slice(0, match.index));
    }

    const key = `${keyPrefix}-${index}`;

    if (match.type === "code") {
      nodes.push(<code key={key}>{match.text}</code>);
    }

    if (match.type === "link") {
      nodes.push(
        <a key={key} href={match.href} target="_blank" rel="noreferrer">
          {match.text}
        </a>
      );
    }

    if (match.type === "bold") {
      nodes.push(<strong key={key}>{renderInline(match.text, `${key}-bold`)}</strong>);
    }

    if (match.type === "italic") {
      nodes.push(<em key={key}>{renderInline(match.text, `${key}-italic`)}</em>);
    }

    rest = rest.slice(match.index + match.length);
    index += 1;
  }

  return nodes;
}

function renderParagraph(lines: string[], key: string) {
  return (
    <p key={key}>
      {lines.map((line, index) => (
        <span key={`${key}-line-${index}`}>
          {index > 0 && <br />}
          {renderInline(line, `${key}-inline-${index}`)}
        </span>
      ))}
    </p>
  );
}

export function MarkdownText({ content }: MarkdownTextProps) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push(renderParagraph(paragraph, `paragraph-${blocks.length}`));
    paragraph = [];
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {listItems.map((item, index) => (
            <li key={`ul-${blocks.length}-${index}`}>{renderInline(item, `ul-${blocks.length}-${index}`)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }

    if (orderedItems.length > 0) {
      blocks.push(
        <ol key={`ol-${blocks.length}`}>
          {orderedItems.map((item, index) => (
            <li key={`ol-${blocks.length}-${index}`}>{renderInline(item, `ol-${blocks.length}-${index}`)}</li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line.trim());
    if (unordered) {
      flushParagraph();
      orderedItems = [];
      listItems.push(unordered[1]);
      return;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line.trim());
    if (ordered) {
      flushParagraph();
      listItems = [];
      orderedItems.push(ordered[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div className="markdown-text">{blocks}</div>;
}
