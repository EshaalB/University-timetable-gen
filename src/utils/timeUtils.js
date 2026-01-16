export const parseTime = (timeStr) => {
  if (!timeStr) return null;

  // Normalize the time string - remove extra characters
  const normalized = timeStr
    .toString()
    .trim()
    .replace(/\.+$/, '')  // Remove trailing periods
    .replace(/\s+/g, ' ') // Normalize spaces
    .toUpperCase();

  // Try to match HH:mm AM/PM or HH:mm A.M./P.M.
  const ampmMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM|A\.M\.?|P\.M\.?)/i);
  const militaryMatch = normalized.match(/(\d{1,2}):(\d{2})/);

  let hours, minutes;

  if (ampmMatch) {
    hours = parseInt(ampmMatch[1], 10);
    minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].replace(/\./g, '').toUpperCase();

    if ((period === 'PM' || period === 'PM') && hours < 12) hours += 12;
    if ((period === 'AM' || period === 'AM') && hours === 12) hours = 0;
  } else if (militaryMatch) {
    hours = parseInt(militaryMatch[1], 10);
    minutes = parseInt(militaryMatch[2], 10);

    // For times that are ambiguous (like "1:00"), assume PM for typical class hours
    // Classes usually run from 8 AM to 9 PM, so:
    // - 1-7 are usually PM (1 PM to 7 PM)
    // - 8-12 are usually AM (8 AM to 12 PM)
    if (hours >= 1 && hours <= 7) {
      hours += 12; // Assume PM for 1:00-7:00
    }
  } else {
    return null;
  }

  return hours * 60 + minutes;
};

export const formatTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const checkOverlap = (slot1, slot2) => {
  if (slot1.day !== slot2.day) return false;

  const start1 = parseTime(slot1.startTime);
  const end1 = parseTime(slot1.endTime);
  const start2 = parseTime(slot2.startTime);
  const end2 = parseTime(slot2.endTime);

  if (!start1 || !end1 || !start2 || !end2) return false;

  return (start1 < end2) && (end1 > start2);
};

export { DAYS } from './constants';
