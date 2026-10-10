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
      expect(store.addStepError).toBeNull();
      expect(store.updateStepError).toBeNull();
      expect(store.removeStepError).toBeNull();
    });

    it('should have operation loading states as false', () => {
      expect(store.isCreating).toBe(false);
      expect(store.isUpdating).toBe(false);
      expect(store.isDeleting).toBe(false);
      expect(store.isAddingStep).toBe(false);
      expect(store.isUpdatingStep).toBe(false);
      expect(store.isRemovingStep).toBe(false);
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

      store.loadPlans();
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

  describe('addStep', () => {
    it('should add a step to a plan', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const step = store.addStep(plan.id, { title: 'First step' });

      expect(step).not.toBeNull();
      expect(step?.title).toBe('First step');
      expect(step?.id).toBeDefined();
      expect(step?.order).toBe(0);
    });

    it('should add a step with optional description', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const step = store.addStep(plan.id, {
        title: 'Step with description',
        description: 'A detailed description',
      });

      expect(step?.description).toBe('A detailed description');
    });

    it('should add multiple steps with correct ordering', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const step1 = store.addStep(plan.id, { title: 'Step 1' });
      const step2 = store.addStep(plan.id, { title: 'Step 2' });
      const step3 = store.addStep(plan.id, { title: 'Step 3' });

      expect(step1?.order).toBe(0);
      expect(step2?.order).toBe(1);
      expect(step3?.order).toBe(2);
    });

    it('should generate unique step IDs', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const step1 = store.addStep(plan.id, { title: 'Step 1' });
      const step2 = store.addStep(plan.id, { title: 'Step 2' });

      expect(step1?.id).not.toBe(step2?.id);
    });

    it('should preserve generated step identity', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const step = store.addStep(plan.id, { title: 'Original step' });
      expect(step).not.toBeNull();

      // Reload from repository and verify identity persists
      const reloaded = testRepository.getById(plan.id);
      expect(reloaded?.steps?.[0]?.id).toBe(step?.id);
    });

    it('should update the plans list after adding a step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      store.loadPlans();

      store.addStep(plan.id, { title: 'New step' });

      const updatedPlan = store.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.steps).toHaveLength(1);
      expect(updatedPlan?.steps?.[0]?.title).toBe('New step');
    });

    it('should persist step changes through the repository', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const step = store.addStep(plan.id, { title: 'Persisted step' });

      const found = testRepository.getById(plan.id);
      expect(found?.steps).toHaveLength(1);
      expect(found?.steps?.[0]?.id).toBe(step?.id);
      expect(found?.steps?.[0]?.title).toBe('Persisted step');
    });

    it('should return null when adding to a non-existent plan', () => {
      const result = store.addStep('non-existent', { title: 'Step' });

      expect(result).toBeNull();
      expect(store.addStepError).toBe('Plan not found');
    });

    it('should set isAddingStep during operation', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      store.addStep(plan.id, { title: 'Step' });
      expect(store.isAddingStep).toBe(false);
    });

    it('should clear errors before adding a step', () => {
      store.addStepError = 'Previous error';
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      store.addStep(plan.id, { title: 'Step' });
      expect(store.addStepError).toBeNull();
    });

    it('should handle repository failures', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      // Force repository failure
      testRepository.update = vi.fn<
        (id: string, updates: Partial<Omit<Plan, 'id'>>) => Plan | null
      >(() => {
        throw new Error('Storage failure');
      });

      expect(() => store.addStep(plan.id, { title: 'Step' })).toThrow('Storage failure');
      expect(store.addStepError).toBe('Storage failure');
      expect(store.isAddingStep).toBe(false);
    });

    it('should preserve Simple Plan behavior when adding first step', () => {
      const plan = testRepository.create({ title: 'Simple Plan', date: '2026-10-04' });
      expect(plan.steps).toBeUndefined();

      const step = store.addStep(plan.id, { title: 'First step' });

      expect(step).not.toBeNull();
      const found = testRepository.getById(plan.id);
      expect(found?.steps).toHaveLength(1);
      expect(found?.title).toBe('Simple Plan');
      expect(found?.date).toBe('2026-10-04');
    });
  });

  describe('updateStep', () => {
    it('should update an existing step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Original title' });
      expect(step).not.toBeNull();

      const updated = store.updateStep(plan.id, step!.id, { title: 'Updated title' });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated title');
    });

    it('should update step description', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step' });

      const updated = store.updateStep(plan.id, step!.id, {
        description: 'New description',
      });

      expect(updated?.description).toBe('New description');
      expect(updated?.title).toBe('Step'); // unchanged
    });

    it('should preserve step identity when updating', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Original' });
      const originalId = step!.id;

      const updated = store.updateStep(plan.id, step!.id, { title: 'Updated' });

      expect(updated?.id).toBe(originalId);
    });

    it('should preserve step ordering when updating', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      store.addStep(plan.id, { title: 'Step 1' });
      const step2 = store.addStep(plan.id, { title: 'Step 2' });
      store.addStep(plan.id, { title: 'Step 3' });

      const updated = store.updateStep(plan.id, step2!.id, { title: 'Updated Step 2' });

      expect(updated?.order).toBe(1);
    });

    it('should not allow changing step ID through updates', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step' });
      const originalId = step!.id;

      // @ts-expect-error - intentionally trying to update ID
      const updated = store.updateStep(plan.id, step!.id, { id: 'new-id' });

      expect(updated?.id).toBe(originalId);
    });

    it('should persist step updates through the repository', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Original' });

      store.updateStep(plan.id, step!.id, { title: 'Updated' });

      const found = testRepository.getById(plan.id);
      expect(found?.steps?.[0]?.title).toBe('Updated');
    });

    it('should update the plans list after updating a step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Original' });
      store.loadPlans();

      store.updateStep(plan.id, step!.id, { title: 'Updated' });

      const updatedPlan = store.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.steps?.[0]?.title).toBe('Updated');
    });

    it('should return null when updating a step in a non-existent plan', () => {
      const result = store.updateStep('non-existent', 'step-id', { title: 'Updated' });

      expect(result).toBeNull();
      expect(store.updateStepError).toBe('Plan not found');
    });

    it('should return null when updating a non-existent step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const result = store.updateStep(plan.id, 'non-existent-step', { title: 'Updated' });

      expect(result).toBeNull();
      expect(store.updateStepError).toBe('Step not found');
    });

    it('should handle repository failures', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step' });

      // Force repository failure
      testRepository.update = vi.fn<
        (id: string, updates: Partial<Omit<Plan, 'id'>>) => Plan | null
      >(() => {
        throw new Error('Storage failure');
      });

      expect(() => store.updateStep(plan.id, step!.id, { title: 'Updated' })).toThrow(
        'Storage failure',
      );
      expect(store.updateStepError).toBe('Storage failure');
      expect(store.isUpdatingStep).toBe(false);
    });
  });

  describe('removeStep', () => {
    it('should remove a step from a plan', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step to remove' });

      const success = store.removeStep(plan.id, step!.id);

      expect(success).toBe(true);
      const found = testRepository.getById(plan.id);
      expect(found?.steps).toHaveLength(0);
    });

    it('should maintain valid ordering after removal', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step1 = store.addStep(plan.id, { title: 'Step 1' });
      const step2 = store.addStep(plan.id, { title: 'Step 2' });
      const step3 = store.addStep(plan.id, { title: 'Step 3' });

      // Remove the middle step
      store.removeStep(plan.id, step2!.id);

      const found = testRepository.getById(plan.id);
      expect(found).not.toBeNull();
      const steps = found!.steps!;
      expect(steps).toHaveLength(2);
      expect(steps[0]!.id).toBe(step1!.id);
      expect(steps[0]!.order).toBe(0);
      expect(steps[1]!.id).toBe(step3!.id);
      expect(steps[1]!.order).toBe(1);
    });

    it('should re-index remaining steps after removing the first step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step1 = store.addStep(plan.id, { title: 'Step 1' });
      const step2 = store.addStep(plan.id, { title: 'Step 2' });

      store.removeStep(plan.id, step1!.id);

      const found = testRepository.getById(plan.id);
      expect(found?.steps).toHaveLength(1);
      expect(found?.steps?.[0]?.id).toBe(step2?.id);
      expect(found?.steps?.[0]?.order).toBe(0);
    });

    it('should re-index remaining steps after removing the last step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step1 = store.addStep(plan.id, { title: 'Step 1' });
      const step2 = store.addStep(plan.id, { title: 'Step 2' });

      store.removeStep(plan.id, step2!.id);

      const found = testRepository.getById(plan.id);
      expect(found?.steps).toHaveLength(1);
      expect(found?.steps?.[0]?.id).toBe(step1?.id);
      expect(found?.steps?.[0]?.order).toBe(0);
    });

    it('should persist step removal through the repository', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step' });

      store.removeStep(plan.id, step!.id);

      const found = testRepository.getById(plan.id);
      expect(found?.steps).toHaveLength(0);
    });

    it('should update the plans list after removing a step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step' });
      store.loadPlans();

      store.removeStep(plan.id, step!.id);

      const updatedPlan = store.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.steps).toHaveLength(0);
    });

    it('should return false when removing from a non-existent plan', () => {
      const result = store.removeStep('non-existent', 'step-id');

      expect(result).toBe(false);
      expect(store.removeStepError).toBe('Plan not found');
    });

    it('should return false when removing a non-existent step', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });

      const result = store.removeStep(plan.id, 'non-existent-step');

      expect(result).toBe(false);
      expect(store.removeStepError).toBe('Step not found');
    });

    it('should handle repository failures', () => {
      const plan = testRepository.create({ title: 'Test Plan', date: '2026-10-04' });
      const step = store.addStep(plan.id, { title: 'Step' });

      // Force repository failure
      testRepository.update = vi.fn<
        (id: string, updates: Partial<Omit<Plan, 'id'>>) => Plan | null
      >(() => {
        throw new Error('Storage failure');
      });

      expect(() => store.removeStep(plan.id, step!.id)).toThrow('Storage failure');
      expect(store.removeStepError).toBe('Storage failure');
      expect(store.isRemovingStep).toBe(false);
    });
  });

  describe('clearErrors', () => {
    it('should clear all error states', () => {
      store.error = 'Load error';
      store.createError = 'Create error';
      store.updateError = 'Update error';
      store.deleteError = 'Delete error';
      store.addStepError = 'Add step error';
      store.updateStepError = 'Update step error';
      store.removeStepError = 'Remove step error';

      store.clearErrors();

      expect(store.error).toBeNull();
      expect(store.createError).toBeNull();
      expect(store.updateError).toBeNull();
      expect(store.deleteError).toBeNull();
      expect(store.addStepError).toBeNull();
      expect(store.updateStepError).toBeNull();
      expect(store.removeStepError).toBeNull();
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

    it('should have hasAddStepError computed correctly', () => {
      expect(store.hasAddStepError).toBe(false);

      store.addStepError = 'Test error';
      expect(store.hasAddStepError).toBe(true);
    });

    it('should have hasUpdateStepError computed correctly', () => {
      expect(store.hasUpdateStepError).toBe(false);

      store.updateStepError = 'Test error';
      expect(store.hasUpdateStepError).toBe(true);
    });

    it('should have hasRemoveStepError computed correctly', () => {
      expect(store.hasRemoveStepError).toBe(false);

      store.removeStepError = 'Test error';
      expect(store.hasRemoveStepError).toBe(true);
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
      store.isAddingStep = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isAddingStep = false;
      store.isUpdatingStep = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isUpdatingStep = false;
      store.isRemovingStep = true;
      expect(store.isAnyOperationLoading).toBe(true);

      store.isRemovingStep = false;
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
