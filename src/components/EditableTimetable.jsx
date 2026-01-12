import html2canvas from 'html2canvas';
import { ChevronDown, ChevronUp, Download, Edit2, Palette } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { DAY_ORDER } from '../utils/constants';
import { showError } from '../utils/errorHandler';
import { parseTime } from '../utils/timeUtils';
import { sanitizeString } from '../utils/validation';
import ColorCustomization from './ColorCustomization';

const EditableTimetable = () => {
  const {
    finalActiveClasses,
    getOrAssignColor,
    displayOptions,
    updateClassField
  } = useTimetable();

  const tableRef = useRef();
  const [isExporting, setIsExporting] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);

  const sortedClasses = useMemo(() => {
    return [...finalActiveClasses].sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99);
      if (dayDiff !== 0) return dayDiff;
      const timeA = parseTime(a.startTime) || 0;
      const timeB = parseTime(b.startTime) || 0;
      return timeA - timeB;
    });
  }, [finalActiveClasses]);

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

  const startEdit = useCallback((classKey, field, currentValue) => {
    setEditingCell(`${classKey}-${field}`);
    setEditValue(currentValue || '');
  }, []);

  const saveEdit = useCallback((classKey, field) => {
    if (editingCell === `${classKey}-${field}`) {
      updateClassField(classKey, field, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, updateClassField]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const exportAsPng = useCallback(async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 200));

      const sourceCanvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const targetWidth = 1920;
      const targetHeight = 1080;
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = targetWidth;
      targetCanvas.height = targetHeight;
      const ctx = targetCanvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const sourceAspect = sourceCanvas.width / sourceCanvas.height;
      const targetAspect = targetWidth / targetHeight;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (sourceAspect > targetAspect) {
        drawWidth = targetWidth * 0.9;
        drawHeight = drawWidth / sourceAspect;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = (targetHeight - drawHeight) / 2;
      } else {
        drawHeight = targetHeight * 0.9;
        drawWidth = drawHeight * sourceAspect;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = (targetHeight - drawHeight) / 2;
      }

      ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);

      const link = document.createElement('a');
      link.download = `timetable-${Date.now()}.png`;
      link.href = targetCanvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export timetable. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  if (sortedClasses.length === 0) {
    return null;
  }

  return (
    <div className="timetable-preview-section">
      <div className="preview-header">
        <h2>Timetable Preview</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={exportAsPng}
          disabled={isExporting}
        >
          <Download size={16} /> {isExporting ? 'Exporting...' : 'Export as PNG'}
        </button>
      </div>

      <div className="color-palette-section">
        <button
          type="button"
          className="section-divider accordion-trigger"
          onClick={() => setIsColorPaletteOpen(!isColorPaletteOpen)}
        >
          <div className="accordion-label">
            <Palette size={16} />
            <span>Colour Palette</span>
          </div>
          {isColorPaletteOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isColorPaletteOpen && (
          <div className="accordion-content">
            <ColorCustomization />
          </div>
        )}
      </div>

      <div className="timetable-wrapper" ref={tableRef}>
        <table className="timetable-table">
          <thead>
            <tr>
              <th className="col-day">Day</th>
              <th className="col-course">Course</th>
              <th className="col-time">Time</th>
              <th className="col-venue">Venue</th>
            </tr>
          </thead>
          <tbody>
            {sortedClasses.map((cls, idx) => {
              const isFirstOfDay = idx === 0 || sortedClasses[idx - 1].day !== cls.day;
              const dayCount = sortedClasses.filter(c => c.day === cls.day).length;
              const classKey = `${cls.day}-${cls.startTime}-${cls.name}`;
              const sanitizedName = sanitizeString(cls.name);
              const bgColor = getOrAssignColor(sanitizedName);
              const textColor = getContrastYIQ(bgColor);

              return (
                <tr key={`${cls.day}-${cls.startTime}-${idx}`}>
                  {isFirstOfDay && (
                    <td rowSpan={dayCount} className="day-cell">
                      {editingCell === `${classKey}-day` ? (
                        <div className="edit-cell">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(classKey, 'day')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(classKey, 'day');
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="edit-input"
                          />
                        </div>
                      ) : (
                        <div className="cell-content">
                          {sanitizeString(cls.day)}
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => startEdit(classKey, 'day', cls.day)}
                            aria-label="Edit day"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="course-cell" style={{ background: bgColor, color: textColor }}>
                    {editingCell === `${classKey}-name` ? (
                      <div className="edit-cell">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(classKey, 'name')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(classKey, 'name');
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="edit-input"
                        />
                      </div>
                    ) : (
                      <div className="cell-content">
                        <span className="course-name">{sanitizedName}</span>
                        <div className="course-details">
                          {displayOptions.showTeacher && (
                            <span className="teacher-name">
                              {editingCell === `${classKey}-teacher` ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => saveEdit(classKey, 'teacher')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(classKey, 'teacher');
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                  className="edit-input inline-edit"
                                />
                              ) : (
                                <>
                                  {sanitizeString(cls.teacher) || 'Not Mentioned'}
                                  <button
                                    type="button"
                                    className="edit-btn-small"
                                    onClick={() => startEdit(classKey, 'teacher', cls.teacher)}
                                    aria-label="Edit teacher"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                </>
                              )}
                            </span>
                          )}
                          {displayOptions.showCredits && cls.credits && (
                            <span className="credits">({sanitizeString(cls.credits)} Cr)</span>
                          )}
                          {displayOptions.showSection && (
                            <span className="section">| {sanitizeString(cls.section)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="time-cell">
                    {editingCell === `${classKey}-time` ? (
                      <div className="edit-cell">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            const parts = editValue.split('-').map(s => sanitizeString(s.trim()));
                            if (parts.length >= 2) {
                              updateClassField(classKey, 'startTime', parts[0]);
                              updateClassField(classKey, 'endTime', parts[1]);
                            }
                            setEditingCell(null);
                            setEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const parts = editValue.split('-').map(s => sanitizeString(s.trim()));
                              if (parts.length >= 2) {
                                updateClassField(classKey, 'startTime', parts[0]);
                                updateClassField(classKey, 'endTime', parts[1]);
                              }
                              setEditingCell(null);
                              setEditValue('');
                            }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="edit-input"
                          placeholder="8:30 AM - 10:00 AM"
                        />
                      </div>
                    ) : (
                      <div className="cell-content">
                        {sanitizeString(cls.startTime)} - {sanitizeString(cls.endTime)}
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => startEdit(classKey, 'time', `${cls.startTime} - ${cls.endTime}`)}
                          aria-label="Edit time"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="venue-cell">
                    {editingCell === `${classKey}-room` ? (
                      <div className="edit-cell">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(classKey, 'room')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(classKey, 'room');
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="edit-input"
                        />
                      </div>
                    ) : (
                      <div className="cell-content">
                        {sanitizeString(cls.room) || 'N/A'}
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => startEdit(classKey, 'room', cls.room)}
                          aria-label="Edit venue"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditableTimetable;
