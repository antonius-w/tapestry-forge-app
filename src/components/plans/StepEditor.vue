<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StepFormData } from '@/models/form-data';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
        <Label for="step-title"> Step title * </Label>
        <Input
          id="step-title"
          v-model="formData.title"
          type="text"
          placeholder="Enter step title"
        />
      </div>

      <div class="field">
        <Label for="step-description"> Description </Label>
        <Textarea
          id="step-description"
          v-model="formData.description"
          :rows="2"
          placeholder="Enter step description (optional)"
        />
      </div>

      <div class="buttons">
        <Button type="button" :disabled="!isFormValid" @click="handleSubmit">
          {{ submitButtonText }}
        </Button>
        <Button type="button" variant="secondary" @click="handleCancel">Cancel</Button>
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

.field {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
</style>
