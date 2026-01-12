import { Check, HelpCircle, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import SearchableSelect from '../SearchableSelect';

const CourseSelection = ({
  sectionOptions,
  activeSection,
  handleSectionChange,
  coursesInActiveSection,
  selectedCourseIds,
  toggleCourse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { clearAllSelections } = useTimetable();

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return coursesInActiveSection;
    const lower = searchTerm.toLowerCase();
    return coursesInActiveSection.filter(c => c.name.toLowerCase().includes(lower));
  }, [coursesInActiveSection, searchTerm]);

  return (
    <div className="section-container">
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="label-with-tooltip" style={{ marginBottom: 0 }}>
            <span className="label-text">Primary Section</span>
            <div className="tooltip-wrapper">
              <HelpCircle size={14} />
              <span className="tooltip">Select your main section to automatically load courses</span>
            </div>
          </label>
          {(selectedCourseIds.length > 0) && (
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={clearAllSelections}
              style={{ padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="label-text" style={{ marginBottom: 0 }}>Select Courses</label>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '4px 8px 4px 28px',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  height: '32px'
                }}
              />
            </div>
          </div>
          <div className="tick-grid">
            {filteredCourses.map(c => (
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
            {filteredCourses.length === 0 && (
              <p className="empty-state">No matching courses found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSelection;
