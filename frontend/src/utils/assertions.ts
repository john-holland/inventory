/**
 * TypeScript utility functions that mirror Solidity's require pattern
 * Provides consistent error handling and stack busting for frontend validation
 */

/**
 * Ward function - Asserts with binary predicates and console.log messages
 * Similar to Solidity's require() function
 * @param test - Boolean condition to test
 * @param message - Error message to display
 * @param context - Optional context for debugging
 */
export function ward(test: boolean, message: string, context?: any): asserts test {
  if (!test) {
    console.error('🚨 Ward assertion failed:', message);
    if (context) {
      console.error('Context:', context);
    }
    console.trace('Stack trace:');
    throw new Error(`Ward assertion failed: ${message}`);
  }
  console.log('✅ Ward assertion passed:', message);
}

/**
 * Explicitly catches thrown errors and logs them, 
 * use ward() for boolean assertions
 * Similar to Solidity's require() with function predicates
 * @param test - Function that receives a 'tri' function for non-throwing assertions
 * @param context - Optional context for debugging
 */
export function assertdown(test: (tri: (unstable_stanza: () => any) => void) => void, context?: any): void {
  let errors: Error[] = [];
  
  try {
    test((unstable_stanza: () => any) => {
      try {
        unstable_stanza();
      } catch (e) {
        errors.push(e as Error);
      }
    });
  } catch (error) {
    console.error('🚨 Assertdown assertion failed:', error);
    if (context) {
      console.error('Context:', context);
    }
    console.trace('Stack trace:');
    throw error;
  }
  
  if (errors.length > 0) {
    console.error('🚨 Assertdown collected errors:', errors.length);
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error.message}`);
    });
    if (context) {
      console.error('Context:', context);
    }
    console.trace('Stack trace:');
    throw new Error(`Assertdown failed with ${errors.length} error(s): ${errors.map(e => e.message).join(', ')}`);
  }
  
  console.log('✅ Assertdown assertion passed');
}

/**
 * Enhanced ward function with type checking
 * @param test - Boolean condition to test
 * @param message - Error message to display
 * @param expectedType - Expected type for better error messages
 * @param actualValue - Actual value for debugging
 */
export function wardType<T>(
  test: boolean, 
  message: string, 
  expectedType: string, 
  actualValue?: T
): asserts test {
  if (!test) {
    const errorMessage = `${message} (Expected: ${expectedType}${actualValue !== undefined ? `, Got: ${typeof actualValue}` : ''})`;
    ward(test, errorMessage, { expectedType, actualValue });
  }
}

/**
 * Ward function for non-null assertions
 * @param value - Value to check for null/undefined
 * @param message - Error message to display
 */
export function wardNotNull<T>(value: T | null | undefined, message: string): asserts value is T {
  ward(value !== null && value !== undefined, message, { value });
}

/**
 * Ward function for string validation
 * @param value - String to validate
 * @param message - Error message to display
 * @param minLength - Minimum length requirement
 */
export function wardString(value: string, message: string, minLength: number = 1): void {
  wardNotNull(value, message);
  ward(typeof value === 'string', `${message} - must be a string`, { value, type: typeof value });
  ward(value.length >= minLength, `${message} - must be at least ${minLength} characters`, { value, length: value.length });
}

/**
 * Ward function for number validation
 * @param value - Number to validate
 * @param message - Error message to display
 * @param min - Minimum value
 * @param max - Maximum value
 */
export function wardNumber(value: number, message: string, min?: number, max?: number): void {
  wardNotNull(value, message);
  ward(typeof value === 'number' && !isNaN(value), `${message} - must be a valid number`, { value, type: typeof value });
  
  if (min !== undefined) {
    ward(value >= min, `${message} - must be at least ${min}`, { value, min });
  }
  
  if (max !== undefined) {
    ward(value <= max, `${message} - must be at most ${max}`, { value, max });
  }
}

/**
 * Ward function for Ethereum address validation
 * @param address - Address to validate
 * @param message - Error message to display
 */
export function wardAddress(address: string, message: string): void {
  wardString(address, message);
  ward(address.startsWith('0x'), `${message} - must be a valid Ethereum address`, { address });
  ward(address.length === 42, `${message} - must be 42 characters long`, { address, length: address.length });
  ward(/^0x[a-fA-F0-9]{40}$/.test(address), `${message} - must contain only hex characters`, { address });
}

/**
 * Ward function for array validation
 * @param array - Array to validate
 * @param message - Error message to display
 * @param minLength - Minimum length requirement
 */
export function wardArray<T>(array: T[], message: string, minLength: number = 0): void {
  wardNotNull(array, message);
  ward(Array.isArray(array), `${message} - must be an array`, { array, type: typeof array });
  ward(array.length >= minLength, `${message} - must have at least ${minLength} elements`, { array, length: array.length });
}

/**
 * Ward function for object validation
 * @param obj - Object to validate
 * @param message - Error message to display
 * @param requiredKeys - Array of required keys
 */
export function wardObject(obj: any, message: string, requiredKeys: string[] = []): void {
  wardNotNull(obj, message);
  ward(typeof obj === 'object' && obj !== null, `${message} - must be an object`, { obj, type: typeof obj });
  
  for (const key of requiredKeys) {
    ward(key in obj, `${message} - must have property '${key}'`, { obj, missingKey: key });
  }
}

/**
 * Ward function for promise validation
 * @param promise - Promise to validate
 * @param message - Error message to display
 */
export function wardPromise<T>(promise: Promise<T>, message: string): void {
  wardNotNull(promise, message);
  ward(promise instanceof Promise, `${message} - must be a Promise`, { promise, type: typeof promise });
}

/**
 * Utility function to create a ward function with custom error formatting
 * @param formatter - Function to format error messages
 */
export function createWard<T>(formatter: (message: string, context?: any) => string) {
  return (test: boolean, message: string, context?: any): asserts test => {
    ward(test, formatter(message, context), context);
  };
}

/**
 * Utility function to create an assertdown function with custom error formatting
 * @param formatter - Function to format error messages
 */
export function createAssertdown<T>(formatter: (message: string, context?: any) => string) {
  return (test: (tri: (unstable_stanza: () => any) => void) => void, context?: any): void => {
    assertdown(test, context);
  };
}

// Export all functions
export default {
  ward,
  assertdown,
  wardType,
  wardNotNull,
  wardString,
  wardNumber,
  wardAddress,
  wardArray,
  wardObject,
  wardPromise,
  createWard,
  createAssertdown
}; 