import { Check, HelpCircle } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';

const CourseSelection = ({
  sectionOptions,
  activeSection,
  handleSectionChange,
  coursesInActiveSection,
  selectedCourseIds,
  toggleCourse
}) => {
  return (
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
  );
};

export default CourseSelection;
