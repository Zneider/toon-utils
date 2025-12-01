import { describe, it, expect } from 'vitest';
import { SchemaValidator } from '../schema';
import type { Schema } from '../schema';

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  it('should validate a simple object schema', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
    };

    const data = {
      name: 'John',
      age: 30,
    };

    const result = validator.validate(data, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
    };

    const data = {
      name: 'John',
    };

    const result = validator.validate(data, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe('$.age');
  });

  it('should detect type mismatches', () => {
    const schema: Schema = {
      name: { type: 'string' },
      age: { type: 'number' },
    };

    const data = {
      name: 123,
      age: '30',
    };

    const result = validator.validate(data, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate string length constraints', () => {
    const schema: Schema = {
      username: { type: 'string', minLength: 3, maxLength: 10 },
    };

    const shortResult = validator.validate({ username: 'ab' }, schema);
    expect(shortResult.valid).toBe(false);

    const longResult = validator.validate({ username: 'abcdefghijk' }, schema);
    expect(longResult.valid).toBe(false);

    const validResult = validator.validate({ username: 'john' }, schema);
    expect(validResult.valid).toBe(true);
  });

  it('should validate number range constraints', () => {
    const schema: Schema = {
      score: { type: 'number', min: 0, max: 100 },
    };

    const lowResult = validator.validate({ score: -1 }, schema);
    expect(lowResult.valid).toBe(false);

    const highResult = validator.validate({ score: 101 }, schema);
    expect(highResult.valid).toBe(false);

    const validResult = validator.validate({ score: 50 }, schema);
    expect(validResult.valid).toBe(true);
  });

  it('should validate enum values', () => {
    const schema: Schema = {
      status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
    };

    const invalidResult = validator.validate({ status: 'deleted' }, schema);
    expect(invalidResult.valid).toBe(false);

    const validResult = validator.validate({ status: 'active' }, schema);
    expect(validResult.valid).toBe(true);
  });

  it('should validate pattern matching', () => {
    const schema: Schema = {
      email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    };

    const invalidResult = validator.validate({ email: 'invalid-email' }, schema);
    expect(invalidResult.valid).toBe(false);

    const validResult = validator.validate({ email: 'test@example.com' }, schema);
    expect(validResult.valid).toBe(true);
  });

  it('should validate nested objects', () => {
    const schema: Schema = {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true },
        },
      },
    };

    const data = {
      user: {
        name: 'John',
        age: 30,
      },
    };

    const result = validator.validate(data, schema);
    expect(result.valid).toBe(true);
  });

  it('should validate arrays of objects', () => {
    const schema: Schema = {
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            age: { type: 'number', required: true },
          },
        },
      },
    };

    const data = {
      users: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ],
    };

    const result = validator.validate(data, schema);
    expect(result.valid).toBe(true);
  });

  it('should support union types', () => {
    const schema: Schema = {
      value: { type: ['string', 'number'] },
    };

    const stringResult = validator.validate({ value: 'hello' }, schema);
    expect(stringResult.valid).toBe(true);

    const numberResult = validator.validate({ value: 42 }, schema);
    expect(numberResult.valid).toBe(true);

    const boolResult = validator.validate({ value: true }, schema);
    expect(boolResult.valid).toBe(false);
  });

  it('should support custom validators', () => {
    const schema: Schema = {
      password: {
        type: 'string',
        custom: (value) => {
          if (typeof value !== 'string') return false;
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
          return true;
        },
      },
    };

    const weakResult = validator.validate({ password: 'weak' }, schema);
    expect(weakResult.valid).toBe(false);

    const noUpperResult = validator.validate({ password: 'password123' }, schema);
    expect(noUpperResult.valid).toBe(false);

    const validResult = validator.validate({ password: 'Password123' }, schema);
    expect(validResult.valid).toBe(true);
  });
});
