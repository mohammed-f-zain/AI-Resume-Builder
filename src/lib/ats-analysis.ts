import type { ATSAnalysis, ATSBreakdown } from "@/lib/types";

const WEIGHTS = {
  formatting: 25,
  keywords: 20,
  structure: 20,
  content: 25,
  readability: 10,
} as const;

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/**
 * Detect when the model echoed scoring *weights* (e.g. 25/20/20/25/10)
 * instead of per-category scores out of 100 (e.g. 90/75/85/80/80).
 */
export function breakdownLooksLikeWeights(b: ATSBreakdown): boolean {
  const vals = [
    b.formatting,
    b.keywords,
    b.structure,
    b.content,
    b.readability,
  ];
  if (vals.some((v) => !Number.isFinite(v))) return true;
  const max = Math.max(...vals);
  const sum = vals.reduce((a, c) => a + c, 0);
  // Weight signature: every value ≤ ~30 and sum near 100
  if (max <= 30 && sum >= 80 && sum <= 115) return true;
  // Near-exact match to known weights (±3)
  const nearWeight =
    Math.abs(b.formatting - WEIGHTS.formatting) <= 3 &&
    Math.abs(b.keywords - WEIGHTS.keywords) <= 5 &&
    Math.abs(b.structure - WEIGHTS.structure) <= 3 &&
    Math.abs(b.content - WEIGHTS.content) <= 5 &&
    Math.abs(b.readability - WEIGHTS.readability) <= 3;
  return nearWeight && max <= 35;
}

export function normalizeAtsBreakdown(raw: Partial<ATSBreakdown> | null | undefined): ATSBreakdown {
  return {
    formatting: clampScore(raw?.formatting),
    keywords: clampScore(raw?.keywords),
    structure: clampScore(raw?.structure),
    content: clampScore(raw?.content),
    readability: clampScore(raw?.readability),
  };
}

/** Deterministic overall score from category scores. */
export function scoreFromBreakdown(b: ATSBreakdown): number {
  return Math.round(
    b.formatting * 0.25 +
      b.keywords * 0.2 +
      b.structure * 0.2 +
      b.content * 0.25 +
      b.readability * 0.1
  );
}

/**
 * Normalize analysis for UI. Returns null breakdown-fix signal via
 * `needsRescore` when the model returned weight values instead of scores.
 */
export function normalizeAtsAnalysis(
  analysis: Omit<ATSAnalysis, "extractedText"> & { extractedText?: string },
  extractedText = ""
): { analysis: ATSAnalysis; needsRescore: boolean } {
  const breakdown = normalizeAtsBreakdown(analysis.breakdown);
  const needsRescore = breakdownLooksLikeWeights(breakdown);
  const score = needsRescore
    ? clampScore(analysis.score)
    : scoreFromBreakdown(breakdown);
  return {
    analysis: {
      score,
      breakdown,
      suggestions: Array.isArray(analysis.suggestions)
        ? analysis.suggestions
        : [],
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      extractedText: analysis.extractedText || extractedText,
    },
    needsRescore,
  };
}
