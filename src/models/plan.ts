/**
 * Plan domain model
 *
 * Represents a Simple Plan with:
 * - title (required)
 * - optional description
 * - execution date (required)
 * - optional execution time
 */
export interface Plan {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string format: YYYY-MM-DD
  time?: string; // Time format: HH:mm
}
