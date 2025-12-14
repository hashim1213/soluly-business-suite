import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    // Later class should win for conflicting utilities
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should preserve non-conflicting classes', () => {
    expect(cn('px-2', 'py-4', 'text-sm')).toBe('px-2 py-4 text-sm');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('should handle complex combinations', () => {
    expect(
      cn(
        'base-class',
        { 'conditional-true': true, 'conditional-false': false },
        ['array-class-1', 'array-class-2'],
        undefined,
        'final-class'
      )
    ).toBe('base-class conditional-true array-class-1 array-class-2 final-class');
  });

  it('should handle responsive classes', () => {
    expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg');
  });

  it('should handle hover and focus states', () => {
    expect(cn('bg-white', 'hover:bg-gray-100', 'focus:ring-2')).toBe(
      'bg-white hover:bg-gray-100 focus:ring-2'
    );
  });
});
