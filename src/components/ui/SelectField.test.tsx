import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { createRef } from 'react';
import SelectField, { SelectFieldHandle } from './SelectField';

const OPTIONS = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('SelectField', () => {
  it('renders the label', () => {
    render(<SelectField label="Category" name="category" options={OPTIONS} />);
    expect(screen.getByText('Category')).not.toBeNull();
  });

  it('renders the placeholder and all options', () => {
    render(
      <SelectField label="Category" name="category" options={OPTIONS} placeholder="Choose..." />
    );
    expect(screen.getByText('Choose...')).not.toBeNull();
    expect(screen.getByText('Option A')).not.toBeNull();
    expect(screen.getByText('Option B')).not.toBeNull();
  });

  it('calls onChange with the selected value', () => {
    const onChange = vi.fn();
    render(
      <SelectField label="Category" name="category" options={OPTIONS} onChange={onChange} />
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('uncontrolled mode updates selected value', () => {
    render(<SelectField label="Category" name="category" options={OPTIONS} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'b' } });
    expect(select.value).toBe('b');
  });

  it('controlled mode reflects the value prop', () => {
    render(
      <SelectField
        label="Category"
        name="category"
        options={OPTIONS}
        value="b"
        onChange={() => {}}
      />
    );
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('b');
  });

  it('validate() returns false and shows error for empty required field', async () => {
    const ref = createRef<SelectFieldHandle>();
    render(<SelectField label="Category" name="category" options={OPTIONS} required ref={ref} />);

    let valid!: boolean;
    await act(async () => {
      valid = ref.current!.validate();
    });

    expect(valid).toBe(false);
    expect(screen.getByText('Category is required')).not.toBeNull();
  });

  it('validate() returns true when a value is selected', async () => {
    const ref = createRef<SelectFieldHandle>();
    render(
      <SelectField
        label="Category"
        name="category"
        options={OPTIONS}
        required
        value="a"
        onChange={() => {}}
        ref={ref}
      />
    );

    let valid!: boolean;
    await act(async () => {
      valid = ref.current!.validate();
    });

    expect(valid).toBe(true);
    expect(screen.queryByText('Category is required')).toBeNull();
  });

  it('clears the error when a value is chosen', async () => {
    const ref = createRef<SelectFieldHandle>();
    render(<SelectField label="Category" name="category" options={OPTIONS} required ref={ref} />);

    await act(async () => { ref.current!.validate(); });
    expect(screen.getByText('Category is required')).not.toBeNull();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
    expect(screen.queryByText('Category is required')).toBeNull();
  });
});
