import type { Plan } from '@/models/plan';

const STORAGE_KEY = 'tapestry-forge:plans';

/**
 * Persistence representation of a Plan.
 * Matches the domain model 1:1 for Simple Plan.
 */
interface PlanPersistenceData {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
}

/**
 * PlanRepository provides application-oriented operations for Plan persistence.
 *
 * Implements persistence pattern by:
 * - Exposing domain operations (CRUD)
 * - Hiding persistence implementation details (localStorage)
 * - Isolating external data sources
 * - Supporting replacement of persistence mechanism
 */
export class PlanRepository {
  private readonly storage: Storage;

  /**
   * Creates a PlanRepository instance.
   *
   * @param storage - The storage mechanism to use (defaults to localStorage)
   */
  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Retrieves all plans from persistence.
   *
   * @returns Array of all stored plans, empty array if none exist
   */
  getAll(): Plan[] {
    const data = this.storage.getItem(STORAGE_KEY);
    if (!data) return [];

    try {
      const persisted: PlanPersistenceData[] = JSON.parse(data);
      return persisted.map(this.deserialize);
    } catch (error) {
      const err: Error & { cause?: unknown } = new Error('Failed to parse persisted plans');
      err.cause = error;
      throw err;
    }
  }

  /**
   * Retrieves a single plan by its ID.
   *
   * @param id - The plan identifier
   * @returns The plan if found, null otherwise
   */
  getById(id: string): Plan | null {
    const plans = this.getAll();
    return plans.find((plan) => plan.id === id) ?? null;
  }

  /**
   * Creates a new plan with a generated unique identifier.
   *
   * @param planData - Plan data without ID (ID is generated)
   * @returns The created plan with generated ID
   */
  create(planData: Omit<Plan, 'id'>): Plan {
    const id = crypto.randomUUID();
    const plan: Plan = { ...planData, id };
    const plans = this.getAll();
    plans.push(plan);
    this.saveAll(plans);
    return plan;
  }

  /**
   * Updates an existing plan.
   *
   * @param id - The plan identifier to update
   * @param updates - Partial plan data to update (ID cannot be changed)
   * @returns The updated plan if found, null otherwise
   */
  update(id: string, updates: Partial<Omit<Plan, 'id'>>): Plan | null {
    const plans = this.getAll();

    const updatedPlans = plans.map((plan) =>
      plan.id === id ? { ...plan, ...updates, id: plan.id } : plan
    );


    const updatedPlan = updatedPlans.find((plan) => plan.id === id);
    if (!updatedPlan) return null;

    this.saveAll(updatedPlans);
    return updatedPlan;
  }

  /**
   * Deletes a plan by its ID.
   *
   * @param id - The plan identifier to delete
   * @returns true if the plan was found and deleted, false otherwise
   */
  delete(id: string): boolean {
    const plans = this.getAll();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) return false;

    plans.splice(index, 1);
    this.saveAll(plans);
    return true;
  }

  /**
   * Serializes a domain Plan to its persistence format.
   */
  private serialize(plan: Plan): PlanPersistenceData {
    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      date: plan.date,
      time: plan.time,
    };
  }

  /**
   * Deserializes persistence data to a domain Plan.
   */
  private deserialize(data: PlanPersistenceData): Plan {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
    };
  }

  /**
   * Saves all plans to persistence.
   */
  private saveAll(plans: Plan[]): void {
    const persisted = plans.map(this.serialize);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }
}

/**
 * Default singleton instance for application use.
 * Uses browser's localStorage as the persistence mechanism.
 */
export const planRepository = new PlanRepository();
