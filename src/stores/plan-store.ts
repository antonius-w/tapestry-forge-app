import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Plan } from '@/models/plan';
import type { Step } from '@/models/step';
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
  const isAddingStep = ref<boolean>(false);
  const addStepError = ref<string | null>(null);
  const isUpdatingStep = ref<boolean>(false);
  const updateStepError = ref<string | null>(null);
  const isRemovingStep = ref<boolean>(false);
  const removeStepError = ref<string | null>(null);

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
    addStepError.value = null;
    updateStepError.value = null;
    removeStepError.value = null;
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

  /**
   * Add a step to a plan.
   *
   * Generates a stable unique step ID and assigns the next order position.
   *
   * @param planId - The plan identifier
   * @param stepData - Step data without ID or order (both are generated)
   * @returns The created step, or null if the plan was not found
   */
  function addStep(planId: string, stepData: Omit<Step, 'id' | 'order'>): Step | null {
    clearErrors();
    isAddingStep.value = true;

    try {
      const plan = repository.getById(planId);

      if (!plan) {
        addStepError.value = 'Plan not found';
        isAddingStep.value = false;
        return null;
      }

      const existingSteps = plan.steps ?? [];
      const order =
        existingSteps.length > 0 ? Math.max(...existingSteps.map((s) => s.order)) + 1 : 0;

      const newStep: Step = {
        ...stepData,
        id: crypto.randomUUID(),
        order,
      };

      const updatedPlan = repository.update(planId, {
        steps: [...existingSteps, newStep],
      });

      if (updatedPlan) {
        plans.value = repository.getAll();
      }

      isAddingStep.value = false;
      return newStep;
    } catch (err) {
      addStepError.value = err instanceof Error ? err.message : 'Failed to add step';
      isAddingStep.value = false;
      throw err;
    }
  }

  /**
   * Update an existing step within a plan.
   *
   * Preserves step identity and ordering.
   *
   * @param planId - The plan identifier
   * @param stepId - The step identifier
   * @param updates - Partial step data to update (ID and order cannot be changed)
   * @returns The updated step, or null if the plan or step was not found
   */
  function updateStep(
    planId: string,
    stepId: string,
    updates: Partial<Omit<Step, 'id' | 'order'>>,
  ): Step | null {
    clearErrors();
    isUpdatingStep.value = true;

    try {
      const plan = repository.getById(planId);

      if (!plan) {
        updateStepError.value = 'Plan not found';
        isUpdatingStep.value = false;
        return null;
      }

      const steps = plan.steps;

      if (!steps || steps.length === 0) {
        updateStepError.value = 'Step not found';
        isUpdatingStep.value = false;
        return null;
      }

      const stepIndex = steps.findIndex((s) => s.id === stepId);

      if (stepIndex === -1) {
        updateStepError.value = 'Step not found';
        isUpdatingStep.value = false;
        return null;
      }

      const updatedSteps = steps.map((step, index) =>
        index === stepIndex ? { ...step, ...updates, id: step.id, order: step.order } : step,
      );

      const updatedPlan = repository.update(planId, { steps: updatedSteps });

      if (updatedPlan) {
        plans.value = repository.getAll();
      }

      isUpdatingStep.value = false;
      return updatedSteps[stepIndex] ?? null;
    } catch (err) {
      updateStepError.value = err instanceof Error ? err.message : 'Failed to update step';
      isUpdatingStep.value = false;
      throw err;
    }
  }

  /**
   * Remove a step from a plan.
   *
   * Re-indexes remaining steps to maintain contiguous 0-indexed ordering.
   *
   * @param planId - The plan identifier
   * @param stepId - The step identifier
   * @returns true if the step was found and removed, false otherwise
   */
  function removeStep(planId: string, stepId: string): boolean {
    clearErrors();
    isRemovingStep.value = true;

    try {
      const plan = repository.getById(planId);

      if (!plan) {
        removeStepError.value = 'Plan not found';
        isRemovingStep.value = false;
        return false;
      }

      const steps = plan.steps;

      if (!steps || steps.length === 0) {
        removeStepError.value = 'Step not found';
        isRemovingStep.value = false;
        return false;
      }

      const stepExists = steps.some((s) => s.id === stepId);

      if (!stepExists) {
        removeStepError.value = 'Step not found';
        isRemovingStep.value = false;
        return false;
      }

      const remainingSteps = steps
        .filter((s) => s.id !== stepId)
        .map((step, index) => ({ ...step, order: index }));

      const updatedPlan = repository.update(planId, { steps: remainingSteps });

      if (updatedPlan) {
        plans.value = repository.getAll();
      }

      isRemovingStep.value = false;
      return true;
    } catch (err) {
      removeStepError.value = err instanceof Error ? err.message : 'Failed to remove step';
      isRemovingStep.value = false;
      throw err;
    }
  }

  const hasPlans = computed(() => plans.value.length > 0);
  const hasError = computed(() => error.value !== null);
  const hasCreateError = computed(() => createError.value !== null);
  const hasUpdateError = computed(() => updateError.value !== null);
  const hasDeleteError = computed(() => deleteError.value !== null);
  const hasAddStepError = computed(() => addStepError.value !== null);
  const hasUpdateStepError = computed(() => updateStepError.value !== null);
  const hasRemoveStepError = computed(() => removeStepError.value !== null);
  const isAnyOperationLoading = computed(
    () =>
      isLoading.value ||
      isCreating.value ||
      isUpdating.value ||
      isDeleting.value ||
      isAddingStep.value ||
      isUpdatingStep.value ||
      isRemovingStep.value,
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
    isAddingStep,
    addStepError,
    isUpdatingStep,
    updateStepError,
    isRemovingStep,
    removeStepError,

    hasPlans,
    hasError,
    hasCreateError,
    hasUpdateError,
    hasDeleteError,
    hasAddStepError,
    hasUpdateStepError,
    hasRemoveStepError,
    isAnyOperationLoading,

    setRepository,
    loadPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    addStep,
    updateStep,
    removeStep,
    clearErrors,
  };
});
