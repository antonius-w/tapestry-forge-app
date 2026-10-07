<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan-store';
import { storeToRefs } from 'pinia';
import { RouteName } from '@/router/route-names';
import PlanCard from '@/components/plans/PlanCard.vue';

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
      <button @click="navigateToCreate" class="create">Create Plan</button>
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
      <button @click="navigateToCreate" class="create">Create your first plan</button>
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="success">
      <p>{{ successMessage }}</p>
      <button @click="clearSuccessMessage" class="close-success">×</button>
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

.create {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.create:hover {
  background-color: #2563eb;
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

.close-success {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #065f46;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-success:hover {
  opacity: 0.7;
}
</style>
