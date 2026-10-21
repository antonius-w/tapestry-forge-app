<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePlanStore } from '@/stores/plan-store';
import { storeToRefs } from 'pinia';
import type { Plan } from '@/models/plan';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { X } from '@lucide/vue';

const { plan } = defineProps<{
  plan: Plan;
}>();

const stepCount = computed(() => plan.steps?.length ?? 0);

const stepCountLabel = computed(() => {
  const count = stepCount.value;

  return count === 1 ? '1 step' : `${count} steps`;
});

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
  <Card class="plan-card" @click="handleCardClick">
    <CardHeader class="plan-card-header">
      <div class="plan-card-header-row">
        <div class="plan-card-titles">
          <CardTitle>{{ plan.title }}</CardTitle>
          <CardDescription v-if="plan.description">{{ plan.description }}</CardDescription>
        </div>
        <div class="actions" @click.stop>
          <AlertDialog v-model:open="showDeleteConfirm">
            <AlertDialogTrigger as-child>
              <Button
                variant="ghost"
                size="icon-sm"
                class="delete-button"
                :disabled="isDeletingLocal || storeIsDeleting"
                title="Delete plan"
              >
                <X />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{{ plan.title }}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel :disabled="isDeletingLocal || storeIsDeleting">
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  :disabled="isDeletingLocal || storeIsDeleting"
                  @click="handleDelete"
                >
                  {{ isDeletingLocal ? 'Deleting...' : 'Delete' }}
                </Button>
              </AlertDialogFooter>
              <div v-if="deleteError" class="error">{{ deleteError }}</div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </CardHeader>
    <CardContent class="plan-card-content">
      <div class="date-time">
        <span class="date">{{ plan.date }}</span>
        <span v-if="plan.time" class="time">at {{ plan.time }}</span>
        <span v-if="stepCount > 0" class="step-badge">{{ stepCountLabel }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.plan-card {
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.plan-card:hover {
  background-color: #f9fafb;
  transform: translateY(-1px);
}

.plan-card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-card-titles {
  flex: 1;
}

.plan-card-content {
  padding-top: 0;
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

.step-badge {
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  background-color: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.actions {
  margin-left: 1rem;
}

.error {
  color: #991b1b;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
