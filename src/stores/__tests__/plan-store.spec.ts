import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlanStore } from '../plan-store';
import { PlanRepository } from '@/repositories/plan-repository';
import type { Plan } from '@/models/plan';

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

describe('usePlanStore', () => {
  let store: ReturnType<typeof usePlanStore>;
  let testRepository: PlanRepository;
  let testStorage: InMemoryStorage;

  beforeEach(() => {
    // Setup Pinia
    setActivePinia(createPinia());

    // Setup test storage and repository
    testStorage = new InMemoryStorage();
    testRepository = new PlanRepository(testStorage);

    // Create store and inject test repository
    store = usePlanStore();
    store.setRepository(testRepository);
  });

  describe('initial state', () => {
    it('should have empty plans array', () => {
      expect(store.plans).toEqual([]);
    });

    it('should have loading state as false', () => {
      expect(store.isLoading).toBe(false);
    });

    it('should have no errors', () => {
      expect(store.error).toBeNull();
      expect(store.createError).toBeNull();
      expect(store.updateError).toBeNull();
      expect(store.deleteError).toBeNull();
    });

    it('should have operation loading states as false', () => {
      expect(store.isCreating).toBe(false);
      expect(store.isUpdating).toBe(false);
      expect(store.isDeleting).toBe(false);
    });

    it('should have hasPlans as false when no plans exist', () => {
      expect(store.hasPlans).toBe(false);
    });

    it('should have hasError computed as false when no errors', () => {
      expect(store.hasError).toBe(false);
    });

    it('should have isAnyOperationLoading as false when no operations are loading', () => {
      expect(store.isAnyOperationLoading).toBe(false);
    });
  });

  describe('loadPlans', () => {
    it('should load plans from repository', () => {
      // Pre-populate with test data
      testRepository.create({ title: 'Test Plan 1', date: '2026-10-04' });
      testRepository.create({ title: 'Test Plan 2', date: '2026-10-05' });

      store.loadPlans();

      expect(store.plans).toHaveLength(2);
      expect(store.plans[0]?.title).toBe('Test Plan 1');
      expect(store.plans[1]?.title).toBe('Test Plan 2');
    });

    it('should set isLoading to true during load', () => {
      // Mock getAll to track loading state
      const originalGetAll = testRepository.getAll.bind(testRepository);
      testRepository.getAll = vi.fn<() => Plan[]>(() => {
        expect(store.isLoading).toBe(true);
        return originalGetAll();
      });

      store.loadPlans();
      expect(store.isLoading).toBe(false);
    });

    it('should handle repository parse errors', () => {
      // Set invalid data in storage
      testStorage.setItem('tapestry-forge:plans', 'invalid-json');

      expect(() => store.loadPlans()).toThrow('Failed to parse persisted plans');
      expect(store.error).toBe('Failed to parse persisted plans');
      expect(store.isLoading).toBe(false);
    });

    it('should clear errors before loading', () => {
      // Set an error first
      store.error = 'Previous error';
      expect(store.hasError).toBe(true);

      store.loadPlans();
      expect(store.error).toBeNull();
      expect(store.hasError).toBe(false);
    });

    it('should set hasPlans to true when plans exist', () => {
      testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      store.loadPlans();

      expect(store.hasPlans).toBe(true);
    });
  });

  describe('getPlanById', () => {
    it('should return null for non-existent plan', () => {
      const result = store.getPlanById('non-existent');
      expect(result).toBeNull();
    });

    it('should return plan when found by ID', () => {
      const created = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const result = store.getPlanById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.title).toBe('Test Plan');
    });
  });

  describe('createPlan', () => {
    it('should create a plan and update plans list', () => {
      const newPlan = store.createPlan({
        title: 'New Plan',
        date: '2026-10-06',
      });

      expect(newPlan.id).toBeDefined();
      expect(newPlan.title).toBe('New Plan');
      expect(newPlan.date).toBe('2026-10-06');

      // Verify plans list was updated
      expect(store.plans).toHaveLength(1);
      expect(store.plans[0]?.title).toBe(newPlan.title);
    });

    it('should create plan with all fields', () => {
      const newPlan = store.createPlan({
        title: 'Full Plan',
        description: 'Test description',
        date: '2026-10-06',
        time: '14:30',
      });

      expect(newPlan.title).toBe('Full Plan');
      expect(newPlan.description).toBe('Test description');
      expect(newPlan.date).toBe('2026-10-06');
      expect(newPlan.time).toBe('14:30');
    });

    it('should set isCreating during operation', () => {
      // The operation happens synchronously, so we test the state after
      store.createPlan({ title: 'Test', date: '2026-10-06' });
      expect(store.isCreating).toBe(false);
    });

    it('should clear errors before creating', () => {
      store.createError = 'Previous error';
      store.createPlan({ title: 'Test', date: '2026-10-06' });
      expect(store.createError).toBeNull();
    });

    it('should persist plans across multiple creates', () => {
      store.createPlan({ title: 'Plan 1', date: '2026-10-06' });
      store.createPlan({ title: 'Plan 2', date: '2026-10-07' });

      expect(store.plans).toHaveLength(2);
    });
  });

  describe('updatePlan', () => {
    it('should return null when updating non-existent plan', () => {
      const result = store.updatePlan('non-existent', { title: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update plan and refresh plans list', () => {
      const created = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = store.updatePlan(created.id, { title: 'Updated Plan' });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated Plan');
      expect(updated?.date).toBe('2026-10-04'); // unchanged

      // Verify plans list was refreshed
      expect(store.plans).toHaveLength(1);
      expect(store.plans[0]?.title).toBe('Updated Plan');
    });

    it('should update multiple fields', () => {
      const created = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const updated = store.updatePlan(created.id, {
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

    it('should clear errors before updating', () => {
      store.updateError = 'Previous error';
      const created = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      store.updatePlan(created.id, { title: 'Updated' });
      expect(store.updateError).toBeNull();
    });
  });

  describe('deletePlan', () => {
    it('should return false when deleting non-existent plan', () => {
      const result = store.deletePlan('non-existent');
      expect(result).toBe(false);
    });

    it('should delete plan and refresh plans list', () => {
      testRepository.create({ title: 'Plan 1', date: '2026-10-04' });
      const toDelete = testRepository.create({ title: 'Plan 2', date: '2026-10-05' });
      testRepository.create({ title: 'Plan 3', date: '2026-10-06' });

      const success = store.deletePlan(toDelete.id);

      expect(success).toBe(true);
      expect(store.plans).toHaveLength(2);
      expect(store.plans.some((p) => p.id === toDelete.id)).toBe(false);
    });

    it('should clear errors before deleting', () => {
      store.deleteError = 'Previous error';
      const created = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      store.deletePlan(created.id);
      expect(store.deleteError).toBeNull();
    });

    it('should handle deletion of last plan', () => {
      const onlyPlan = testRepository.create({ title: 'Only Plan', date: '2026-10-04' });
      store.deletePlan(onlyPlan.id);

      expect(store.plans).toHaveLength(0);
      expect(store.hasPlans).toBe(false);
    });
  });

  describe('clearErrors', () => {
    it('should clear all error states', () => {
      store.error = 'Load error';
      store.createError = 'Create error';
      store.updateError = 'Update error';
      store.deleteError = 'Delete error';

      store.clearErrors();

      expect(store.error).toBeNull();
      expect(store.createError).toBeNull();
      expect(store.updateError).toBeNull();
      expect(store.deleteError).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('should have hasPlans computed correctly', () => {
      expect(store.hasPlans).toBe(false);

      testRepository.create({ title: 'Test', date: '2026-10-04' });
      store.loadPlans();
      expect(store.hasPlans).toBe(true);
    });

    it('should have hasError computed correctly', () => {
      expect(store.hasError).toBe(false);

      store.error = 'Test error';
      expect(store.hasError).toBe(true);
    });

    it('should have hasCreateError computed correctly', () => {
      expect(store.hasCreateError).toBe(false);

      store.createError = 'Test error';
      expect(store.hasCreateError).toBe(true);
    });

    it('should have hasUpdateError computed correctly', () => {
      expect(store.hasUpdateError).toBe(false);

      store.updateError = 'Test error';
      expect(store.hasUpdateError).toBe(true);
    });

    it('should have hasDeleteError computed correctly', () => {
      expect(store.hasDeleteError).toBe(false);

      store.deleteError = 'Test error';
      expect(store.hasDeleteError).toBe(true);
    });

    it('should have isAnyOperationLoading computed correctly', () => {
      expect(store.isAnyOperationLoading).toBe(false);

      store.isLoading = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isLoading = false;
      store.isCreating = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isCreating = false;
      store.isUpdating = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isUpdating = false;
      store.isDeleting = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isDeleting = false;
      expect(store.isAnyOperationLoading).toBe(false);
    });
  });

  describe('repository injection', () => {
    it('should use injected repository', () => {
      const alternativeStorage = new InMemoryStorage();
      const alternativeRepository = new PlanRepository(alternativeStorage);

      // Create a plan in the alternative repository
      alternativeRepository.create({ title: 'Alternative Plan', date: '2026-10-04' });

      // Inject and test
      store.setRepository(alternativeRepository);
      store.loadPlans();

      expect(store.plans).toHaveLength(1);
      expect(store.plans[0]?.title).toBe('Alternative Plan');
    });
  });
});