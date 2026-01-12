import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EXCLUDED_COURSES } from '../utils/constants';
import { COLOR_THEMES, getThemeColors } from '../utils/themes';
import { sanitizeObject, sanitizeString, validateSection } from '../utils/validation';

const TimetableContext = createContext();

const STORAGE_KEYS = {
  display: 'timetable_display_v6',
  colors: 'timetable_colors_v6',
  theme: 'timetable_theme_v6',
  editedClasses: 'timetable_edited_classes_v6'
};

const safeParseJSON = (str, defaultValue) => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const TimetableProvider = ({ children }) => {
  const [rawData, setRawData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [rootSections, setRootSections] = useState([]);
  const [activeSection, setActiveSection] = useState('');

  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [extraSelections, setExtraSelections] = useState([]);
  const [editedClasses, setEditedClasses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.editedClasses);
    return saved ? safeParseJSON(saved, {}) : {};
  });
  const [selectedTheme, setSelectedTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    return saved || COLOR_THEMES[0].id;
  });

  const [displayOptions, setDisplayOptions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.display);
    const defaultOptions = {
      showTeacher: true,
      showCredits: false,
      showSection: false
    };
    return saved ? safeParseJSON(saved, defaultOptions) : defaultOptions;
  });

  const [colorMap, setColorMap] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.colors);
    return saved ? safeParseJSON(saved, {}) : {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, selectedTheme);
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }, [selectedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.editedClasses, JSON.stringify(editedClasses));
    } catch (error) {
      console.warn('Failed to save edited classes:', error);
    }
  }, [editedClasses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.display, JSON.stringify(displayOptions));
    } catch (error) {
      console.warn('Failed to save display options:', error);
    }
  }, [displayOptions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.colors, JSON.stringify(colorMap));
    } catch (error) {
      console.warn('Failed to save color map:', error);
    }
  }, [colorMap]);

  const processData = useCallback((data, mapping) => {
    const sanitizedData = Array.isArray(data) ? data.map(item => sanitizeObject(item)) : [];
    const sanitizedMapping = sanitizeObject(mapping);

    setRawData(sanitizedData);
    setColumnMapping(sanitizedMapping);

    const sectionCol = sanitizedMapping.section;
    const rootsSet = new Set();
    sanitizedData.forEach(item => {
      const val = item[sectionCol]?.toString().trim();
      if (val && validateSection(val)) {
        rootsSet.add(sanitizeString(val));
      }
    });

    const sortedRoots = Array.from(rootsSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    setRootSections(sortedRoots);
    setActiveSection('');
    setSelectedCourseIds([]);
    setExtraSelections([]);
  }, []);

  const currentThemeColors = useMemo(() => {
    return getThemeColors(selectedTheme);
  }, [selectedTheme]);

  const getOrAssignColor = useCallback((name) => {
    const sanitizedName = sanitizeString(name);
    if (!sanitizedName) return currentThemeColors[0];

    if (colorMap[sanitizedName]) return colorMap[sanitizedName];
    const nextColor = currentThemeColors[Object.keys(colorMap).length % currentThemeColors.length];
    setColorMap(prev => ({ ...prev, [sanitizedName]: nextColor }));
    return nextColor;
  }, [colorMap, currentThemeColors]);

  const getCoursesForSection = useCallback((section) => {
    if (!section || !rawData.length || !columnMapping.section) return [];

    const sanitizedSection = sanitizeString(section).toUpperCase();
    const sectionCol = columnMapping.section;

    return rawData
      .filter(item => {
        const itemSection = sanitizeString(item[sectionCol]?.toString() || '').toUpperCase();
        return itemSection && (itemSection.includes(sanitizedSection) || sanitizedSection.includes(itemSection) || itemSection === 'ALL');
      })
      .filter(item => {
        const name = sanitizeString(item[columnMapping.courseName]?.toString() || '').toUpperCase();
        return !EXCLUDED_COURSES.some(word => name.includes(word));
      })
      .map((item, idx) => ({
        id: `${sanitizeString(item[columnMapping.courseName]?.toString() || '')}-${sanitizeString(item[columnMapping.day]?.toString() || '')}-${sanitizeString(item[columnMapping.startTime]?.toString() || '')}-${idx}`,
        name: sanitizeString(item[columnMapping.courseName]?.toString() || ''),
        section: sanitizeString(item[columnMapping.section]?.toString() || ''),
        day: sanitizeString(item[columnMapping.day]?.toString() || ''),
        startTime: sanitizeString(item[columnMapping.startTime]?.toString() || ''),
        endTime: sanitizeString(item[columnMapping.endTime]?.toString() || ''),
        teacher: sanitizeString(item[columnMapping.instructor]?.toString() || ''),
        room: sanitizeString(item[columnMapping.room]?.toString() || ''),
        credits: sanitizeString(item[columnMapping.credits]?.toString() || '')
      }));
  }, [rawData, columnMapping]);

  const finalActiveClasses = useMemo(() => {
    const list = [];

    if (activeSection) {
      const activeCourses = getCoursesForSection(activeSection);
      selectedCourseIds.forEach(id => {
        const match = activeCourses.find(c => c.id === id);
        if (match) {
          list.push(...activeCourses.filter(c => c.name === match.name));
        }
      });
    }

    extraSelections.forEach(sel => {
      if (sel.section && sel.courseId) {
        const courses = getCoursesForSection(sel.section);
        const match = courses.find(c => c.id === sel.courseId);
        if (match) {
          list.push(...courses.filter(c => c.name === match.name));
        }
      }
    });

    return list.map(cls => {
      const editKey = `${cls.day}-${cls.startTime}-${cls.name}`;
      const edits = editedClasses[editKey];
      return edits ? { ...cls, ...edits } : cls;
    });
  }, [activeSection, selectedCourseIds, extraSelections, getCoursesForSection, editedClasses]);

  const updateClassField = useCallback((classKey, field, value) => {
    setEditedClasses(prev => ({
      ...prev,
      [classKey]: {
        ...prev[classKey],
        [field]: sanitizeString(value)
      }
    }));
  }, []);

  const value = {
    rawData,
    rootSections,
    activeSection,
    setActiveSection,
    selectedCourseIds,
    setSelectedCourseIds,
    extraSelections,
    setExtraSelections,
    finalActiveClasses,
    displayOptions,
    colorMap,
    selectedTheme,
    setSelectedTheme,
    editedClasses,
    updateClassField,
    processData,
    getCoursesForSection,
    getOrAssignColor,
    setDisplayOptions,
    setColorMap,
    COLOR_THEMES
  };

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => useContext(TimetableContext);
