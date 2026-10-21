/**
 * Form data types
 *
 * Represents form state for Plan-related forms.
 * Mirrors domain models but with form-specific considerations.
 */
import type { Plan } from './plan';
import type { Step } from './step';

/**
 * Form data for Plan creation/editing.
 * Matches Plan domain model but with optional id for create mode.
 * Uses empty string defaults for optional fields to support v-model bindings.
 */
export interface PlanFormData extends Omit<Plan, 'id'> {
  id?: string;
}

/**
 * Form data for Step creation/editing within a plan.
 * Matches Step domain model but with optional id and order for create mode.
 * Uses empty string defaults for optional fields to support v-model bindings.
 */
export interface StepFormData extends Omit<Step, 'id' | 'order'> {
  id?: string;
  order?: number;
}
