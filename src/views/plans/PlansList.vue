<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan-store';
import { storeToRefs } from 'pinia';
import { RouteName } from '@/router/route-names';
import PlanCard from '@/components/plans/PlanCard.vue';
import { Button } from '@/components/ui/button';
import { X } from '@lucide/vue';

const router = useRouter();
const planStore = usePlanStore();
const { isLoading, hasError, error, hasPlans, plans } = storeToRefs(planStore);

const successMessage = ref<string>('');

function navigateToCreate(): void {
  router.push({ name: RouteName.plansNew });
}

function navigateToEdit(id: string): void {
  router.push({ name: RouteName.plansEdit, params: { id } });
}

function handleDeleteSuccess(): void {
  successMessage.value = 'Plan deleted successfully';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
}

function clearSuccessMessage(): void {
  successMessage.value = '';
}

onMounted(() => {
  planStore.loadPlans();
});
</script>

<template>
  <div class="plans-list">
    <div class="header">
      <h1>Plans</h1>
      <Button @click="navigateToCreate">Create Plan</Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <p>Loading plans...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="error">
      <p>Error loading plans: {{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasPlans" class="empty">
      <p>No plans yet</p>
      <Button @click="navigateToCreate">Create your first plan</Button>
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="success">
      <p>{{ successMessage }}</p>
      <Button variant="ghost" size="icon-sm" @click="clearSuccessMessage">
        <X />
      </Button>
    </div>

    <!-- Plans list -->
    <div v-else class="grid">
      <PlanCard
        v-for="plan in plans"
        :key="plan.id"
        :plan="plan"
        @edit="navigateToEdit"
        @delete="handleDeleteSuccess"
      />
    </div>
  </div>
</template>

<style scoped>
.plans-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: bold;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 2rem;
}

.error {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  border-radius: 0.25rem;
  margin-bottom: 1.5rem;
}

.empty {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.empty p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success {
  background-color: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
