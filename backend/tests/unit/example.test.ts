/**
 * Example unit test
 * This test verifies that the test infrastructure is working correctly
 */

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify test environment is set up correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
