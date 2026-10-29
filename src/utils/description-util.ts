const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "strong",
  "u",
  "ul",
]);

export const DescriptionBuilder = {
  build: (
    description: string | null | undefined,
    imageUrls: readonly string[],
  ): string => {
    const formattedDescription = formatDescription(description);
    const images = imageUrls
      .filter(Boolean)
      .map(
        (url, index) =>
          `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Image ${index + 1}</a></li>`,
      );
    const imageSection = images.length
      ? `<hr><p><strong>Images</strong></p><ul>${images.join("")}</ul>`
      : "";

    return [formattedDescription, imageSection].filter(Boolean).join("\n");
  },
};

function formatDescription(description: string | null | undefined): string {
  const text = description?.trim().replace(/\r\n?/g, "\n");
  if (!text) return "";

  if (/<\/?[a-z][^>]*>/i.test(text)) {
    return sanitizeHtml(text).replace(/\n/g, "<br>");
  }

  return text
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p>${paragraph.split("\n").map(linkifyText).join("<br>")}</p>`,
    )
    .join("");
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|object|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<\/?([a-z][\w:-]*)\b([^>]*)>/gi,
      (tag, name: string, attrs: string) => {
        const tagName = name.toLowerCase();
        if (!ALLOWED_TAGS.has(tagName)) return "";
        if (tagName === "br") return "<br>";
        if (tagName !== "a" || tag.startsWith("</")) {
          return tag.startsWith("</") ? `</${tagName}>` : `<${tagName}>`;
        }

        const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
          attrs,
        );
        const url = href?.[1] ?? href?.[2] ?? href?.[3];
        if (!url || !/^(https?:\/\/|mailto:)/i.test(url)) return "<a>";

        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">`;
      },
    );
}

function linkifyText(text: string): string {
  return text
    .split(/(https?:\/\/[^\s<>]+)/gi)
    .map((part) => {
      if (!/^https?:\/\//i.test(part)) return escapeHtml(part);

      const trailing = /[.,!?;:)\]}]+$/.exec(part)?.[0] ?? "";
      const url = trailing ? part.slice(0, -trailing.length) : part;
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>${escapeHtml(trailing)}`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}
