<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan-store';
import { storeToRefs } from 'pinia';
import { RouteName } from '@/router/route-names';
import type { PlanFormData } from '@/models/form-data';

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
  });
  router.push({ name: RouteName.plans });
}

function updateExistingPlan(): void {
  const updatedPlan = planStore.updatePlan(formData.value.id!, {
    title: formData.value.title,
    description: formData.value.description || undefined,
    date: formData.value.date,
    time: formData.value.time || undefined,
  });

  if (!updatedPlan) return;
  router.push({ name: RouteName.plans });
}

function handleCancel(): void {
  router.push({ name: RouteName.plans });
}

onMounted(() => {
  if (!planId.value || planId.value === '') {
    // Set default date for new plans (today)
    formData.value.date = new Date().toISOString().split('T')[0] || '';
    return;
  }

  const plan = planStore.getPlanById(planId.value);
  if (!plan) {
    // Plan not found, redirect to list
    router.push({ name: RouteName.plans });
    return;
  }

  formData.value = { ...plan };
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
