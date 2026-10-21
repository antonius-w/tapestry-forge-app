<script setup lang="ts">
import { computed } from 'vue';
import type { Step } from '@/models/step';

const { steps } = defineProps<{
  steps: Step[];
}>();

const emit = defineEmits<{
  (e: 'edit', stepId: string): void;
  (e: 'delete', stepId: string): void;
  (e: 'move-up', stepId: string): void;
  (e: 'move-down', stepId: string): void;
}>();

const sortedSteps = computed(() => steps.toSorted((a: Step, b: Step) => a.order - b.order));

function isFirst(step: Step): boolean {
  return step.order === 0;
}

function isLast(step: Step): boolean {
  return step.order === steps.length - 1;
}

function handleEdit(stepId: string): void {
  emit('edit', stepId);
}

function handleDelete(stepId: string): void {
  emit('delete', stepId);
}

function handleMoveUp(stepId: string): void {
  emit('move-up', stepId);
}

function handleMoveDown(stepId: string): void {
  emit('move-down', stepId);
}
</script>

<template>
  <div class="step-list">
    <div v-for="step in sortedSteps" :key="step.id" class="step-item">
      <span class="step-number">{{ step.order + 1 }}.</span>

      <div class="step-content">
        <span class="step-title">{{ step.title }}</span>
        <span v-if="step.description" class="step-description">{{ step.description }}</span>
      </div>

      <div class="step-actions">
        <button
          type="button"
          class="action-button"
          :disabled="isFirst(step)"
          title="Move up"
          @click="handleMoveUp(step.id)"
        >
          ↑
        </button>
        <button
          type="button"
          class="action-button"
          :disabled="isLast(step)"
          title="Move down"
          @click="handleMoveDown(step.id)"
        >
          ↓
        </button>
        <button
          type="button"
          class="action-button edit"
          title="Edit step"
          @click="handleEdit(step.id)"
        >
          ✎
        </button>
        <button
          type="button"
          class="action-button delete"
          title="Delete step"
          @click="handleDelete(step.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: #ffffff;
}

.step-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  min-width: 1.5rem;
  padding-top: 0.125rem;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.step-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.step-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-button {
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  line-height: 1;
  border-radius: 0.25rem;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.action-button:hover:not(:disabled) {
  color: #374151;
  background-color: #f3f4f6;
}

.action-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-button.edit:hover:not(:disabled) {
  color: #2563eb;
  background-color: #eff6ff;
}

.action-button.delete:hover:not(:disabled) {
  color: #dc2626;
  background-color: #fee2e2;
}
</style>
