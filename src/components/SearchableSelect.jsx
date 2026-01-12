import { ChevronDown, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = '',
  ariaLabel = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => {
      const label = typeof opt === 'string' ? opt : opt.label || opt.value || '';
      return label.toLowerCase().includes(term);
    });
  }, [options, searchTerm]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const option = options.find(opt => {
      const optValue = typeof opt === 'string' ? opt : opt.value || '';
      return optValue === value;
    });
    return typeof option === 'string' ? option : option?.label || option?.value || value;
  }, [options, value]);

  const handleSelect = useCallback((selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`searchable-select ${className} ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
      >
        <span className="searchable-select-value">
          {selectedLabel || <span className="placeholder">{placeholder}</span>}
        </span>
        <div className="searchable-select-actions">
          {value && !disabled && (
            <button
              type="button"
              className="searchable-select-clear"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <Search size={16} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="searchable-select-input"
            />
          </div>
          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">No options found</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optValue = typeof opt === 'string' ? opt : opt.value || '';
                const optLabel = typeof opt === 'string' ? opt : opt.label || opt.value || '';
                const isSelected = optValue === value;

                return (
                  <button
                    key={optValue || idx}
                    type="button"
                    className={`searchable-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(optValue)}
                  >
                    {optLabel}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
