// Conversational Context Memory and Turn Management for ORBIT AI

import { ConversationTurn, MetricType } from './types';

const memoryStore: ConversationTurn[] = [];

/**
 * Records a completed conversation turn into working memory.
 */
export function recordConversationTurn(turn: ConversationTurn): void {
  memoryStore.push(turn);
  // Keep rolling memory to max 25 turns to prevent unbounded memory growth
  if (memoryStore.length > 25) {
    memoryStore.shift();
  }
}

/**
 * Retrieves the full recent conversation history.
 */
export function getConversationHistory(): ConversationTurn[] {
  return [...memoryStore];
}

/**
 * Returns the most recently discussed metric or physiological domain.
 */
export function getLastDiscussedMetric(): MetricType | null {
  for (let i = memoryStore.length - 1; i >= 0; i--) {
    if (memoryStore[i].targetMetrics.length > 0) {
      return memoryStore[i].targetMetrics[0];
    }
  }
  return null;
}

/**
 * Clears conversation history (e.g. on new mission cycle or user reset).
 */
export function clearConversationMemory(): void {
  memoryStore.length = 0;
}

