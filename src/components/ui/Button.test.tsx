import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Button from './Button';

describe('Button', () => {
  it('renders with the given label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button').textContent).toBe('Click me');
  });

  it('defaults to type="button"', () => {
    render(<Button label="Test" />);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  it('applies primary variant styles for type="submit"', () => {
    render(<Button label="Submit" type="submit" />);
    expect(screen.getByRole('button').className).toContain('bg-primary');
  });

  it('applies secondary variant styles when variant="secondary"', () => {
    render(<Button label="Cancel" variant="secondary" />);
    expect(screen.getByRole('button').className).toContain('bg-secondary');
  });

  it('explicit variant overrides type-based variant', () => {
    render(<Button label="Primary" type="submit" variant="secondary" />);
    expect(screen.getByRole('button').className).toContain('bg-secondary');
    expect(screen.getByRole('button').className).not.toContain('bg-primary');
  });

  it('sets disabled attribute and applies disabled styles when disabled=true', () => {
    render(<Button label="Disabled" disabled />);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.className).toContain('cursor-not-allowed');
    expect(btn.className).toContain('bg-gray-400');
  });

  it('disabled button does not apply variant styles', () => {
    render(<Button label="X" variant="primary" disabled />);
    expect(screen.getByRole('button').className).not.toContain('bg-primary');
  });

  it('calls onClick when clicked', () => {
    const handler = vi.fn();
    render(<Button label="Go" onClick={handler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('merges extra className prop', () => {
    render(<Button label="X" className="extra-class" />);
    expect(screen.getByRole('button').className).toContain('extra-class');
  });
});
