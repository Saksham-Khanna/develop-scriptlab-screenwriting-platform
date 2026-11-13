export function formatDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", opts);
}

export function timeAgo(d: string | Date) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d, { month: "short", day: "numeric" });
}

export function dueLabel(d: string | Date | null | undefined) {
  if (!d) return "No deadline";
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export const roleHome: Record<string, string> = { student: "/dashboard", instructor: "/mentor", admin: "/admin" };

export const levelLabel: Record<string, string> = { beginner: "Foundation", intermediate: "Intermediate", advanced: "Advanced" };

/** Returns a thematic fallback cover image path based on category name. */
export function courseCoverFallback(categoryName: string): string {
  const n = categoryName.toLowerCase();
  if (n.includes("structure") || n.includes("three-act") || n.includes("five-act")) return "/images/course-structure.svg";
  if (n.includes("character")) return "/images/course-character.svg";
  if (n.includes("dialogue") || n.includes("scene")) return "/images/course-dialogue.svg";
  if (n.includes("break") || n.includes("story break")) return "/images/course-breaking.svg";
  if (n.includes("writers") || n.includes("room") || n.includes("collaboration")) return "/images/course-room.svg";
  if (n.includes("table read") || n.includes("critique")) return "/images/course-tableread.svg";
  if (n.includes("doctor") || n.includes("doctoring")) return "/images/course-doctoring.svg";
  if (n.includes("rewrite") || n.includes("roadmap")) return "/images/course-rewrite.svg";
  if (n.includes("tv") || n.includes("television") || n.includes("showrunner")) return "/images/course-tv.svg";
  if (n.includes("commercial") || n.includes("spec")) return "/images/course-commercial.svg";
  return "/images/hero.svg";
}

/** Minimal markdown renderer for lesson content (headings, lists, tables, blockquotes, bold/italic/code). */
export function renderMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("## ")) { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (line.startsWith("### ")) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (line.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(lines[i]); i++; }
      const cells = (r: string) => r.split("|").slice(1, -1).map((c) => c.trim());
      const header = cells(rows[0]);
      const body = rows.slice(2);
      out.push(`<table><thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${q.map(inline).join("\n")}</blockquote>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, "")); i++; }
      out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`);
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, "")); i++; }
      out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(## |### |\||>|\d+\.\s|[-*]\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(`<p>${para.map(inline).join("<br/>")}</p>`);
  }
  return out.join("\n");
}
