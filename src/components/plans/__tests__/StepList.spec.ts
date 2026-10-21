import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StepList from '@/components/plans/StepList.vue';
import type { Step } from '@/models/step';

function createSteps(): Step[] {
  return [
    { id: 'step-1', title: 'First step', description: 'First description', order: 0 },
    { id: 'step-2', title: 'Second step', order: 1 },
    { id: 'step-3', title: 'Third step', description: 'Third description', order: 2 },
  ];
}

describe('StepList', () => {
  it('mounts correctly with steps', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders all steps in order', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    expect(items).toHaveLength(3);

    expect(items[0]?.text()).toContain('First step');
    expect(items[1]?.text()).toContain('Second step');
    expect(items[2]?.text()).toContain('Third step');
  });

  it('displays step numbers starting from 1', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const numbers = wrapper.findAll('.step-number');
    expect(numbers[0]?.text()).toBe('1.');
    expect(numbers[1]?.text()).toBe('2.');
    expect(numbers[2]?.text()).toBe('3.');
  });

  it('displays step descriptions when present', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    expect(items[0]?.text()).toContain('First description');
    expect(items[1]?.text()).not.toContain('description');
    expect(items[2]?.text()).toContain('Third description');
  });

  it('renders steps sorted by order regardless of array order', () => {
    const unorderedSteps: Step[] = [
      { id: 'step-3', title: 'Third', order: 2 },
      { id: 'step-1', title: 'First', order: 0 },
      { id: 'step-2', title: 'Second', order: 1 },
    ];

    const wrapper = mount(StepList, {
      props: { steps: unorderedSteps },
    });

    const items = wrapper.findAll('.step-item');
    expect(items[0]?.text()).toContain('First');
    expect(items[1]?.text()).toContain('Second');
    expect(items[2]?.text()).toContain('Third');
  });

  it('emits edit event with step id when edit button is clicked', async () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const editButtons = wrapper.findAll('button.edit');
    await editButtons[0]?.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual(['step-1']);
  });

  it('emits delete event with step id when delete button is clicked', async () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const deleteButtons = wrapper.findAll('button.delete');
    await deleteButtons[1]?.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['step-2']);
  });

  it('emits move-up event with step id when move up button is clicked', async () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    const upButton = items[1]?.find('.step-actions button[title="Move up"]');

    await upButton?.trigger('click');

    expect(wrapper.emitted('move-up')).toBeTruthy();
    expect(wrapper.emitted('move-up')?.[0]).toEqual(['step-2']);
  });

  it('emits move-down event with step id when move down button is clicked', async () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    const downButton = items[0]?.find('.step-actions button[title="Move down"]');

    await downButton?.trigger('click');

    expect(wrapper.emitted('move-down')).toBeTruthy();
    expect(wrapper.emitted('move-down')?.[0]).toEqual(['step-1']);
  });

  it('disables move up button for first step', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    const upButton = items[0]?.find('.step-actions button[title="Move up"]');

    expect(upButton?.attributes('disabled')).toBeDefined();
  });

  it('disables move down button for last step', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    const downButton = items[2]?.find('.step-actions button[title="Move down"]');

    expect(downButton?.attributes('disabled')).toBeDefined();
  });

  it('enables move up button for non-first steps', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    const upButton = items[1]?.find('.step-actions button[title="Move up"]');

    expect(upButton?.attributes('disabled')).toBeUndefined();
  });

  it('enables move down button for non-last steps', () => {
    const wrapper = mount(StepList, {
      props: { steps: createSteps() },
    });

    const items = wrapper.findAll('.step-item');
    const downButton = items[1]?.find('.step-actions button[title="Move down"]');

    expect(downButton?.attributes('disabled')).toBeUndefined();
  });

  it('renders empty list when no steps provided', () => {
    const wrapper = mount(StepList, {
      props: { steps: [] },
    });

    expect(wrapper.findAll('.step-item')).toHaveLength(0);
  });

  it('handles single step correctly', () => {
    const singleStep: Step[] = [{ id: 'step-1', title: 'Only step', order: 0 }];

    const wrapper = mount(StepList, {
      props: { steps: singleStep },
    });

    const items = wrapper.findAll('.step-item');
    expect(items).toHaveLength(1);

    const upButton = items[0]?.find('.step-actions button[title="Move up"]');
    const downButton = items[0]?.find('.step-actions button[title="Move down"]');
    expect(upButton?.attributes('disabled')).toBeDefined();
    expect(downButton?.attributes('disabled')).toBeDefined();
  });

  describe('execution state', () => {
    it('renders a checkbox for each step', () => {
      const wrapper = mount(StepList, {
        props: { steps: createSteps() },
      });

      const checkboxes = wrapper.findAll('.step-checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('emits toggle-complete event when checkbox is clicked', async () => {
      const wrapper = mount(StepList, {
        props: { steps: createSteps() },
      });

      const checkbox = wrapper.find('.step-checkbox');
      await checkbox.trigger('click');

      expect(wrapper.emitted('toggle-complete')).toBeTruthy();
      expect(wrapper.emitted('toggle-complete')?.[0]).toEqual(['step-1']);
    });

    it('emits toggle-complete with correct step id for each checkbox', async () => {
      const wrapper = mount(StepList, {
        props: { steps: createSteps() },
      });

      const checkboxes = wrapper.findAll('.step-checkbox');
      await checkboxes[1]?.trigger('click');

      expect(wrapper.emitted('toggle-complete')?.[0]).toEqual(['step-2']);
    });

    it('applies completed class to completed steps', () => {
      const stepsWithCompleted: Step[] = [
        { id: 'step-1', title: 'Done', order: 0, completed: true },
        { id: 'step-2', title: 'Pending', order: 1 },
      ];

      const wrapper = mount(StepList, {
        props: { steps: stepsWithCompleted },
      });

      const items = wrapper.findAll('.step-item');
      expect(items[0]?.classes()).toContain('completed');
      expect(items[1]?.classes()).not.toContain('completed');
    });

    it('does not apply completed class to steps without completed state', () => {
      const wrapper = mount(StepList, {
        props: { steps: createSteps() },
      });

      const items = wrapper.findAll('.step-item');
      for (const item of items) {
        expect(item.classes()).not.toContain('completed');
      }
    });

    it('renders checkbox as checked for completed steps', () => {
      const stepsWithCompleted: Step[] = [
        { id: 'step-1', title: 'Done', order: 0, completed: true },
      ];

      const wrapper = mount(StepList, {
        props: { steps: stepsWithCompleted },
      });

      const checkbox = wrapper.find('.step-checkbox');
      expect(checkbox.attributes('data-state')).toBe('checked');
    });

    it('renders checkbox as unchecked for incomplete steps', () => {
      const wrapper = mount(StepList, {
        props: { steps: createSteps() },
      });

      const checkbox = wrapper.find('.step-checkbox');
      expect(checkbox.attributes('data-state')).toBe('unchecked');
    });
  });
});
