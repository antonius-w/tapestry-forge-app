<script setup lang="ts">
import { computed } from 'vue';
import type { Step } from '@/models/step';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Pencil, X } from '@lucide/vue';

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
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :disabled="isFirst(step)"
          title="Move up"
          @click="handleMoveUp(step.id)"
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :disabled="isLast(step)"
          title="Move down"
          @click="handleMoveDown(step.id)"
        >
          <ChevronDown />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          class="edit"
          title="Edit step"
          @click="handleEdit(step.id)"
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          class="delete"
          title="Delete step"
          @click="handleDelete(step.id)"
        >
          <X />
        </Button>
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

.step-actions :deep(.edit:hover) {
  color: #2563eb;
  background-color: #eff6ff;
}

.step-actions :deep(.delete:hover) {
  color: #dc2626;
  background-color: #fee2e2;
}
</style>
