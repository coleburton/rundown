import {
  formatActivityDate,
  formatDate,
  formatEmail,
  formatPhoneNumber,
  formatSafeDate,
  getWeekDateRange,
  isValidDate,
  isValidEmail,
  isValidPhoneNumber
} from '@/lib/utils';

describe('utils', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('isValidDate returns true for parsable strings', () => {
    expect(isValidDate('2024-02-10')).toBe(true);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
  });

  test('formatSafeDate uses fallback for invalid dates', () => {
    expect(formatSafeDate('bad', {}, 'oops')).toBe('oops');
    expect(formatSafeDate('2024-02-10', { year: 'numeric' })).toBe('2024');
  });

  test('formatActivityDate handles today, yesterday, and generic dates', () => {
    const base = new Date('2024-06-05T10:00:00Z');
    jest.useFakeTimers().setSystemTime(base);

    expect(formatActivityDate('2024-06-05T10:00:00Z')).toBe('Today');
    expect(formatActivityDate('2024-06-04T10:00:00Z')).toBe('Yesterday');
    expect(formatActivityDate('2024-05-30T12:00:00Z')).toMatch(/Thu/);
    expect(formatActivityDate('invalid')).toBe('Invalid Date');
  });

  test('getWeekDateRange formats Monday-Sunday window', () => {
    const base = new Date('2024-06-05T10:00:00Z');
    jest.useFakeTimers().setSystemTime(base);
    expect(getWeekDateRange()).toBe('Jun 3-9');
  });

  test('formatPhoneNumber progressively formats digits', () => {
    expect(formatPhoneNumber('1')).toBe('1');
    expect(formatPhoneNumber('1234')).toBe('(123) 4');
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    expect(formatPhoneNumber('(123)456-78901')).toBe('(123) 456-7890');
  });

  test('isValidPhoneNumber accepts US/international lengths', () => {
    expect(isValidPhoneNumber('1234567890')).toBe(true);
    expect(isValidPhoneNumber('+44 7123 456789')).toBe(true);
    expect(isValidPhoneNumber('12345')).toBe(false);
  });

  test('isValidEmail covers basic formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('bad-email')).toBe(false);
    expect(isValidEmail(' user@example.com ')).toBe(true);
  });

  test('formatEmail trims and lowercases', () => {
    expect(formatEmail('  User@Example.COM ')).toBe('user@example.com');
  });

  test('formatDate uses MMM D, YYYY', () => {
    const result = formatDate(new Date('2024-06-05T10:00:00Z'));
    expect(result).toBe('Jun 5, 2024');
  });
});
