import { Check, ChevronDown, ChevronUp, HelpCircle, Plus, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useTimetable } from '../context/TimetableContext';
import { HEADER_KEYWORDS, TIME_REGEX } from '../utils/constants';
import { showError, showSuccess } from '../utils/errorHandler';
import { parseHeuristicExcel } from '../utils/heuristicParser';
import { validateCourseData, validateFile } from '../utils/validation';
import EditableTimetable from './EditableTimetable';
import SearchableSelect from './SearchableSelect';

const MainLayout = () => {
  const {
    rawData,
    processData,
    rootSections,
    activeSection,
    setActiveSection,
    selectedCourseIds,
    setSelectedCourseIds,
    extraSelections,
    setExtraSelections,
    displayOptions,
    setDisplayOptions,
    getCoursesForSection
  } = useTimetable();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const fileInputRef = useRef();

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      showError(validation.error);
      return;
    }

    setIsLoading(true);
    setError('');
    const reader = new FileReader();

    reader.onerror = () => {
      setIsLoading(false);
      const errorMsg = 'Failed to read file. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    };

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('No sheets found in file');
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawMatrix = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const hasGrid = rawMatrix.slice(0, 30).some(row =>
          Array.isArray(row) && row.some(c => {
            const s = String(c || '').trim();
            return TIME_REGEX.test(s) || s.toLowerCase().includes('am to') || s.toLowerCase().includes('pm to');
          })
        );

        if (hasGrid) {
          const parsed = parseHeuristicExcel(rawMatrix);
          const validation = validateCourseData(parsed);
          if (!validation.valid) {
            throw new Error(validation.error);
          }
          const mapping = {
            courseName: 'courseName',
            section: 'section',
            day: 'day',
            startTime: 'startTime',
            endTime: 'endTime',
            instructor: 'instructor',
            room: 'room'
          };
          processData(parsed, mapping);
          showSuccess('Timetable loaded successfully');
        } else {
          let headerIndex = -1;
          for (let i = 0; i < Math.min(rawMatrix.length, 50); i++) {
            const row = rawMatrix[i];
            if (!Array.isArray(row)) continue;

            const matchCount = row.filter(c =>
              c && HEADER_KEYWORDS.some(kw => String(c).toLowerCase().includes(kw))
            ).length;

            if (matchCount >= 2) {
              headerIndex = i;
              break;
            }
          }

          const data = headerIndex !== -1
            ? XLSX.utils.sheet_to_json(ws, { range: headerIndex })
            : XLSX.utils.sheet_to_json(ws);

          const validation = validateCourseData(data);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          const firstItem = data[0] || {};
          const headers = Object.keys(firstItem);
          const mapping = {};

          headers.forEach(h => {
            const l = String(h).toLowerCase().trim();
            if (!mapping.courseName && (l.includes('course') || l.includes('subject') || l.includes('class name'))) {
              mapping.courseName = h;
            }
            if (!mapping.section && (l.includes('section') || l.includes('group') || l.includes('sec'))) {
              mapping.section = h;
            }
            if (!mapping.day && (l.includes('day') || l.includes('weekday'))) {
              mapping.day = h;
            }
            if (!mapping.startTime && (l.includes('start') || l.includes('time') && !l.includes('end'))) {
              mapping.startTime = h;
            }
            if (!mapping.endTime && (l.includes('end') || l.includes('to'))) {
              mapping.endTime = h;
            }
            if (!mapping.instructor && (l.includes('teacher') || l.includes('instructor') || l.includes('faculty'))) {
              mapping.instructor = h;
            }
            if (!mapping.room && (l.includes('room') || l.includes('venue') || l.includes('location') || l.includes('classroom'))) {
              mapping.room = h;
            }
            if (!mapping.credits && (l.includes('credit') || l.includes('cr') || l.includes('ch'))) {
              mapping.credits = h;
            }
          });

          const missingFields = [];
          if (!mapping.courseName) missingFields.push('Course/Subject');
          if (!mapping.section) missingFields.push('Section');

          if (missingFields.length === 0) {
            processData(data, mapping);
            showSuccess('Timetable loaded successfully');
          } else {
            throw new Error(`Missing required columns: ${missingFields.join(', ')}. Please ensure your Excel file has columns labeled with these names.`);
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to process file. Please check the file format.';
        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsBinaryString(file);
  }, [processData]);

  const coursesInActiveSection = useMemo(() => {
    if (!activeSection) return [];
    const courses = getCoursesForSection(activeSection);
    const unique = [];
    const seen = new Set();
    courses.forEach(c => {
      if (!seen.has(c.name)) {
        unique.push(c);
        seen.add(c.name);
      }
    });
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [activeSection, getCoursesForSection]);

  const sectionOptions = useMemo(() => {
    return rootSections.map(section => ({ value: section, label: section }));
  }, [rootSections]);


  const toggleCourse = useCallback((id) => {
    setSelectedCourseIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, [setSelectedCourseIds]);

  const handleSectionChange = useCallback((value) => {
    setActiveSection(value);
    setSelectedCourseIds([]);
  }, [setActiveSection, setSelectedCourseIds]);

  const addExtra = useCallback(() => {
    setExtraSelections(prev => [...prev, { id: Date.now() + Math.random(), section: '', courseId: '' }]);
  }, [setExtraSelections]);

  const removeExtra = useCallback((id) => {
    setExtraSelections(prev => prev.filter(s => s.id !== id));
  }, [setExtraSelections]);

  const updateExtra = useCallback((id, updates) => {
    setExtraSelections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [setExtraSelections]);

  const resetUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.location.reload();
  }, []);

  const displayOptionsList = useMemo(() => [
    { key: 'showTeacher', label: 'Show Teachers' },
    { key: 'showCredits', label: 'Show Credits' },
    { key: 'showSection', label: 'Section View' }
  ], []);

  const hasSelectedCourses = selectedCourseIds.length > 0 || extraSelections.filter(s => s.courseId).length > 0;

  return (
    <div className="app-card">
      <header>
        <h1>Timetable Generator</h1>
      </header>

      <div className="file-upload-section">
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx,.xls"
          aria-label="Upload timetable file"
        />
        {rawData.length === 0 ? (
          <div className="upload-area">
            <div className="upload-content" onClick={() => fileInputRef.current?.click()}>
              <Upload size={48} className="upload-icon" />
              {isLoading ? (
                <h3>Processing file...</h3>
              ) : (
                <>
                  <h3>Upload Your Timetable</h3>
                  <p>Click or drag & drop Excel file here</p>
                  <p className="upload-hint">Supports .xlsx and .xls files up to 10MB</p>
                </>
              )}
            </div>
            {error && <div className="error-text">{error}</div>}
          </div>
        ) : (
          <div className="file-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Change File
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetUpload}
            >
              <RefreshCcw size={16} /> Reset
            </button>
          </div>
        )}
      </div>

      {rawData.length > 0 && (
        <>
          <div className="section-container">
            <div className="form-group">
              <label className="label-with-tooltip">
                <span className="label-text">Primary Section</span>
                <div className="tooltip-wrapper">
                  <HelpCircle size={14} />
                  <span className="tooltip">Select your main section to automatically load courses</span>
                </div>
              </label>
              <SearchableSelect
                options={sectionOptions}
                value={activeSection}
                onChange={handleSectionChange}
                placeholder="Select your main section"
                ariaLabel="Select primary section"
              />
            </div>

            {activeSection && (
              <div className="form-group">
                <label className="label-text">Select Courses</label>
                <div className="tick-grid">
                  {coursesInActiveSection.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`tick-item ${selectedCourseIds.includes(c.id) ? 'selected' : ''}`}
                      onClick={() => toggleCourse(c.id)}
                      aria-pressed={selectedCourseIds.includes(c.id)}
                    >
                      <div className="tick-indicator">
                        {selectedCourseIds.includes(c.id) && <Check size={14} />}
                      </div>
                      <span>{c.name}</span>
                    </button>
                  ))}
                  {coursesInActiveSection.length === 0 && (
                    <p className="empty-state">No courses found for this section</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="section-divider accordion-trigger"
            onClick={() => setIsExtraOpen(!isExtraOpen)}
          >
            <span>Additional Courses</span>
            {isExtraOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExtraOpen && (
            <div className="extra-selections">
              {extraSelections.map((sel) => {
                const extraCourses = getCoursesForSection(sel.section);
                const extraCourseOptions = extraCourses.map(c => ({ value: c.id, label: c.name }));
                return (
                  <div key={sel.id} className="mixed-row">
                    <SearchableSelect
                      options={sectionOptions}
                      value={sel.section}
                      onChange={(value) => updateExtra(sel.id, { section: value, courseId: '' })}
                      placeholder="Section"
                      ariaLabel="Select section"
                    />
                    <SearchableSelect
                      options={extraCourseOptions}
                      value={sel.courseId}
                      onChange={(value) => updateExtra(sel.id, { courseId: value })}
                      placeholder="Choose course"
                      disabled={!sel.section}
                      ariaLabel="Select course"
                    />
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => removeExtra(sel.id)}
                      aria-label="Remove course selection"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn btn-secondary btn-add"
                onClick={addExtra}
              >
                <Plus size={14} /> Add Course
              </button>
            </div>
          )}

          <div className="display-options">
            {displayOptionsList.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`tick-item ${displayOptions[opt.key] ? 'selected' : ''}`}
                onClick={() => setDisplayOptions(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                aria-pressed={displayOptions[opt.key]}
              >
                <div className="tick-indicator">
                  {displayOptions[opt.key] && <Check size={14} />}
                </div>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {hasSelectedCourses && (
            <EditableTimetable />
          )}
        </>
      )}
    </div>
  );
};

export default MainLayout;
