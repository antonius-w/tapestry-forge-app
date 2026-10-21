<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan-store';
import { storeToRefs } from 'pinia';
import { RouteName } from '@/router/route-names';
import type { PlanFormData, StepFormData } from '@/models/form-data';
import type { Step } from '@/models/step';
import StepEditor from '@/components/plans/StepEditor.vue';
import StepList from '@/components/plans/StepList.vue';

const router = useRouter();
const route = useRoute();
const planStore = usePlanStore();
const { isCreating, isUpdating } = storeToRefs(planStore);

const formData = ref<PlanFormData>({
  title: '',
  description: '',
  date: '',
  time: '',
});

const steps = ref<StepFormData[]>([]);
const stepsExpanded = ref<boolean>(false);
const showStepEditor = ref<boolean>(false);
const editingStep = ref<StepFormData | undefined>(undefined);

const errorMessage = ref<string>('');

const isEditing = computed(() => !!formData.value.id);

const planId = computed(() => {
  const id = route.params.id;

  if (!id) return '';

  return Array.isArray(id) ? id[0] || '' : id;
});

const isFormValid = computed(() => {
  return formData.value.title.trim() !== '' && formData.value.date !== '';
});

const submitButtonText = computed(() => {
  if (isEditing.value) return isUpdating.value ? 'Saving...' : 'Save Changes';

  return isCreating.value ? 'Creating...' : 'Create Plan';
});

const stepsToggleText = computed(() => {
  const count = steps.value.length;

  if (count === 0) {
    return stepsExpanded.value ? 'Hide steps' : 'Add steps';
  }

  return `Steps (${count})`;
});

const displaySteps = computed<Step[]>(() =>
  steps.value.map((step, index) => ({
    id: step.id ?? '',
    title: step.title,
    description: step.description,
    order: step.order ?? index,
  })),
);

function buildSteps(): Step[] | undefined {
  if (steps.value.length === 0) return undefined;

  return steps.value.map((step, index) => ({
    id: step.id ?? crypto.randomUUID(),
    title: step.title,
    description: step.description,
    order: index,
  }));
}

function submitForm(): void {
  errorMessage.value = '';

  if (!isFormValid.value) {
    errorMessage.value = 'Title and date are required';
    return;
  }

  try {
    if (isEditing.value && formData.value.id) {
      updateExistingPlan();
      return;
    }

    createNewPlan();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save plan';
  }
}

function createNewPlan(): void {
  planStore.createPlan({
    title: formData.value.title,
    description: formData.value.description || undefined,
    date: formData.value.date,
    time: formData.value.time || undefined,
    steps: buildSteps(),
  });
  router.push({ name: RouteName.plans });
}

function updateExistingPlan(): void {
  const updatedPlan = planStore.updatePlan(formData.value.id!, {
    title: formData.value.title,
    description: formData.value.description || undefined,
    date: formData.value.date,
    time: formData.value.time || undefined,
    steps: buildSteps(),
  });

  if (!updatedPlan) return;

  router.push({ name: RouteName.plans });
}

function handleCancel(): void {
  router.push({ name: RouteName.plans });
}

function toggleSteps(): void {
  stepsExpanded.value = !stepsExpanded.value;

  if (!stepsExpanded.value) {
    showStepEditor.value = false;
    editingStep.value = undefined;
  }
}

function handleAddStepClick(): void {
  editingStep.value = undefined;
  showStepEditor.value = true;
}

function handleEditStep(stepId: string): void {
  const step = steps.value.find((s) => s.id === stepId);

  if (!step) return;

  editingStep.value = { ...step };
  showStepEditor.value = true;
}

function handleStepSave(data: StepFormData): void {
  if (data.id) {
    const index = steps.value.findIndex((s) => s.id === data.id);

    if (index !== -1) {
      steps.value[index] = {
        ...data,
        order: steps.value[index]?.order ?? index,
      };
    }
  }

  if (!data.id) {
    steps.value.push({
      ...data,
      id: crypto.randomUUID(),
      order: steps.value.length,
    });
  }

  showStepEditor.value = false;
  editingStep.value = undefined;
}

function handleStepCancel(): void {
  showStepEditor.value = false;
  editingStep.value = undefined;
}

function handleStepDelete(stepId: string): void {
  const index = steps.value.findIndex((s) => s.id === stepId);

  if (index === -1) return;

  steps.value.splice(index, 1);

  steps.value = steps.value.map((step, i) => ({ ...step, order: i }));

  if (editingStep.value?.id === stepId) {
    showStepEditor.value = false;
    editingStep.value = undefined;
  }
}

