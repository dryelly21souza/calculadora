import React, { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTitleProps {
  defaultText: string;
  storageKey?: string;
  className?: string;
  onSaveValue?: (newVal: string) => void;
  icon?: React.ReactNode;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({ 
  defaultText, 
  storageKey, 
  className = "", 
  onSaveValue,
  icon
}) => {
  const [val, setVal] = useState(defaultText);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`ui_title_${storageKey}`);
      if (stored) setVal(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (!val.trim()) setVal(defaultText);
    
    if (storageKey) {
      localStorage.setItem(`ui_title_${storageKey}`, val.trim() || defaultText);
    }
    if (onSaveValue) {
      onSaveValue(val.trim() || defaultText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setVal(defaultText);
    }
  };

  if (isEditing) {
    return (
      <input 
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-white border-2 border-indigo-300 text-indigo-900 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-xs transition-all ${className}`}
      />
    );
  }

  return (
    <div className="group relative inline-flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
      {icon}
      <span className={className}>{val}</span>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-500">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
