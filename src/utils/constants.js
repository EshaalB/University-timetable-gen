export const COLOR_PALETTE = [
  '#BFDBFE',
  '#FECACA',
  '#BBF7D0',
  '#FEF08A',
  '#DDD6FE',
  '#FBCFE8',
  '#CFFAFE',
  '#FED7AA',
  '#99F6E4',
  '#E2E8F0'
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

export const EXCLUDED_COURSES = ['RESERVED', 'GAP', 'BREAK', 'LUNCH'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ACCEPTED_FILE_TYPES = ['.xlsx', '.xls'];

export const HEADER_KEYWORDS = ['course', 'subject', 'class', 'teacher', 'instructor', 'section'];

export const TIME_REGEX = /\d{1,2}:\d{2}\s*(?:AM|PM|A\.M|P\.M)?\s*(?:-|TO)\s*\d{1,2}:\d{2}/i;
