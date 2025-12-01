import { describe, it, expect, beforeEach } from 'vitest';
import { ToonValidator } from '../validator';

describe('ToonValidator', () => {
  let validator: ToonValidator;

  beforeEach(() => {
    validator = new ToonValidator();
  });

  describe('validate', () => {
    it('should return valid result for correct TOON', () => {
      const result = validator.validate('name: Alice\nage: 30');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toEqual({ name: 'Alice', age: 30 });
    });

    it('should return invalid result with error details', () => {
      const result = validator.validate('items[3]: a,b');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('ARRAY_LENGTH_MISMATCH');
      expect(result.errors[0].message).toContain('length mismatch');
    });

    it('should include line number in error', () => {
      const result = validator.validate('items[3]: a,b');
      expect(result.errors[0].line).toBeGreaterThan(0);
    });

    it('should include context in error', () => {
      const result = validator.validate('items[3]: a,b');
      expect(result.errors[0].context).toBe('items[3]: a,b');
    });
  });

  describe('isValid', () => {
    it('should return true for valid TOON', () => {
      expect(validator.isValid('name: Alice')).toBe(true);
    });

    it('should return false for invalid TOON', () => {
      expect(validator.isValid('items[3]: a,b')).toBe(false);
    });

    it('should return true for empty document', () => {
      expect(validator.isValid('')).toBe(true);
    });
  });

  describe('validateOrThrow', () => {
    it('should return value for valid TOON', () => {
      const value = validator.validateOrThrow('name: Alice');
      expect(value).toEqual({ name: 'Alice' });
    });

    it('should throw for invalid TOON', () => {
      expect(() => validator.validateOrThrow('items[3]: a,b')).toThrow(
        /Validation failed/
      );
    });

    it('should include line number in error message', () => {
      expect(() => validator.validateOrThrow('items[3]: a,b')).toThrow(/line/);
    });
  });

  describe('error codes', () => {
    it('should detect ARRAY_LENGTH_MISMATCH', () => {
      const result = validator.validate('items[3]: a,b');
      expect(result.errors[0].code).toBe('ARRAY_LENGTH_MISMATCH');
    });

    it('should detect INVALID_INDENTATION', () => {
      const result = validator.validate('obj:\n   key: value');
      expect(result.errors[0].code).toBe('INVALID_INDENTATION');
    });

    it('should detect TAB_IN_INDENTATION', () => {
      const result = validator.validate('\tkey: value');
      expect(result.errors[0].code).toBe('TAB_IN_INDENTATION');
    });

    it('should detect INVALID_ESCAPE', () => {
      const result = validator.validate('"\\x"');
      expect(result.errors[0].code).toBe('INVALID_ESCAPE');
    });

    it('should detect TABULAR_WIDTH_MISMATCH', () => {
      const result = validator.validate('users[1]{id,name}:\n  1,Alice,extra');
      expect(result.errors[0].code).toBe('TABULAR_WIDTH_MISMATCH');
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple documents', () => {
      const docs = ['name: Alice', 'items[3]: a,b', 'valid: true'];
      const results = validator.validateBatch(docs);

      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(true);
    });

    it('should return individual results for each document', () => {
      const docs = ['a: 1', 'b: 2'];
      const results = validator.validateBatch(docs);

      expect(results[0].value).toEqual({ a: 1 });
      expect(results[1].value).toEqual({ b: 2 });
    });
  });

  describe('getValidationReport', () => {
    it('should return success message for valid TOON', () => {
      const report = validator.getValidationReport('name: Alice');
      expect(report).toContain('✓');
      expect(report).toContain('Valid');
    });

    it('should return detailed error report for invalid TOON', () => {
      const report = validator.getValidationReport('items[3]: a,b');
      expect(report).toContain('✗');
      expect(report).toContain('Invalid');
      expect(report).toContain('Error at line');
      expect(report).toContain('Code:');
      expect(report).toContain('Message:');
      expect(report).toContain('Context:');
    });

    it('should include error code in report', () => {
      const report = validator.getValidationReport('items[3]: a,b');
      expect(report).toContain('ARRAY_LENGTH_MISMATCH');
    });

    it('should include context line in report', () => {
      const report = validator.getValidationReport('items[3]: a,b');
      expect(report).toContain('items[3]: a,b');
    });
  });

  describe('complex validation', () => {
    it('should validate nested objects', () => {
      const toon = `user:
  name: Alice
  profile:
    age: 30
    active: true`;
      const result = validator.validate(toon);
      expect(result.valid).toBe(true);
    });

    it('should validate tabular arrays', () => {
      const toon = `users[2]{id,name}:
  1,Alice
  2,Bob`;
      const result = validator.validate(toon);
      expect(result.valid).toBe(true);
    });

    it('should validate list arrays', () => {
      const toon = `items[3]:
  - first
  - second
  - third`;
      const result = validator.validate(toon);
      expect(result.valid).toBe(true);
    });

    it('should detect errors in nested structures', () => {
      const toon = `users:
  items[5]: a,b,c`;
      const result = validator.validate(toon);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('ARRAY_LENGTH_MISMATCH');
    });
  });

  describe('with custom options', () => {
    it('should respect custom indent size', () => {
      const customValidator = new ToonValidator({ indentSize: 4 });
      const toon = `obj:
    key: value`;
      const result = customValidator.validate(toon);
      expect(result.valid).toBe(true);
    });

    it('should validate with strict mode disabled', () => {
      const lenientValidator = new ToonValidator({ strict: false });
      const toon = 'items[3]: a,b'; // Wrong length
      const result = lenientValidator.validate(toon);
      expect(result.valid).toBe(true); // Passes in non-strict mode
    });
  });
});
