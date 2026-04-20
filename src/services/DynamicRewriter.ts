import { analyzeAuthority, type AuthorityAnalysis } from "./AuthorityModel";

export interface RewriteSuggestion {
  start: number;
  end: number;
  original: string;
  replacement: string;
  reason: string;
}

export interface DynamicRewriteResult {
  rewrittenText: string;
  suggestions: RewriteSuggestion[];
  analysis: AuthorityAnalysis;
}

const DIRECT_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  reason: string;
}> = [
  {
    pattern: /\bI think\b/gi,
    replacement: "I recommend",
    reason: "Use direct recommendation language.",
  },
  {
    pattern: /\bjust\b/gi,
    replacement: "",
    reason: "Remove minimizing qualifier.",
  },
  {
    pattern: /\bmaybe\b/gi,
    replacement: "I propose",
    reason: "Replace uncertainty with a specific plan.",
  },
  {
    pattern: /\bperhaps\b/gi,
    replacement: "I recommend",
    reason: "Use direct recommendation language.",
  },
  {
    pattern: /\bdo it now\b/gi,
    replacement: "please complete this by EOD today",
    reason: "Keep urgency while remaining professional.",
  },
  {
    pattern: /\bASAP\b/g,
    replacement: "by EOD today",
    reason: "Set urgency with a concrete deadline.",
  },
  {
    pattern: /\bimmediately\b/gi,
    replacement: "as soon as practical today",
    reason: "Soften aggressive urgency while preserving action framing.",
  },
];

function collapseWhitespace(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

export function rewriteForAuthority(draft: string): DynamicRewriteResult {
  const analysis = analyzeAuthority(draft);
  const suggestions: RewriteSuggestion[] = [];
  let rewrittenText = draft;

  for (const item of DIRECT_REPLACEMENTS) {
    item.pattern.lastIndex = 0;
    let match = item.pattern.exec(rewrittenText);
    while (match) {
      const replacement =
        typeof item.replacement === "function" ? item.replacement(match[0]) : item.replacement;
      suggestions.push({
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replacement,
        reason: item.reason,
      });
      match = item.pattern.exec(rewrittenText);
    }
    rewrittenText = rewrittenText.replace(item.pattern, (_, ...args: unknown[]) => {
      const whole = String(args[args.length - 2] ?? "");
      const matchText = typeof whole === "string" && whole.length > 0 ? whole : "";
      if (typeof item.replacement === "function") {
        return item.replacement(matchText);
      }
      return item.replacement;
    });
  }

  rewrittenText = collapseWhitespace(rewrittenText);
  if (rewrittenText.length > 0 && !/[.!?]$/.test(rewrittenText)) {
    rewrittenText += ".";
  }

  return { rewrittenText, suggestions, analysis };
}

export function suggestAuthorityRewrites(draft: string): RewriteSuggestion[] {
  return rewriteForAuthority(draft).suggestions;
}

