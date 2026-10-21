import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import PlanForm from '@/views/plans/PlanForm.vue';
import { usePlanStore } from '@/stores/plan-store';
import { PlanRepository } from '@/repositories/plan-repository';
import { RouteName } from '@/router/route-names';

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
      { path: '/', redirect: '/plans' },
      { path: '/plans', name: RouteName.plans, component: { template: '<div>Plans List</div>' } },
      { path: '/plans/new', name: RouteName.plansNew, component: PlanForm },
      { path: '/plans/:id/edit', name: RouteName.plansEdit, component: PlanForm },
    ],
  });

  beforeEach(async () => {
    setActivePinia(createPinia());
    testStorage = new InMemoryStorage();
    testRepository = new PlanRepository(testStorage);

    const store = usePlanStore();
    store.setRepository(testRepository);

    await router.push({ name: RouteName.plansNew });
    await router.isReady();
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
    const cancelButton = buttons.find((b) => b.text() === 'Cancel');
    expect(cancelButton).toBeTruthy();
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

  describe('step management', () => {
    it('shows steps section collapsed by default', () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      expect(stepsToggle.exists()).toBe(true);
      expect(stepsToggle.text()).toContain('Add steps');
      expect(wrapper.find('.steps-content').exists()).toBe(false);
    });

    it('expands steps section when toggle is clicked', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      expect(wrapper.find('.steps-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('No steps yet');
    });

    it('shows step editor when add step button is clicked', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      expect(wrapper.find('.step-editor').exists()).toBe(true);
    });

    it('adds a step when step editor saves', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('First step');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      expect(wrapper.find('.step-list').exists()).toBe(true);
      expect(wrapper.text()).toContain('First step');
    });

    it('deletes a step when delete is triggered', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Step to delete');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      expect(wrapper.text()).toContain('Step to delete');

      const deleteButton = wrapper.find('.step-item button.delete');
      await deleteButton.trigger('click');

      expect(wrapper.text()).not.toContain('Step to delete');
      expect(wrapper.text()).toContain('No steps yet');
    });

    it('saves steps with the plan on submit', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const titleInput = wrapper.find('input[type="text"]');
      const dateInput = wrapper.find('input[type="date"]');

      await titleInput.setValue('Plan with steps');
      await dateInput.setValue('2026-12-01');

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Step one');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      const allPlans = testRepository.getAll();
      expect(allPlans).toHaveLength(1);
      expect(allPlans[0]!.steps).toBeDefined();
      expect(allPlans[0]!.steps).toHaveLength(1);
      expect(allPlans[0]!.steps![0]!.title).toBe('Step one');
      expect(allPlans[0]!.steps![0]!.order).toBe(0);
    });

    it('creates plan without steps when no steps are added', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const titleInput = wrapper.find('input[type="text"]');
      const dateInput = wrapper.find('input[type="date"]');

      await titleInput.setValue('Simple plan');
      await dateInput.setValue('2026-12-01');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      const allPlans = testRepository.getAll();
      expect(allPlans).toHaveLength(1);
      expect(allPlans[0]!.steps).toBeUndefined();
    });

    it('loads existing steps when editing a plan', async () => {
      const existingPlan = testRepository.create({
        title: 'Existing plan',
        date: '2026-12-01',
        steps: [
          { id: 's1', title: 'Existing step 1', order: 0 },
          { id: 's2', title: 'Existing step 2', description: 'Has description', order: 1 },
        ],
      });

      await router.push(`/plans/${existingPlan.id}/edit`);
      await router.isReady();

      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.steps-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Existing step 1');
      expect(wrapper.text()).toContain('Existing step 2');
      expect(wrapper.text()).toContain('Has description');
    });

    it('auto-expands steps section when editing a plan with steps', async () => {
      const existingPlan = testRepository.create({
        title: 'Plan with steps',
        date: '2026-12-01',
        steps: [{ id: 's1', title: 'A step', order: 0 }],
      });

      await router.push(`/plans/${existingPlan.id}/edit`);
      await router.isReady();

      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      await wrapper.vm.$nextTick();

      const stepsToggle = wrapper.find('.steps-toggle');
      expect(stepsToggle.text()).toContain('Steps (1)');
      expect(wrapper.find('.steps-content').exists()).toBe(true);
    });

    it('updates steps when editing an existing plan', async () => {
      const existingPlan = testRepository.create({
        title: 'Plan to update',
        date: '2026-12-01',
        steps: [{ id: 's1', title: 'Original step', order: 0 }],
      });

      await router.push(`/plans/${existingPlan.id}/edit`);
      await router.isReady();

      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      await wrapper.vm.$nextTick();

      const editButton = wrapper.find('.step-item button.edit');
      await editButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Updated step');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Save Step');
      await saveButton!.trigger('click');

      expect(wrapper.text()).toContain('Updated step');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      const updatedPlan = testRepository.getById(existingPlan.id);
      expect(updatedPlan?.steps).toHaveLength(1);
      expect(updatedPlan?.steps![0]!.title).toBe('Updated step');
      expect(updatedPlan?.steps![0]!.id).toBe('s1');
    });

    it('moves steps up and down', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');

      await addButton.trigger('click');
      let stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Step A');
      let stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      let saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      await addButton.trigger('click');
      stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Step B');
      stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      const items = wrapper.findAll('.step-item');
      expect(items[0]?.text()).toContain('Step A');
      expect(items[1]?.text()).toContain('Step B');

      const moveDownButton = items[0]?.find('.step-actions button[title="Move down"]');
      await moveDownButton?.trigger('click');

      const reorderedItems = wrapper.findAll('.step-item');
      expect(reorderedItems[0]?.text()).toContain('Step B');
      expect(reorderedItems[1]?.text()).toContain('Step A');
    });

    it('toggles step completion when checkbox is clicked', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Step to complete');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      const stepItem = wrapper.find('.step-item');
      expect(stepItem.classes()).not.toContain('completed');

      const checkbox = wrapper.find('.step-checkbox');
      await checkbox.trigger('click');

      const updatedItem = wrapper.find('.step-item');
      expect(updatedItem.classes()).toContain('completed');
    });

    it('toggles step completion back to incomplete', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Toggle step');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      const checkbox = wrapper.find('.step-checkbox');
      await checkbox.trigger('click');
      expect(wrapper.find('.step-item').classes()).toContain('completed');

      const checkboxAgain = wrapper.find('.step-checkbox');
      await checkboxAgain.trigger('click');
      expect(wrapper.find('.step-item').classes()).not.toContain('completed');
    });

    it('saves step completion state with the plan on submit', async () => {
      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      const titleInput = wrapper.find('input[type="text"]');
      const dateInput = wrapper.find('input[type="date"]');

      await titleInput.setValue('Plan with completion');
      await dateInput.setValue('2026-12-01');

      const stepsToggle = wrapper.find('.steps-toggle');
      await stepsToggle.trigger('click');

      const addButton = wrapper.find('.add-step-button');
      await addButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Step one');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Add Step');
      await saveButton!.trigger('click');

      const checkbox = wrapper.find('.step-checkbox');
      await checkbox.trigger('click');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      const allPlans = testRepository.getAll();
      expect(allPlans).toHaveLength(1);
      expect(allPlans[0]!.steps).toHaveLength(1);
      expect(allPlans[0]!.steps![0]!.completed).toBe(true);
    });

    it('loads step completion state when editing a plan', async () => {
      const existingPlan = testRepository.create({
        title: 'Plan with completed step',
        date: '2026-12-01',
        steps: [
          { id: 's1', title: 'Done step', order: 0, completed: true },
          { id: 's2', title: 'Pending step', order: 1 },
        ],
      });

      await router.push(`/plans/${existingPlan.id}/edit`);
      await router.isReady();

      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      await wrapper.vm.$nextTick();

      const items = wrapper.findAll('.step-item');
      expect(items[0]?.classes()).toContain('completed');
      expect(items[1]?.classes()).not.toContain('completed');
    });

    it('preserves completion state when editing a step', async () => {
      const existingPlan = testRepository.create({
        title: 'Plan with completed step',
        date: '2026-12-01',
        steps: [{ id: 's1', title: 'Done step', order: 0, completed: true }],
      });

      await router.push(`/plans/${existingPlan.id}/edit`);
      await router.isReady();

      const wrapper = mount(PlanForm, {
        global: {
          plugins: [router],
        },
      });

      await wrapper.vm.$nextTick();

      const editButton = wrapper.find('.step-item button.edit');
      await editButton.trigger('click');

      const stepTitleInput = wrapper.find('.step-editor input[type="text"]');
      await stepTitleInput.setValue('Updated title');

      const stepEditorButtons = wrapper.find('.step-editor').findAll('button');
      const saveButton = stepEditorButtons.find((b) => b.text() === 'Save Step');
      await saveButton!.trigger('click');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      const updatedPlan = testRepository.getById(existingPlan.id);
      expect(updatedPlan?.steps![0]!.title).toBe('Updated title');
      expect(updatedPlan?.steps![0]!.completed).toBe(true);
    });
  });
});
