import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Plan } from '@/models/plan';
import { PlanRepository, planRepository } from '@/repositories/plan-repository';

export const usePlanStore = defineStore('plan', () => {
  const plans = ref<Plan[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const isCreating = ref<boolean>(false);
  const createError = ref<string | null>(null);
  const isUpdating = ref<boolean>(false);
  const updateError = ref<string | null>(null);
  const isDeleting = ref<boolean>(false);
  const deleteError = ref<string | null>(null);

  // Repository instance - allow injection for testing
  let repository: PlanRepository = planRepository;

  /**
   * Inject a repository instance for testing purposes.
   * This allows tests to mock the repository without affecting production code.
   */
  function setRepository(repo: PlanRepository): void {
    repository = repo;
  }

  /**
   * Reset all error states
   */
  function clearErrors(): void {
    error.value = null;
    createError.value = null;
    updateError.value = null;
    deleteError.value = null;
  }

  /**
   * Load all plans from the repository
   */
  function loadPlans(): void {
    clearErrors();
    isLoading.value = true;

    try {
      plans.value = repository.getAll();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load plans';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get a plan by ID
   */
  function getPlanById(id: string): Plan | null {
    return repository.getById(id);
  }

  /**
   * Create a new plan
   */
  function createPlan(planData: Omit<Plan, 'id'>): Plan {
    clearErrors();
    isCreating.value = true;

    try {
      const newPlan = repository.create(planData);
      // Refresh the plans list to include the new plan
      plans.value = repository.getAll();
      isCreating.value = false;
      return newPlan;
    } catch (err) {
      createError.value = err instanceof Error ? err.message : 'Failed to create plan';
      isCreating.value = false;
      throw err;
    }
  }

  /**
   * Update an existing plan
   */
  function updatePlan(id: string, updates: Partial<Omit<Plan, 'id'>>): Plan | null {
    clearErrors();
    isUpdating.value = true;

    try {
      const updatedPlan = repository.update(id, updates);
      if (updatedPlan) {
        // Refresh the plans list to include the updated plan
        plans.value = repository.getAll();
      }
      isUpdating.value = false;
      return updatedPlan;
    } catch (err) {
      updateError.value = err instanceof Error ? err.message : 'Failed to update plan';
      isUpdating.value = false;
      throw err;
    }
  }

  /**
   * Delete a plan by ID
   */
  function deletePlan(id: string): boolean {
    clearErrors();
    isDeleting.value = true;

    try {
      const success = repository.delete(id);
      if (success) {
        // Refresh the plans list to exclude the deleted plan
        plans.value = repository.getAll();
      }
      isDeleting.value = false;
      return success;
    } catch (err) {
      deleteError.value = err instanceof Error ? err.message : 'Failed to delete plan';
      isDeleting.value = false;
      throw err;
    }
  }

  const hasPlans = computed(() => plans.value.length > 0);
  const hasError = computed(() => error.value !== null);
  const hasCreateError = computed(() => createError.value !== null);
  const hasUpdateError = computed(() => updateError.value !== null);
  const hasDeleteError = computed(() => deleteError.value !== null);
  const isAnyOperationLoading = computed(
    () => isLoading.value || isCreating.value || isUpdating.value || isDeleting.value,
  );

  return {
    plans,
    isLoading,
    error,
    isCreating,
    createError,
    isUpdating,
    updateError,
    isDeleting,
    deleteError,

    hasPlans,
    hasError,
    hasCreateError,
    hasUpdateError,
    hasDeleteError,
    isAnyOperationLoading,

    setRepository,
    loadPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    clearErrors,
  };
});
