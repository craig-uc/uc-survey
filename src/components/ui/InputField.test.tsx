import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { createRef } from 'react';
import InputField, { InputFieldHandle } from './InputField';

describe('InputField', () => {
  it('renders the label and a text input', () => {
    render(<InputField label="Email" name="email" />);
    expect(screen.getByText('Email')).not.toBeNull();
    expect(screen.getByRole('textbox')).not.toBeNull();
  });

  it('renders the placeholder text', () => {
    render(<InputField label="Email" name="email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).not.toBeNull();
  });

  it('calls onChange with the new value when user types', () => {
    const onChange = vi.fn();
    render(<InputField label="Name" name="name" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });
    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('uncontrolled mode updates the input value on change', () => {
    render(<InputField label="Name" name="name" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(input.value).toBe('Bob');
  });

  it('controlled mode respects the value prop', () => {
    render(
      <InputField label="Email" name="email" value="preset@example.com" onChange={() => {}} />
    );
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('preset@example.com');
  });

  it('validate() returns false and shows error for empty required field', async () => {
    const ref = createRef<InputFieldHandle>();
    render(<InputField label="Email" name="email" required ref={ref} />);

    let valid!: boolean;
    await act(async () => {
      valid = ref.current!.validate();
    });

    expect(valid).toBe(false);
    expect(screen.getByText('Email is required')).not.toBeNull();
  });

  it('validate() returns true when required field has a value', async () => {
    const ref = createRef<InputFieldHandle>();
    render(
      <InputField
        label="Email"
        name="email"
        required
        value="user@example.com"
        onChange={() => {}}
        ref={ref}
      />
    );

    let valid!: boolean;
    await act(async () => {
      valid = ref.current!.validate();
    });

    expect(valid).toBe(true);
    expect(screen.queryByText('Email is required')).toBeNull();
  });

  it('clears the error message when the user starts typing', async () => {
    const ref = createRef<InputFieldHandle>();
    render(<InputField label="Name" name="name" required ref={ref} />);

    await act(async () => { ref.current!.validate(); });
    expect(screen.getByText('Name is required')).not.toBeNull();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });
    expect(screen.queryByText('Name is required')).toBeNull();
  });

  it('does not show error on an optional field with an empty value', async () => {
    const ref = createRef<InputFieldHandle>();
    render(<InputField label="Phone" name="phone" ref={ref} />);

    let valid!: boolean;
    await act(async () => {
      valid = ref.current!.validate();
    });

    expect(valid).toBe(true);
    expect(screen.queryByText('Phone is required')).toBeNull();
  });
});
