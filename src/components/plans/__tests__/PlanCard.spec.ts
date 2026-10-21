import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import PlanCard from '@/components/plans/PlanCard.vue';
import { AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
      attachTo: document.body,
      global: {
        plugins: [router],
      },
    });

    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    expect(document.body.textContent).toContain('Delete Plan');
    expect(document.body.textContent).toContain('Are you sure you want to delete');
    expect(document.body.textContent).toContain('"Test Plan"');

    wrapper.unmount();
  });

  it('hides delete confirmation when cancel is clicked', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      attachTo: document.body,
      global: {
        plugins: [router],
      },
    });

    // Show confirmation
    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    // Find and click cancel via component
    const cancelComponent = wrapper.findComponent(AlertDialogCancel);
    expect(cancelComponent.exists()).toBe(true);
    await cancelComponent.trigger('click');

    expect(document.body.textContent).not.toContain('Are you sure you want to delete');

    wrapper.unmount();
  });

  it('emits delete event when delete is confirmed', async () => {
    // Add the plan to repository first
    const createdPlan = testRepository.create({
      title: 'Delete Me',
      date: '2026-10-05',
    });

    const wrapper = mount(PlanCard, {
      props: { plan: createdPlan },
      attachTo: document.body,
      global: {
        plugins: [router],
      },
    });

    // Show confirmation
    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    // Find and click the Delete confirm button in the dialog
    const allButtons = wrapper.findAllComponents(Button);
    const confirmButton = allButtons.find((b) => b.text() === 'Delete');
    expect(confirmButton).toBeTruthy();
    await confirmButton!.trigger('click');
    await wrapper.vm.$nextTick();

    // Check that the delete event was emitted
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual([createdPlan.id]);

    // Verify plan was actually deleted from repository
    const allPlans = testRepository.getAll();
    expect(allPlans).toHaveLength(0);

    wrapper.unmount();
  });

  it('has delete confirmation dialog with cancel and confirm buttons', async () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      attachTo: document.body,
      global: {
        plugins: [router],
      },
    });

    // Show confirmation
    const deleteButton = wrapper.find('button.delete-button');
    await deleteButton.trigger('click');

    // Should show dialog with both buttons
    const cancelComponent = wrapper.findComponent(AlertDialogCancel);
    expect(cancelComponent.exists()).toBe(true);
    expect(cancelComponent.text()).toBe('Cancel');

    const allButtons = wrapper.findAllComponents(Button);
    const confirmBtn = allButtons.find((b) => b.text() === 'Delete');
    expect(confirmBtn).toBeTruthy();
    expect(document.body.textContent).toContain('Are you sure you want to delete');

    wrapper.unmount();
  });

  it('does not show step badge when plan has no steps', () => {
    const wrapper = mount(PlanCard, {
      props: { plan: mockPlan },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('.step-badge').exists()).toBe(false);
  });

  it('shows step count badge when plan has steps', () => {
    const planWithSteps: Plan = {
      ...mockPlan,
      steps: [
        { id: 's1', title: 'Step 1', order: 0 },
        { id: 's2', title: 'Step 2', order: 1 },
        { id: 's3', title: 'Step 3', order: 2 },
      ],
    };

    const wrapper = mount(PlanCard, {
      props: { plan: planWithSteps },
      global: {
        plugins: [router],
      },
    });

    const badge = wrapper.find('.step-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('3 steps');
  });

  it('shows singular step label for a single step', () => {
    const planWithOneStep: Plan = {
      ...mockPlan,
      steps: [{ id: 's1', title: 'Only step', order: 0 }],
    };

    const wrapper = mount(PlanCard, {
      props: { plan: planWithOneStep },
      global: {
        plugins: [router],
      },
    });

    const badge = wrapper.find('.step-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('1 step');
  });
});
