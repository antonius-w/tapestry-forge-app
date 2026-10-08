<script setup lang="ts">
import { ref } from 'vue';
import { usePlanStore } from '@/stores/plan-store';
import { storeToRefs } from 'pinia';
import type { Plan } from '@/models/plan';

const { plan } = defineProps<{
  plan: Plan;
}>();

const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const planStore = usePlanStore();
const { isDeleting: storeIsDeleting } = storeToRefs(planStore);

const isDeletingLocal = ref<boolean>(false);
const deleteError = ref<string>('');
const showDeleteConfirm = ref<boolean>(false);

function handleCardClick(): void {
  emit('edit', plan.id);
}

async function handleDelete(): Promise<void> {
  showDeleteConfirm.value = false;
  deleteError.value = '';
  isDeletingLocal.value = true;

  try {
    const success = planStore.deletePlan(plan.id);
    if (success) {
      emit('delete', plan.id);
      return;
    }
    deleteError.value = 'Failed to delete plan';
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete plan';
  } finally {
    isDeletingLocal.value = false;
  }
}
</script>

<template>
  <div class="plan-card" @click="handleCardClick">
    <div class="content">
      <h3 class="title">{{ plan.title }}</h3>
      <p v-if="plan.description" class="description">{{ plan.description }}</p>
      <div class="date-time">
        <span class="date">{{ plan.date }}</span>
        <span v-if="plan.time" class="time">at {{ plan.time }}</span>
      </div>
    </div>

    <div class="actions" @click.stop>
      <button
        @click="showDeleteConfirm = true"
        class="delete-button"
        :disabled="isDeletingLocal || storeIsDeleting"
        title="Delete plan"
      >
        ×
      </button>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.stop="showDeleteConfirm = false">
      <div class="modal" @click.stop>
        <h4>Delete Plan</h4>
        <p>Are you sure you want to delete "{{ plan.title }}"?</p>
        <div class="modal-actions">
          <button
            @click="showDeleteConfirm = false"
            class="cancel"
            :disabled="isDeletingLocal || storeIsDeleting"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            class="confirm"
            :disabled="isDeletingLocal || storeIsDeleting"
          >
            {{ isDeletingLocal ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
        <div v-if="deleteError" class="error">{{ deleteError }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-card:hover {
  background-color: #f9fafb;
  transform: translateY(-1px);
}

.content {
  flex: 1;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.date-time {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.time {
  margin-left: 0.5rem;
}

.actions {
  margin-left: 1rem;
}

.delete-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
  border-radius: 0.25rem;
}

.delete-button:hover {
  color: #6b7280;
  background-color: #fee2e2;
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal h4 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.modal p {
  color: #6b7280;
  margin: 0 0 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-actions .cancel {
  background-color: #e5e7eb;
  color: #374151;
  border: none;
}

.modal-actions .cancel:hover {
  background-color: #d1d5db;
}

.modal-actions .confirm {
  background-color: #ef4444;
  color: white;
  border: none;
}

.modal-actions .confirm:hover {
  background-color: #dc2626;
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #991b1b;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
