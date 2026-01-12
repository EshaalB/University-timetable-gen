import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import SearchableSelect from '../SearchableSelect';

const AdditionalCourseRow = ({
  sel, index, extraSelections, rawData, allUniqueCourses,
  primarySelectedNames, getCoursesForSection, updateExtra, removeExtra
}) => {
  // Get available sections for the current chosen course
  const sectionsForCourse = useMemo(() => {
    if (!sel.courseName) return [];
    const sections = new Set();
    rawData.forEach(item => {
      if (item.courseName === sel.courseName || item.Course === sel.courseName) {
        sections.add(item.section || item.Section || 'All');
      }
    });
    return Array.from(sections).map(s => ({ value: s, label: s }));
  }, [sel.courseName, rawData]);

  // Filter out already selected courses for the COURSE picker
  const filteredCourseOptions = useMemo(() => {
    return allUniqueCourses.filter(opt => {
      // Allow current selected course to show up
      if (opt.value === sel.courseName) return true;
      // Hide if in primary section
      if (primarySelectedNames.has(opt.value)) return false;
      // Hide if in other extra selections
      return !extraSelections.some((s, idx) => idx !== index && s.courseName === opt.value);
    });
  }, [allUniqueCourses, sel.courseName, primarySelectedNames, extraSelections, index]);

  return (
    <div className="mixed-row">
      <SearchableSelect
        options={filteredCourseOptions}
        value={sel.courseName}
        onChange={(value) => {
          updateExtra(sel.id, { courseName: value, section: '', courseId: '' });
        }}
        placeholder="Choose course name"
        ariaLabel="Select course name"
      />
      <SearchableSelect
        options={sectionsForCourse}
        value={sel.section}
        onChange={(value) => {
          const courses = getCoursesForSection(value);
          const match = courses.find(c => c.name === sel.courseName);
          updateExtra(sel.id, { section: value, courseId: match ? match.id : '' });
        }}
        placeholder="Select Section"
        disabled={!sel.courseName}
        ariaLabel="Select section"
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
};

const AdditionalCourses = ({
  isExtraOpen,
  setIsExtraOpen,
  extraSelections,
  getCoursesForSection,
  updateExtra,
  removeExtra,
  addExtra
}) => {
  const { rawData, selectedCourseIds, activeSection } = useTimetable();

  // Get all unique courses available in the spreadsheet
  const allUniqueCourses = useMemo(() => {
    const courses = [];
    const seen = new Set();
    rawData.forEach(item => {
      const name = item.courseName || item.Course || '';
      if (name && !seen.has(name)) {
        courses.push({ value: name, label: name });
        seen.add(name);
      }
    });
    return courses.sort((a, b) => a.label.localeCompare(b.label));
  }, [rawData]);

  // Get already picked course names from primary section
  const primarySelectedNames = useMemo(() => {
    if (!activeSection) return new Set();
    const activeCourses = getCoursesForSection(activeSection);
    return new Set(
      activeCourses
        .filter(c => selectedCourseIds.includes(c.id))
        .map(c => c.name)
    );
  }, [activeSection, selectedCourseIds, getCoursesForSection]);

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
          {extraSelections.map((sel, index) => (
            <AdditionalCourseRow
              key={sel.id}
              sel={sel}
              index={index}
              extraSelections={extraSelections}
              rawData={rawData}
              allUniqueCourses={allUniqueCourses}
              primarySelectedNames={primarySelectedNames}
              getCoursesForSection={getCoursesForSection}
              updateExtra={updateExtra}
              removeExtra={removeExtra}
            />
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary btn-add"
              onClick={addExtra}
              style={{ width: '100%', maxWidth: '250px' }}
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
