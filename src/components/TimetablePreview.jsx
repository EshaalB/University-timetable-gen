import html2canvas from 'html2canvas';
import { Download, Printer } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { parseTime } from '../utils/timeUtils';
import { COLOR_PALETTE, DAY_ORDER } from '../utils/constants';
import { sanitizeString } from '../utils/validation';

const TimetablePreview = () => {
  const { finalActiveClasses, getOrAssignColor, setColorMap, displayOptions } = useTimetable();
  const tableRef = useRef();
  const [isExporting, setIsExporting] = useState(false);

  const sortedClasses = useMemo(() => {
    return [...finalActiveClasses].sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99);
      if (dayDiff !== 0) return dayDiff;
      const timeA = parseTime(a.startTime) || 0;
      const timeB = parseTime(b.startTime) || 0;
      return timeA - timeB;
    });
  }, [finalActiveClasses]);

  const uniqueCourseNames = useMemo(() => {
    return [...new Set(sortedClasses.map(c => sanitizeString(c.name)))];
  }, [sortedClasses]);

  const exportAsPng = useCallback(async () => {
    if (!tableRef.current) return;
    setIsExporting(true);

    try {
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const link = document.createElement('a');
      const timestamp = Date.now();
      link.download = `timetable-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const getContrastYIQ = useCallback((hex) => {
    if (!hex || typeof hex !== 'string') return 'black';
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return 'black';

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'black';

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }, []);

  if (finalActiveClasses.length === 0) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>No courses selected.</div>;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <div className="no-print" style={{ width: '100%', maxWidth: '800px' }}>
        <span className="label-small" style={{ textAlign: 'center', display: 'block' }}>Color Customization</span>
        <div className="color-picker-container">
          {uniqueCourseNames.map(name => {
            const sanitizedName = sanitizeString(name);
            if (!sanitizedName) return null;
            const currentColor = getOrAssignColor(sanitizedName);
            return (
              <div key={sanitizedName} className="color-picker-item">
                <div className="color-picker-colors">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${currentColor === c ? 'active' : ''}`}
                      onClick={() => setColorMap(prev => ({ ...prev, [sanitizedName]: c }))}
                      style={{ backgroundColor: c }}
                      aria-label={`Set ${sanitizedName} color to ${c}`}
                    />
                  ))}
                </div>
                <span className="color-picker-label">{sanitizedName}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="official-wrapper" ref={tableRef}>
        <table className="official-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Day</th>
              <th style={{ width: '50%' }}>Course Name</th>
              <th style={{ width: '20%' }}>Timing</th>
              <th style={{ width: '15%' }}>Venue</th>
            </tr>
          </thead>
          <tbody>
            {sortedClasses.map((cls, idx) => {
              const isFirstOfDay = idx === 0 || sortedClasses[idx - 1].day !== cls.day;
              const dayCount = sortedClasses.filter(c => c.day === cls.day).length;
              const sanitizedName = sanitizeString(cls.name);
              const bgColor = getOrAssignColor(sanitizedName);
              const textColor = getContrastYIQ(bgColor);

              return (
                <tr key={`${cls.day}-${cls.startTime}-${idx}`}>
                  {isFirstOfDay && (
                    <td rowSpan={dayCount} className="day-cell">
                      {sanitizeString(cls.day)}
                    </td>
                  )}
                  <td className="course-block" style={{ background: bgColor, color: textColor }}>
                    <span className="course-name-bold">{sanitizedName}</span>
                    <div className="course-meta">
                      {displayOptions.showTeacher && (
                        <span className="instructor-text" style={{ color: textColor === 'white' ? '#e0e7ff' : '#0000ff' }}>
                          {sanitizeString(cls.teacher) || 'Not Mentioned'}
                        </span>
                      )}
                      {displayOptions.showCredits && cls.credits && (
                        <span className="credits-text">({sanitizeString(cls.credits)} Cr)</span>
                      )}
                      {displayOptions.showSection && (
                        <span className="section-text">| {sanitizeString(cls.section)}</span>
                      )}
                    </div>
                  </td>
                  <td className="time-cell">
                    {sanitizeString(cls.startTime)} - {sanitizeString(cls.endTime)}
                  </td>
                  <td className="room-cell">{sanitizeString(cls.room) || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: '1.5rem', textAlign: 'right', fontSize: '0.7rem', color: 'black', opacity: 0.4 }}>
          Generated by Manual Fast-Lhr Time Table Pro
        </div>
      </div>

      <div className="no-print export-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={exportAsPng}
          disabled={isExporting}
        >
          <Download size={16} /> {isExporting ? 'Saving...' : 'Save as PNG'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => window.print()}
        >
          <Printer size={16} /> Print PDF
        </button>
      </div>
    </div>
  );
};

export default TimetablePreview;
