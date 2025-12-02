/**
 * Centralized coin costs for all AI-powered features
 * 
 * IMPORTANT: These values MUST match the costs in edge functions
 * Update both places when changing costs to maintain consistency
 */
export const COIN_COSTS = {
  QUESTION_ANSWER: 10,
  SUMMARIZE: 10,
  EXAM_GENERATE: 10,
  EXAM_EVALUATE: 5,
  FLASHCARD_GENERATE: 5,
  MINDMAP_GENERATE: 10,
  CONSULTATION: 20,
  STUDY_PLAN: 10,
  VOICE_TO_TEXT: 0, // Currently free
} as const;

export type CoinCostKey = keyof typeof COIN_COSTS;
