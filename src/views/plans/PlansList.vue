<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlanStore } from '@/stores/plan-store';
import { RouteName } from '@/router/route-names';

const router = useRouter();
const planStore = usePlanStore();

function navigateToCreate(): void {
  router.push({ name: RouteName.plansNew });
}

function navigateToEdit(id: string): void {
  router.push({ name: RouteName.plansEdit, params: { id } });
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
    <div v-if="planStore.isLoading" class="loading">
      <p>Loading plans...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="planStore.hasError" class="error">
      <p>Error loading plans: {{ planStore.error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!planStore.hasPlans" class="empty">
      <p>No plans yet</p>
      <button @click="navigateToCreate" class="create">Create your first plan</button>
    </div>

    <!-- Plans list -->
    <div v-else class="grid">
      <div
        v-for="plan in planStore.plans"
        :key="plan.id"
        @click="navigateToEdit(plan.id)"
        class="card"
      >
        <h3>{{ plan.title }}</h3>
        <p v-if="plan.description" class="description">{{ plan.description }}</p>
        <div class="date-time">
          <span>{{ plan.date }}</span>
          <span v-if="plan.time" class="separator">at {{ plan.time }}</span>
        </div>
      </div>
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

.card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.card:hover {
  background-color: #f9fafb;
}

.card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
}

.date-time {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.separator {
  margin-left: 0.5rem;
}
</style>
