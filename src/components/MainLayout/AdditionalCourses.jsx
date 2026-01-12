import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';

const AdditionalCourses = ({
  isExtraOpen,
  setIsExtraOpen,
  extraSelections,
  getCoursesForSection,
  sectionOptions,
  updateExtra,
  removeExtra,
  addExtra
}) => {
  return (
    <>
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

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-add"
              onClick={addExtra}
            >
              <Plus size={14} /> Add Course
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdditionalCourses;
