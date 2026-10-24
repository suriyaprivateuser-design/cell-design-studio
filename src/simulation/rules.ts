import type { CellDesign } from "./design";

/**
 * Rule engine for the "Cell Performance" panel and the test results.
 *
 * Performance is never shown as a number. Each metric is a list of plain
 * biology statements ("factors"). A factor that applies pushes the metric up
 * (+) or down (−); the level shown to students (สูง / ปานกลาง / ต่ำ) comes from
 * how many factors apply, and every factor that applies is listed as the
 * reason. So whatever level a student sees can always be traced back to
 * sentences they can read.
 */

export type Level = "high" | "medium" | "low";
export type Effect = -2 | -1 | 0 | 1 | 2;

export const LEVEL_TEXT: Record<Level, string> = {
  high: "สูง",
  medium: "ปานกลาง",
  low: "ต่ำ",
};

export interface Factor {
  when: (d: CellDesign) => boolean;
  /** Positive values move the level up, negative down; 0 is an explanatory note only */
  effect: Effect;
  text: string;
  /** What to try instead, shown for negative factors on the results page */
  hint?: string;
}

export interface MetricRule {
  id: string;
  label: string;
  labelEn: string;
  /** One line under the metric name: what the metric is about */
  about: string;
  /** If this applies the level is "low" whatever else is true (e.g. a dead cell cannot store starch) */
  gate?: { when: (d: CellDesign) => boolean; text: string; hint?: string };
  factors: Factor[];
  /** sum ≥ high → สูง, sum ≤ low → ต่ำ, otherwise ปานกลาง */
  thresholds: { high: number; low: number };
  /** Shown for comparison only: not a goal of this mission */
  tradeOff?: boolean;
}

export interface Reason {
  text: string;
  effect: Effect;
  hint?: string;
}

export interface MetricResult {
  id: string;
  label: string;
  labelEn: string;
  about: string;
  level: Level;
  reasons: Reason[];
  tradeOff: boolean;
}

export interface GoalRule {
  id: string;
  check: (metrics: Record<string, MetricResult>, d: CellDesign) => boolean;
  /** Feedback when the goal is met / not met */
  pass: string;
  fail: string;
}

export interface MissionRules {
  metrics: MetricRule[];
  goals: GoalRule[];
}

export type Fit = "good" | "partial" | "poor";

export const FIT_TEXT: Record<Fit, string> = {
  good: "เหมาะสมกับโจทย์",
  partial: "เหมาะสมบางส่วน",
  poor: "ยังไม่เหมาะสม",
};

export interface Evaluation {
  metrics: MetricResult[];
  byId: Record<string, MetricResult>;
  goals: { id: string; met: boolean; feedback: string }[];
  fit: Fit;
}

export function evaluateMetric(rule: MetricRule, d: CellDesign): MetricResult {
  const base = { id: rule.id, label: rule.label, labelEn: rule.labelEn, about: rule.about, tradeOff: !!rule.tradeOff };
  if (rule.gate?.when(d)) {
    return { ...base, level: "low", reasons: [{ text: rule.gate.text, effect: -1, hint: rule.gate.hint }] };
  }
  const reasons: Reason[] = rule.factors
    .filter((f) => f.when(d))
    .map((f) => ({ text: f.text, effect: f.effect, hint: f.hint }));
  const sum = reasons.reduce((s, r) => s + r.effect, 0);
  const level: Level = sum >= rule.thresholds.high ? "high" : sum <= rule.thresholds.low ? "low" : "medium";
  return { ...base, level, reasons };
}

export function evaluate(rules: MissionRules, d: CellDesign): Evaluation {
  const metrics = rules.metrics.map((m) => evaluateMetric(m, d));
  const byId = Object.fromEntries(metrics.map((m) => [m.id, m]));
  const goals = rules.goals.map((g) => {
    const met = g.check(byId, d);
    return { id: g.id, met, feedback: met ? g.pass : g.fail };
  });
  const metCount = goals.filter((g) => g.met).length;
  const fit: Fit = metCount === goals.length ? "good" : metCount >= goals.length - 1 && metCount > 0 ? "partial" : "poor";
  return { metrics, byId, goals, fit };
}