function handleMoveUp(stepId: string): void {
  const index = steps.value.findIndex((s) => s.id === stepId);

  if (index <= 0) return;

  const prev = steps.value[index - 1];
  const current = steps.value[index];

  if (!prev || !current) return;

  steps.value[index - 1] = { ...current, order: prev.order };
  steps.value[index] = { ...prev, order: current.order };
}

function handleMoveDown(stepId: string): void {
  const index = steps.value.findIndex((s) => s.id === stepId);

  if (index === -1 || index >= steps.value.length - 1) return;

  const next = steps.value[index + 1];
  const current = steps.value[index];

  if (!next || !current) return;

  steps.value[index + 1] = { ...current, order: next.order };
  steps.value[index] = { ...next, order: current.order };
}

function loadStepsFromPlan(planSteps: Step[] | undefined): void {
  if (!planSteps || planSteps.length === 0) {
    steps.value = [];
    return;
  }

  steps.value = planSteps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description ?? '',
    order: step.order,
  }));
}

onMounted(() => {
  if (!planId.value || planId.value === '') {
    formData.value.date = new Date().toISOString().split('T')[0] || '';
    return;
  }

  const plan = planStore.getPlanById(planId.value);

  if (!plan) {
    router.push({ name: RouteName.plans });
    return;
  }

  formData.value = { ...plan };
  loadStepsFromPlan(plan.steps);

  if (plan.steps && plan.steps.length > 0) {
    stepsExpanded.value = true;
  }
});
</script>

<template>
  <div class="plan-form">
    <h1>{{ isEditing ? 'Edit Plan' : 'Create Plan' }}</h1>

    <form @submit.prevent="submitForm" class="form">
      <div class="field">
        <label for="title"> Title * </label>
        <input id="title" v-model="formData.title" type="text" placeholder="Enter plan title" />
      </div>

      <div class="field">
        <label for="description"> Description </label>
        <textarea
          id="description"
          v-model="formData.description"
          rows="3"
          placeholder="Enter plan description (optional)"
        />
      </div>

      <div class="field">
        <label for="date"> Date * </label>
        <input id="date" v-model="formData.date" type="date" />
      </div>

      <div class="field">
        <label for="time"> Time </label>
        <input id="time" v-model="formData.time" type="time" />
      </div>

      <!-- Steps section (collapsible, progressive complexity) -->
      <div class="steps-section">
        <button type="button" class="steps-toggle" @click="toggleSteps">
          <span class="toggle-icon">{{ stepsExpanded ? '▼' : '▶' }}</span>
          {{ stepsToggleText }}
        </button>

        <div v-if="stepsExpanded" class="steps-content">
          <StepList
            v-if="steps.length > 0"
            :steps="displaySteps"
            @edit="handleEditStep"
            @delete="handleStepDelete"
            @move-up="handleMoveUp"
            @move-down="handleMoveDown"
          />

          <p v-else class="no-steps">No steps yet. Add steps to break this plan into actions.</p>

          <StepEditor
            v-if="showStepEditor"
            :step="editingStep"
            @save="handleStepSave"
            @cancel="handleStepCancel"
          />

          <button v-else type="button" class="add-step-button" @click="handleAddStepClick">
            + Add step
          </button>
        </div>
      </div>

      <!-- Form error -->
      <div v-if="errorMessage" class="error">
        <p>{{ errorMessage }}</p>
      </div>

      <div class="buttons">
        <button type="submit" :disabled="isCreating || isUpdating" class="primary">
          {{ submitButtonText }}
        </button>
        <button type="button" @click="handleCancel" class="secondary">Cancel</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.plan-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.plan-form h1 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.form {
  max-width: 28rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.field input:required:invalid,
.field textarea:required:invalid {
  border-color: #ef4444;
}

.field input:focus:invalid,
.field textarea:focus:invalid {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}

.steps-section {
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.steps-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background-color: #f9fafb;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.steps-toggle:hover {
  background-color: #f3f4f6;
}

.toggle-icon {
  font-size: 0.625rem;
  color: #9ca3af;
}

.steps-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-steps {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  padding: 0.5rem;
  margin: 0;
}

.add-step-button {
  padding: 0.5rem 0.75rem;
  background: none;
  border: 1px dashed #d1d5db;
  border-radius: 0.375rem;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.add-step-button:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.error {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.primary,
.secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s,
    opacity 0.2s;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.secondary:hover {
  background-color: #d1d5db;
}
</style>
