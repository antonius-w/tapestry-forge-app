/**
 * Plan domain model
 *
 * Represents a Simple Plan with:
 * - title (required)
 * - optional description
 * - execution date (required)
 * - optional execution time
 *
 * Extended Plan adds:
 * - optional ordered steps
 */
import type { Step } from './step';

export interface Plan {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string format: YYYY-MM-DD
  time?: string; // Time format: HH:mm
  steps?: Step[]; // Ordered steps for Extended Plan
}

export type { Step };
