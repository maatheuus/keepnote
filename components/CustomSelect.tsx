import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string; // Tailwind text color class
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  options, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-2 px-3 py-2 bg-white dark:bg-[#1e1a1c] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:border-marker dark:hover:border-marker transition-colors outline-none focus:ring-2 focus:ring-marker/20 text-sm font-medium text-ink dark:text-paper min-w-[140px]"
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          {selectedOption?.icon}
          <span className={selectedOption?.color}>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <CaretDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e1a1c] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  value === option.value ? 'bg-gray-50 dark:bg-gray-800 text-marker' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className={option.color}>{option.label}</span>
                </div>
                {value === option.value && <Check size={14} weight="bold" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
