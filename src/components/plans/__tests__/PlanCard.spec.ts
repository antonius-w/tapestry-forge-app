import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import PlanCard from '@/components/plans/PlanCard.vue';
import { usePlanStore } from '@/stores/plan-store';
import { PlanRepository } from '@/repositories/plan-repository';
import type { Plan } from '@/models/plan';

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

const mockPlan: Plan = {
  id: 'test-id-123',
  title: 'Test Plan',
  description: 'Test description',
  date: '2026-10-05',
  time: '14:30',
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/plans' },
    { path: '/plans', component: { template: '<div>Plans List</div>' } },
    { path: '/plans/new', component: { template: '<div>Create Plan</div>' } },
    { path: '/plans/:id/edit', component: { template: '<div>Edit Plan</div>' } },
  ],
});

describe('PlanCard', () => {
  let testRepository: PlanRepository;
  let testStorage: InMemoryStorage;

  beforeEach(() => {
    setActivePinia(createPinia());
    testStorage = new InMemoryStorage();
    testRepository = new PlanRepository(testStorage);

    const store = usePlanStore();
    store.setRepository(testRepository);
  });

  it('mounts correctly with a plan', () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Plan');
    expect(wrapper.text()).toContain('Test description');
    expect(wrapper.text()).toContain('2026-10-05');
    expect(wrapper.text()).toContain('14:30');
  });

  it('displays plan without description correctly', () => {
    const planWithoutDescription: Plan = {
      id: 'test-id-456',
      title: 'Plan Without Description',
      date: '2026-10-06',
    };

    const wrapper = mount(PlanCard, {
      props: { plan: planWithoutDescription },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Plan Without Description');
    expect(wrapper.text()).not.toContain('Test description');
    expect(wrapper.text()).toContain('2026-10-06');
  });

  it('displays plan without time correctly', () => {
    const planWithoutTime: Plan = {
      id: 'test-id-789',
      title: 'Plan Without Time',
      date: '2026-10-07',
    };

    const wrapper = mount(PlanCard, {
      props: { plan: planWithoutTime },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Plan Without Time');
    expect(wrapper.text()).toContain('2026-10-07');
    expect(wrapper.text()).not.toContain('at');
  });

  it('has delete button', () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    const deleteButton = wrapper.find('button.delete-button');
    expect(deleteButton.exists()).toBe(true);
  });

  it('emits edit event when card is clicked', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    const card = wrapper.find('.plan-card');
    await card.trigger('click');

    // Should emit edit event with the plan ID
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual(['test-id-123']);
  });

  it('shows delete confirmation when delete button is clicked', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    expect(wrapper.text()).toContain('Delete Plan');
    expect(wrapper.text()).toContain('Are you sure you want to delete');
    expect(wrapper.text()).toContain('"Test Plan"');
  });

  it('hides delete confirmation when cancel is clicked', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    // Show confirmation
    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    // Cancel it
    const cancelButton = wrapper.find('button.cancel');
    await cancelButton.trigger('click');

    expect(wrapper.text()).not.toContain('Delete Plan');
  });

  it('emits delete event when delete is confirmed', async () => {
    // Add the plan to repository first
    const createdPlan = testRepository.create({
      title: 'Delete Me',
      date: '2026-10-05',
    });

    const wrapper = mount(PlanCard, {
      props: { plan: createdPlan },
      global: {
        plugins: [router],
      },
    });

    // Show confirmation
    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    // Confirm delete
    const confirmButton = wrapper.find('button.confirm');
    await confirmButton.trigger('click');

    // Check that the delete event was emitted
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual([createdPlan.id]);

    // Verify plan was actually deleted from repository
    const allPlans = testRepository.getAll();
    expect(allPlans).toHaveLength(0);
  });

  it('has delete confirmation modal with cancel and confirm buttons', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    // Show confirmation
    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    // Should show modal with both buttons
    expect(wrapper.find('button.cancel').exists()).toBe(true);
    expect(wrapper.find('button.confirm').exists()).toBe(true);
    expect(wrapper.text()).toContain('Are you sure you want to delete');
  });
});
