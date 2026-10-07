import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import PlanForm from '@/views/plans/PlanForm.vue';
import { usePlanStore } from '@/stores/plan-store';
import { PlanRepository } from '@/repositories/plan-repository';

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

describe('PlanForm', () => {
  let testRepository: PlanRepository;
  let testStorage: InMemoryStorage;

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/plans', component: { template: '<div>Plans List</div>' } },
      { path: '/plans/new', component: PlanForm },
      { path: '/plans/:id/edit', component: PlanForm },
    ],
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    testStorage = new InMemoryStorage();
    testRepository = new PlanRepository(testStorage);

    const store = usePlanStore();
    store.setRepository(testRepository);
  });

  it('mounts correctly for create mode', () => {
    const wrapper = mount(PlanForm, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Create Plan');
  });

  it('has form fields for title, description, date, and time', () => {
    const wrapper = mount(PlanForm, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('input[type="text"]').exists()).toBe(true); // title
    expect(wrapper.find('textarea').exists()).toBe(true); // description
    expect(wrapper.find('input[type="date"]').exists()).toBe(true); // date
    expect(wrapper.find('input[type="time"]').exists()).toBe(true); // time
  });

  it('shows validation error when title is empty', async () => {
    const wrapper = mount(PlanForm, {
      global: {
        plugins: [router],
      },
    });

    // Set empty title and submit
    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.text()).toContain('Title and date are required');
  });

  it('shows validation error when date is empty', async () => {
    const wrapper = mount(PlanForm, {
      global: {
        plugins: [router],
      },
    });

    // Set empty date and submit
    const dateInput = wrapper.find('input[type="date"]');
    await dateInput.setValue('');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.text()).toContain('Title and date are required');
  });

  it('has cancel button', () => {
    const wrapper = mount(PlanForm, {
      global: {
        plugins: [router],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(buttons[1]?.text()).toContain('Cancel');
  });

  it('creates new plan when form is submitted with valid data', async () => {
    const wrapper = mount(PlanForm, {
      global: {
        plugins: [router],
      },
    });

    // Fill in form data
    const titleInput = wrapper.find('input[type="text"]');
    const descriptionInput = wrapper.find('textarea');
    const dateInput = wrapper.find('input[type="date"]');
    const timeInput = wrapper.find('input[type="time"]');

    await titleInput.setValue('New Test Plan');
    await descriptionInput.setValue('New description');
    await dateInput.setValue('2026-12-01');
    await timeInput.setValue('15:30');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    // Verify plan was created
    const allPlans = testRepository.getAll();
    expect(allPlans).toHaveLength(1);
    expect(allPlans[0]!.title).toBe('New Test Plan');
    expect(allPlans[0]!.description).toBe('New description');
    expect(allPlans[0]!.date).toBe('2026-12-01');
    expect(allPlans[0]!.time).toBe('15:30');
  });
});
