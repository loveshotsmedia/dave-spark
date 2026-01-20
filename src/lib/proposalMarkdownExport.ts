import type { DiagramData } from "@/lib/api";

function fenceLanguage(format: DiagramData["format"]): string {
  switch (format) {
    case "mermaid":
      return "mermaid";
    case "svg":
      return "svg";
    case "html":
      return "html";
    case "chartjs":
      return "json";
    default:
      return "text";
  }
}

export function buildProposalMarkdownWithDiagrams(args: {
  title?: string;
  proposalMarkdown: string;
  diagrams?: DiagramData[];
}): string {
  const title = (args.title || "Proposal").trim();
  const proposal = (args.proposalMarkdown || "").trim();
  const diagrams = (args.diagrams || []).filter((d) => (d.content ?? "").trim());

  const parts: string[] = [];
  parts.push(`# ${title}`);
  parts.push("");
  parts.push(proposal);

  if (diagrams.length > 0) {
    parts.push("");
    parts.push("---");
    parts.push("");
    parts.push("## Diagrams");
    parts.push("");

    diagrams.forEach((d, idx) => {
      const heading = (d.title || d.type || `Diagram ${idx + 1}`).trim();
      const lang = fenceLanguage(d.format);

      parts.push(`### ${heading}`);
      parts.push("");
      parts.push("```" + lang);
      parts.push((d.content || "").trim());
      parts.push("```");
      parts.push("");
    });
  }

  return parts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
}

export function safeFilename(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}
