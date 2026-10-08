import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import PlansList from '@/views/plans/PlansList.vue';
import { usePlanStore } from '@/stores/plan-store';
import { PlanRepository } from '@/repositories/plan-repository';
import type { Plan } from '@/models/plan';
import PlanCard from '@/components/plans/PlanCard.vue';

/**
 * In-memory storage implementation for testing.
 */
class InMemoryStorage implements Storage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  key(_index: number): string | null {
    return null;
  }
}

describe('PlansList', () => {
  let testRepository: PlanRepository;
  let testStorage: InMemoryStorage;

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/plans', component: PlansList },
      { path: '/plans/new', component: { template: '<div>Create Plan</div>' } },
      { path: '/plans/:id/edit', component: { template: '<div>Edit Plan</div>' } },
    ],
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    testStorage = new InMemoryStorage();
    testRepository = new PlanRepository(testStorage);

    // Inject test repository into the store
    const store = usePlanStore();
    store.setRepository(testRepository);
  });

  it('mounts correctly', () => {
    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Plans');
    expect(wrapper.text()).toContain('Create Plan');
  });

  it('displays empty state when no plans exist', async () => {
    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    // Wait for component to mount and load plans
    await wrapper.vm.$nextTick();

    // Since we haven't added any plans, it should show empty state
    expect(wrapper.text()).toContain('No plans yet');
    expect(wrapper.text()).toContain('Create your first plan');
  });

  it('displays plans when they exist', async () => {
    // Add a test plan
    testRepository.create({
      title: 'Test Plan',
      date: '2026-10-05',
      description: 'Test description',
      time: '14:30',
    });

    const store = usePlanStore();
    store.loadPlans();

    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Test Plan');
    expect(wrapper.text()).toContain('Test description');
    expect(wrapper.text()).toContain('2026-10-05');
    expect(wrapper.text()).toContain('14:30');
  });

  it('has create plan button', async () => {
    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    // Find the create button
    const createButton = wrapper.find('button');
    expect(createButton.exists()).toBe(true);
    expect(createButton.text()).toContain('Create Plan');
  });

  it('displays error state when plan loading fails', async () => {
    // Create a failing repository
    class FailingRepository extends PlanRepository {
      getAll(): Plan[] {
        throw new Error('Storage corrupted');
      }
    }

    const failingRepository = new FailingRepository(testStorage);
    const store = usePlanStore();
    store.setRepository(failingRepository);

    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    // Wait for component to mount and attempt to load plans
    await wrapper.vm.$nextTick();

    // Should show error state
    expect(wrapper.text()).toContain('Error loading plans');
    expect(wrapper.text()).toContain('Storage corrupted');

    // Should NOT show loading state
    expect(wrapper.text()).not.toContain('Loading plans...');

    // Should NOT show empty state (which would be misleading)
    expect(wrapper.text()).not.toContain('No plans yet');
  });

  it('does not show empty state when loading failed', async () => {
    // Create a failing repository
    class FailingRepository extends PlanRepository {
      getAll(): Plan[] {
        throw new Error('Load failed');
      }
    }

    const failingRepository = new FailingRepository(testStorage);
    const store = usePlanStore();
    store.setRepository(failingRepository);

    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    // Verify we show error, not empty state
    expect(wrapper.text()).toContain('Error loading plans');
    expect(wrapper.text()).not.toContain('No plans yet');
  });

  it('renders PlanCard components for each plan', async () => {
    // Add a test plan
    testRepository.create({
      title: 'Test Plan',
      date: '2026-10-05',
      description: 'Test description',
      time: '14:30',
    });

    const store = usePlanStore();
    store.loadPlans();

    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
        stubs: {
          PlanCard: true, // Stub PlanCard to test rendering
        },
      },
    });

    await wrapper.vm.$nextTick();

    // Should render PlanCard component
    expect(wrapper.findComponent(PlanCard).exists()).toBe(true);
  });

  it('shows success message when plan is deleted', async () => {
    // Add a test plan
    testRepository.create({
      title: 'Delete Me',
      date: '2026-10-05',
    });

    const store = usePlanStore();
    store.loadPlans();

    const wrapper = mount(PlansList, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    // Find the PlanCard and trigger delete
    const planCard = wrapper.findComponent(PlanCard);
    expect(planCard.exists()).toBe(true);

    // Trigger delete from PlanCard - we'll simulate the emitted event
    await planCard.vm.$emit('delete', 'delete-me-id');

    // Should show success message briefly
    expect(wrapper.text()).toContain('Plan deleted successfully');
  });
});
