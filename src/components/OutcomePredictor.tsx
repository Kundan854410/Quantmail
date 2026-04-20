import { analyzeAuthority } from "../services/AuthorityModel";
import { rewriteForAuthority } from "../services/DynamicRewriter";

export interface OutcomePredictorProps {
  draft: string;
}

export interface OutcomePredictorMetrics {
  confidenceScore: number; // 0..100
  expectedResponseTimeHours: number;
  delta: number;
  headline: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function predictOutcomeMetrics(draft: string): OutcomePredictorMetrics {
  const baseline = analyzeAuthority(draft);
  const rewritten = rewriteForAuthority(draft);
  const improved = analyzeAuthority(rewritten.rewrittenText);

  const confidenceScore = clamp(improved.score, 0, 100);
  const delta = improved.score - baseline.score;

  const expectedResponseTimeHours = clamp(
    Number((72 - confidenceScore * 0.5).toFixed(1)),
    2,
    72
  );

  const headline =
    delta > 0
      ? `Authority confidence +${delta} points`
      : delta < 0
        ? `Authority confidence ${delta} points`
        : "Authority confidence unchanged";

  return {
    confidenceScore,
    expectedResponseTimeHours,
    delta,
    headline,
  };
}

/**
 * Lightweight, framework-agnostic "component-like" renderer for environments
 * that may not have React runtime wiring enabled.
 */
export default function OutcomePredictor(
  props: OutcomePredictorProps
): { title: string; metrics: OutcomePredictorMetrics } {
  return {
    title: "Outcome Predictor HUD",
    metrics: predictOutcomeMetrics(props.draft),
  };
}

