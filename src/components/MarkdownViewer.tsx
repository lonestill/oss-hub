"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export function MarkdownViewer({
  content,
  repoFullName,
}: {
  content: string;
  repoFullName?: string;
}) {
  const [safeHtml, setSafeHtml] = useState<string>("");

  useEffect(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: false,
      });

      const rawHtml = marked.parse(content) as string;

      // Remove existing hook to avoid duplicate accumulation
      DOMPurify.removeAllHooks();

      // Hook to resolve relative links and images to GitHub absolute URLs
      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if (node.tagName === "A") {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
          const href = node.getAttribute("href");
          if (
            href &&
            !href.startsWith("#") &&
            !/^https?:\/\//i.test(href) &&
            !/^mailto:/i.test(href)
          ) {
            if (repoFullName) {
              const clean = href.replace(/^\.?\//, "");
              node.setAttribute(
                "href",
                `https://github.com/${repoFullName}/blob/HEAD/${clean}`
              );
            }
          }
        }

        if (node.tagName === "IMG") {
          const src = node.getAttribute("src");
          if (
            src &&
            !/^https?:\/\//i.test(src) &&
            !src.startsWith("//") &&
            !src.startsWith("data:")
          ) {
            if (repoFullName) {
              const clean = src.replace(/^\.?\//, "");
              node.setAttribute(
                "src",
                `https://raw.githubusercontent.com/${repoFullName}/HEAD/${clean}`
              );
            }
          }
        }
      });

      // Sanitize against XSS attacks and dangerous protocols (javascript:, data:, vbscript:)
      const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "h1", "h2", "h3", "h4", "h5", "h6",
          "p", "a", "img", "blockquote", "code", "pre",
          "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td",
          "b", "strong", "i", "em", "del", "s", "hr", "br", "span", "div",
          "details", "summary", "kbd", "sub", "sup"
        ],
        ALLOWED_ATTR: [
          "href", "src", "alt", "title", "class", "className", "align",
          "width", "height", "target", "rel", "id"
        ],
      });

      setSafeHtml(sanitized);
    } catch (err) {
      console.error("Markdown parse/sanitize error:", err);
      setSafeHtml("");
    }
  }, [content, repoFullName]);

  return (
    <article
      className="markdown-body"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
