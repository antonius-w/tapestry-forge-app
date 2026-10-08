/**
 * Step domain model
 *
 * Represents a single step within an Extended Plan.
 * Steps are ordered actions that can be independently trackable.
 */
export interface Step {
  id: string;
  title: string;
  description?: string;
  order: number; // Position within the plan's step collection (0-indexed)
}
