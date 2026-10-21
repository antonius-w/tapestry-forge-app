import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StepEditor from '@/components/plans/StepEditor.vue';
import type { StepFormData } from '@/models/form-data';

describe('StepEditor', () => {
  it('mounts correctly in add mode', () => {
    const wrapper = mount(StepEditor);

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Add Step');
  });

  it('mounts correctly in edit mode', () => {
    const step: StepFormData = {
      id: 'step-1',
      title: 'Existing step',
      description: 'Existing description',
      order: 0,
    };

    const wrapper = mount(StepEditor, {
      props: { step },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Save Step');

    expect(wrapper.find('input[type="text"]').element).toHaveProperty('value', 'Existing step');
  });

  it('has form fields for title and description', () => {
    const wrapper = mount(StepEditor);

    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('disables submit button when title is empty', async () => {
    const wrapper = mount(StepEditor);

    const submitButton = wrapper.find('button.primary');
    expect(submitButton.attributes('disabled')).toBeDefined();

    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('Some title');

    expect(submitButton.attributes('disabled')).toBeUndefined();
  });

  it('emits save event with form data when submitted', async () => {
    const wrapper = mount(StepEditor);

    const titleInput = wrapper.find('input[type="text"]');
    const descriptionInput = wrapper.find('textarea');

    await titleInput.setValue('New step title');
    await descriptionInput.setValue('New step description');

    const submitButton = wrapper.find('button.primary');
    await submitButton.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();

    const saveEvents = wrapper.emitted('save');
    expect(saveEvents).toHaveLength(1);
    expect(saveEvents?.[0]?.[0]).toMatchObject({
      title: 'New step title',
      description: 'New step description',
    });
  });

  it('emits save event with undefined description when description is empty', async () => {
    const wrapper = mount(StepEditor);

    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('Step without description');

    const submitButton = wrapper.find('button.primary');
    await submitButton.trigger('click');

    const saveEvents = wrapper.emitted('save');
    expect(saveEvents?.[0]?.[0]).toMatchObject({
      title: 'Step without description',
      description: undefined,
    });
  });

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(StepEditor);

    const buttons = wrapper.findAll('button');
    const cancelButton = buttons.find((b) => b.text() === 'Cancel');

    expect(cancelButton).toBeTruthy();
    await cancelButton!.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('preserves step id and order in edit mode when saving', async () => {
    const step: StepFormData = {
      id: 'step-1',
      title: 'Original title',
      description: '',
      order: 2,
    };

    const wrapper = mount(StepEditor, {
      props: { step },
    });

    const titleInput = wrapper.find('input[type="text"]');
    await titleInput.setValue('Updated title');

    const submitButton = wrapper.find('button.primary');
    await submitButton.trigger('click');

    const saveEvents = wrapper.emitted('save');
    expect(saveEvents?.[0]?.[0]).toMatchObject({
      id: 'step-1',
      order: 2,
      title: 'Updated title',
    });
  });

  it('populates form fields from step prop', () => {
    const step: StepFormData = {
      id: 'step-1',
      title: 'Pre-filled title',
      description: 'Pre-filled description',
      order: 0,
    };

    const wrapper = mount(StepEditor, {
      props: { step },
    });

    expect(wrapper.find('input[type="text"]').element).toHaveProperty('value', 'Pre-filled title');
    expect(wrapper.find('textarea').element).toHaveProperty('value', 'Pre-filled description');
  });

  it('resets form when step prop changes from defined to undefined', async () => {
    const step: StepFormData = {
      id: 'step-1',
      title: 'Original',
      description: 'Desc',
      order: 0,
    };

    const wrapper = mount(StepEditor, {
      props: { step },
    });

    await wrapper.setProps({ step: undefined });

    expect(wrapper.find('input[type="text"]').element).toHaveProperty('value', '');
  });
});
