<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StepFormData } from '@/models/form-data';

const { step } = defineProps<{
  step?: StepFormData;
}>();

const emit = defineEmits<{
  (e: 'save', data: StepFormData): void;
  (e: 'cancel'): void;
}>();

const formData = ref<StepFormData>({
  title: '',
  description: '',
});

const isEditing = computed(() => !!step?.id);

const isFormValid = computed(() => formData.value.title.trim() !== '');

const submitButtonText = computed(() => (isEditing.value ? 'Save Step' : 'Add Step'));

function handleSubmit(): void {
  if (!isFormValid.value) return;

  emit('save', {
    ...formData.value,
    id: step?.id,
    order: step?.order,
    description: formData.value.description || undefined,
  });
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
  }
}

function handleCancel(): void {
  emit('cancel');
}

watch(
  () => step,
  (newStep) => {
    if (!newStep) {
      formData.value = { title: '', description: '' };
      return;
    }

    formData.value = {
      title: newStep.title,
      description: newStep.description ?? '',
      id: newStep.id,
      order: newStep.order,
    };
  },
  { immediate: true },
);
</script>

<template>
  <div class="step-editor">
    <div class="form" @keydown="handleKeydown">
      <div class="field">
        <label for="step-title"> Step title * </label>
        <input
          id="step-title"
          v-model="formData.title"
          type="text"
          placeholder="Enter step title"
        />
      </div>

      <div class="field">
        <label for="step-description"> Description </label>
        <textarea
          id="step-description"
          v-model="formData.description"
          rows="2"
          placeholder="Enter step description (optional)"
        />
      </div>

      <div class="buttons">
        <button type="button" :disabled="!isFormValid" class="primary" @click="handleSubmit">
          {{ submitButtonText }}
        </button>
        <button type="button" @click="handleCancel" class="secondary">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-editor {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  background-color: #f9fafb;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.125rem;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
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

.buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.primary,
.secondary {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
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
