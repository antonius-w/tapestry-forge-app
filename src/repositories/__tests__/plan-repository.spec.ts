import { describe, it, expect, beforeEach } from 'vitest';
import { PlanRepository } from '@/repositories/plan-repository';

/**
 * In-memory storage implementation for testing.
 * Implements the Storage interface used by PlanRepository.
 */
class InMemoryStorage implements Storage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  key(_index: number): string | null {
    return null;
  }
}

describe('PlanRepository', () => {
  let repository: PlanRepository;
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
    repository = new PlanRepository(storage);
  });

  describe('getAll', () => {
    it('should return empty array when no plans exist', () => {
      const plans = repository.getAll();
      expect(plans).toEqual([]);
    });

    it('should return all stored plans', () => {
      const plan1 = repository.create({ title: 'Plan 1', date: '2026-10-04' });
      const plan2 = repository.create({ title: 'Plan 2', date: '2026-10-05' });

      const plans = repository.getAll();
      expect(plans).toHaveLength(2);
      expect(plans).toContainEqual(plan1);
      expect(plans).toContainEqual(plan2);
    });

    it('should propagate persistence parse error', () => {
      storage.setItem('tapestry-forge:plans', 'invalid-json');

      expect(() => repository.getAll()).toThrow('Failed to parse persisted plans');
    });
  });

  describe('getById', () => {
    it('should return null when no plan matches the ID', () => {
      const found = repository.getById('non-existent');
      expect(found).toBeNull();
    });

    it('should return the plan when found by ID', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const found = repository.getById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Test Plan');
      expect(found?.date).toBe('2026-10-04');
    });
  });

  describe('create', () => {
    it('should create a plan with generated UUID', () => {
      const plan = repository.create({
        title: 'Test Plan',
        date: '2026-10-04',
      });

      expect(plan.id).toBeDefined();
      expect(plan.title).toBe('Test Plan');
      expect(plan.date).toBe('2026-10-04');
      expect(plan.description).toBeUndefined();
      expect(plan.time).toBeUndefined();
    });

    it('should create a plan with all fields', () => {
      const plan = repository.create({
        title: 'Test Plan',
        description: 'Test Description',
        date: '2026-10-04',
        time: '14:30',
      });

      expect(plan.id).toBeDefined();
      expect(plan.title).toBe('Test Plan');
      expect(plan.description).toBe('Test Description');
      expect(plan.date).toBe('2026-10-04');
      expect(plan.time).toBe('14:30');
    });

    it('should persist the created plan', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });

      // Verify it can be retrieved
      const found = repository.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Test Plan');
    });

    it('should generate unique IDs for each plan', () => {
      const plan1 = repository.create({ title: 'Plan 1', date: '2026-10-04' });
      const plan2 = repository.create({ title: 'Plan 2', date: '2026-10-05' });

      expect(plan1.id).not.toBe(plan2.id);
    });
  });

  describe('update', () => {
    it('should return null when updating non-existent plan', () => {
      const updated = repository.update('non-existent', { title: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should update plan title', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = repository.update(created.id, { title: 'Updated Plan' });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated Plan');
      expect(updated?.date).toBe('2026-10-04'); // unchanged
    });

    it('should update plan description', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = repository.update(created.id, { description: 'New description' });

      expect(updated).not.toBeNull();
      expect(updated?.description).toBe('New description');
      expect(updated?.title).toBe('Test Plan'); // unchanged
    });

    it('should update plan date', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = repository.update(created.id, { date: '2026-10-05' });

      expect(updated).not.toBeNull();
      expect(updated?.date).toBe('2026-10-05');
    });

    it('should update plan time', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = repository.update(created.id, { time: '15:00' });

      expect(updated).not.toBeNull();
      expect(updated?.time).toBe('15:00');
    });

    it('should update multiple fields simultaneously', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = repository.update(created.id, {
        title: 'Updated Plan',
        description: 'Updated description',
        date: '2026-10-05',
        time: '16:00',
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated Plan');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.date).toBe('2026-10-05');
      expect(updated?.time).toBe('16:00');
    });

    it('should persist the updated plan', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      repository.update(created.id, { title: 'Updated Plan' });

      // Verify via getById
      const found = repository.getById(created.id);
      expect(found?.title).toBe('Updated Plan');
    });

    it('should not update the plan ID', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      // @ts-expect-error - intentionally trying to update ID
      const updated = repository.update(created.id, { id: 'new-id' });

      expect(updated?.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('should return false when deleting non-existent plan', () => {
      const deleted = repository.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should delete a plan and return true', () => {
      const created = repository.create({ title: 'Test Plan', date: '2026-10-04' });
      const deleted = repository.delete(created.id);

      expect(deleted).toBe(true);
      expect(repository.getById(created.id)).toBeNull();
    });

    it('should remove the plan from the collection', () => {
      repository.create({ title: 'Plan 1', date: '2026-10-04' });
      const toDelete = repository.create({ title: 'Plan 2', date: '2026-10-05' });
      repository.create({ title: 'Plan 3', date: '2026-10-06' });

      repository.delete(toDelete.id);

      const plans = repository.getAll();
      expect(plans).toHaveLength(2);
      expect(plans.some((p) => p.id === toDelete.id)).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist plans across repository instances with same storage', () => {
      const created = repository.create({ title: 'Plan 1', date: '2026-10-04' });

      // Create new repository with same storage
      const newRepository = new PlanRepository(storage);
      const plans = newRepository.getAll();

      expect(plans).toHaveLength(1);
      expect(plans).toContainEqual(created);
    });

    it('should load previously persisted plans on initialization', () => {
      // Pre-populate storage
      const existingPlans = [{ id: 'pre-existing-id', title: 'Existing Plan', date: '2026-10-04' }];
      storage.setItem('tapestry-forge:plans', JSON.stringify(existingPlans));

      const plans = repository.getAll();
      expect(plans).toHaveLength(1);
      expect(plans[0]?.title).toBe('Existing Plan');
      expect(plans[0]?.id).toBe('pre-existing-id');
    });
  });

  describe('Extended Plan with Steps', () => {
    it('should create a plan without steps', () => {
      const plan = repository.create({
        title: 'Simple Plan',
        date: '2026-10-04',
      });

      expect(plan.steps).toBeUndefined();
    });

    it('should create a plan with steps', () => {
      const plan = repository.create({
        title: 'Extended Plan',
        date: '2026-10-04',
        steps: [
          { id: 'step-1', title: 'First step', order: 0 },
          { id: 'step-2', title: 'Second step', description: 'Do something', order: 1 },
        ],
      } as const);

      expect(plan.steps).toBeDefined();
      expect(plan.steps?.length).toBe(2);
    });

    it('should preserve step content on creation', () => {
      const plan = repository.create({
        title: 'Extended Plan',
        date: '2026-10-04',
        steps: [
          { id: 'step-1', title: 'First step', order: 0 },
          { id: 'step-2', title: 'Second step', description: 'Do something', order: 1 },
        ],
      } as const);

      expect(plan.steps?.[0]?.title).toBe('First step');
      expect(plan.steps?.[0]?.order).toBe(0);
      expect(plan.steps?.[1]?.title).toBe('Second step');
      expect(plan.steps?.[1]?.description).toBe('Do something');
    });

    it('should persist and restore plan with steps', () => {
      const created = repository.create({
        title: 'Extended Plan',
        date: '2026-10-04',
        steps: [
          { id: 'step-1', title: 'Step 1', order: 0 },
          { id: 'step-2', title: 'Step 2', order: 1 },
        ],
      } as const);

      const found = repository.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.steps?.length).toBe(2);
    });

    it('should persist and restore step identity and ordering', () => {
      const stepId = 'unique-step-id';
      const created = repository.create({
        title: 'Plan with unique step ID',
        date: '2026-10-04',
        steps: [{ id: stepId, title: 'Unique Step', order: 0 }],
      } as const);

      const found = repository.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.steps?.length).toBe(1);
      expect(found?.steps?.[0]?.id).toBe(stepId);
    });

    it('should persist and restore step ordering', () => {
      const created = repository.create({
        title: 'Ordered Plan',
        date: '2026-10-04',
        steps: [
          { id: 'step-a', title: 'Alpha', order: 2 },
          { id: 'step-b', title: 'Beta', order: 0 },
          { id: 'step-c', title: 'Gamma', order: 1 },
        ],
      } as const);

      const found = repository.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.steps?.length).toBe(3);
    });

    it('should preserve step order values on persistence', () => {
      const created = repository.create({
        title: 'Ordered Plan',
        date: '2026-10-04',
        steps: [
          { id: 'step-a', title: 'Alpha', order: 2 },
          { id: 'step-b', title: 'Beta', order: 0 },
          { id: 'step-c', title: 'Gamma', order: 1 },
        ],
      } as const);

      const found = repository.getById(created.id);
      expect(found?.steps?.[0]?.order).toBe(2);
      expect(found?.steps?.[1]?.order).toBe(0);
      expect(found?.steps?.[2]?.order).toBe(1);
    });

    it('should persist plans with steps across repository instances', () => {
      const created = repository.create({
        title: 'Persistent Extended Plan',
        date: '2026-10-04',
        steps: [{ id: 'step-1', title: 'Persistent Step', order: 0 }],
      } as const);

      const newRepository = new PlanRepository(storage);
      const found = newRepository.getById(created.id);

      expect(found).not.toBeNull();
      expect(found?.steps?.length).toBe(1);
      expect(found?.steps?.[0]?.id).toBe('step-1');
      expect(found?.steps?.[0]?.title).toBe('Persistent Step');
    });

    it('should maintain backward compatibility with Simple Plans without steps', () => {
      const simplePlans = [
        { id: 'simple-1', title: 'Simple Plan 1', date: '2026-10-04' },
        {
          id: 'simple-2',
          title: 'Simple Plan 2',
          date: '2026-10-05',
          description: 'A description',
        },
      ];
      storage.setItem('tapestry-forge:plans', JSON.stringify(simplePlans));

      const plans = repository.getAll();
      expect(plans).toHaveLength(2);
      expect(plans[0]?.steps).toBeUndefined();
      expect(plans[1]?.steps).toBeUndefined();
      expect(plans[0]?.title).toBe('Simple Plan 1');
      expect(plans[1]?.description).toBe('A description');
    });

    it('should update a plan to add steps', () => {
      const created = repository.create({ title: 'No Steps', date: '2026-10-04' });
      expect(created.steps).toBeUndefined();

      const updated = repository.update(created.id, {
        steps: [{ id: 'new-step', title: 'New Step', order: 0 }],
      });

      expect(updated).not.toBeNull();
      expect(updated?.steps?.length).toBe(1);
      expect(updated?.steps?.[0]?.id).toBe('new-step');

      const found = repository.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.steps?.length).toBe(1);
    });

    it('should update a plan to remove steps', () => {
      const created = repository.create({
        title: 'With Steps',
        date: '2026-10-04',
        steps: [{ id: 'step-1', title: 'Step', order: 0 }],
      } as const);

      const updated = repository.update(created.id, { steps: undefined });

      expect(updated).not.toBeNull();
      expect(updated?.steps).toBeUndefined();

      const found = repository.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.steps).toBeUndefined();
    });

    it('should persist mixed plans (with and without steps)', () => {
      const simple = repository.create({ title: 'Simple', date: '2026-10-04' });
      const extended = repository.create({
        title: 'Extended',
        date: '2026-10-05',
        steps: [{ id: 'step-1', title: 'Step', order: 0 }],
      } as const);

      const plans = repository.getAll();
      expect(plans).toHaveLength(2);

      const foundSimple = plans.find((p) => p.id === simple.id);
      const foundExtended = plans.find((p) => p.id === extended.id);

      expect(foundSimple).toBeDefined();
      expect(foundSimple?.steps).toBeUndefined();
      expect(foundExtended).toBeDefined();
      expect(foundExtended?.steps?.length).toBe(1);
    });
  });
});
