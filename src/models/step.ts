/**
 * Step domain model
 *
 * Represents a single step within an Extended Plan.
 * Steps are ordered actions that can be independently trackable.
 *
 * Execution state (completed) is modelled on the step itself,
 * kept separate from the plan's scheduling data (date/time).
 */
export interface Step {
  id: string;
  title: string;
  description?: string;
  order: number; // Position within the plan's step collection (0-indexed)
  completed?: boolean; // Execution state: whether the step has been completed
}
