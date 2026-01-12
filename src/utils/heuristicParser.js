import { EXCLUDED_COURSES } from './constants';
import { parseTime } from './timeUtils';
import { sanitizeString } from './validation';

const DAY_VARIANTS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DAY_MAP = {
  'MONDAY': 'Monday', 'MON': 'Monday',
  'TUESDAY': 'Tuesday', 'TUE': 'Tuesday',
  'WEDNESDAY': 'Wednesday', 'WED': 'Wednesday',
  'THURSDAY': 'Thursday', 'THU': 'Thursday',
  'FRIDAY': 'Friday', 'FRI': 'Friday',
  'SATURDAY': 'Saturday', 'SAT': 'Saturday',
  'SUNDAY': 'Sunday', 'SUN': 'Sunday'
};

const mergeSlots = (slots) => {
  if (slots.length <= 1) return slots;

  // Group by unique identifiers excluding time
  const groups = {};
  slots.forEach(slot => {
    const key = `${slot.courseName}|${slot.section}|${slot.instructor}|${slot.room}|${slot.day}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  });

  const merged = [];
  Object.values(groups).forEach(group => {
    // Sort by start time
    group.sort((a, b) => (parseTime(a.startTime) || 0) - (parseTime(b.startTime) || 0));

    let current = null;
    group.forEach(slot => {
      if (!current) {
        current = { ...slot };
      } else {
        const currentEnd = parseTime(current.endTime);
        const nextStart = parseTime(slot.startTime);

        // If they are adjacent (within 10 mins) or overlapping
        if (nextStart !== null && currentEnd !== null && nextStart <= currentEnd + 10) {
          const nextEnd = parseTime(slot.endTime);
          if (nextEnd !== null && nextEnd > currentEnd) {
            current.endTime = slot.endTime;
          }
        } else {
          merged.push(current);
          current = { ...slot };
        }
      }
    });
    if (current) merged.push(current);
  });

  return merged;
};

export const parseHeuristicExcel = (jsonData) => {
  if (!Array.isArray(jsonData)) return [];
  const rawResults = [];
  let currentDay = '';

  // Find the row containing time ranges (e.g., "8:30 AM to 9:50 AM")
  let timeRowIndex = -1;
  let timeColumns = [];

  for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
    const row = jsonData[i];
    if (!row) continue;

    const potentialTimes = row.map((cell, idx) => ({ cell, idx }))
      .filter(item => {
        if (!item.cell) return false;
        const s = item.cell.toString().trim().toLowerCase();
        return s.includes('am to') || s.includes('pm to') ||
          /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(s) ||
          /^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(s);
      });

    if (potentialTimes.length >= 2) {
      timeRowIndex = i;
      timeColumns = potentialTimes.map(pt => ({
        colIndex: pt.idx,
        range: pt.cell.toString().trim()
      }));
      break;
    }
  }

  if (timeRowIndex === -1) return [];

  for (let i = timeRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const firstCell = sanitizeString(row[0]?.toString() || '').toUpperCase();
    if (firstCell && DAY_VARIANTS.includes(firstCell)) {
      currentDay = DAY_MAP[firstCell] || '';
    }

    if (!currentDay) continue;

    const room = sanitizeString(row[1]?.toString() || row[2]?.toString() || '');
    if (!room || ['Room', 'Periods', 'Days'].includes(room) || room.length < 2) continue;

    // Find the first and last time columns to define the processing range
    const timeColIndices = timeColumns.map(tc => tc.colIndex);
    const minCol = Math.min(...timeColIndices);

    for (let colIdx = minCol; colIdx < row.length; colIdx++) {
      const cellContent = row[colIdx];
      if (!cellContent) continue;

      const tc = [...timeColumns]
        .sort((a, b) => b.colIndex - a.colIndex)
        .find(t => t.colIndex <= colIdx);

      if (!tc) continue;

      const contentStr = sanitizeString(cellContent?.toString() || '');
      if (contentStr.length < 3) continue;

      const rawLines = contentStr.split(/\n+/).map(l => sanitizeString(l)).filter(Boolean);
      const processedEntries = [];
      let currentEntry = '';

      rawLines.forEach(line => {
        if (line.includes('(')) {
          if (currentEntry) processedEntries.push(currentEntry);
          currentEntry = line;
        } else {
          currentEntry = currentEntry ? currentEntry + ' ' + line : line;
        }
      });
      if (currentEntry) processedEntries.push(currentEntry);

      processedEntries.forEach(text => {
        let course = '';
        let section = 'All';
        let instructor = 'N/A';

        // Advanced Regex for: Course Name (Section) : Instructor OR Course Name (Section) Instructor
        const fullMatch = text.match(/^(.+?)\s*\((.+?)\)\s*:?\s*(.*)$/);

        if (fullMatch) {
          course = sanitizeString(fullMatch[1]);
          section = sanitizeString(fullMatch[2]);
          instructor = sanitizeString(fullMatch[3].replace(/^:\s*/, '')) || 'N/A';
        } else {
          course = sanitizeString(text);
        }

        const courseUpper = course.toUpperCase();
        if (EXCLUDED_COURSES.some(word => courseUpper.includes(word))) return;

        const timeParts = sanitizeString(tc.range).split(/(?:to|TO|To|-)/i);
        const start = sanitizeString(timeParts[0]);
        const end = sanitizeString(timeParts[1]?.replace(/\.$/, ''));

        rawResults.push({
          courseName: course,
          section: section || 'All',
          instructor: instructor || 'N/A',
          room: room,
          day: currentDay,
          startTime: start,
          endTime: end,
          credits: ''
        });
      });
    }
  }

  return mergeSlots(rawResults);
};
