
import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      {label && <span className="text-slate-200 font-semibold text-sm tracking-wide">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${
          checked ? 'bg-primary' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block transform rounded-full bg-white transition-all duration-300 shadow-sm ${
            checked 
              ? 'translate-x-7 h-6 w-6 bg-slate-900 scale-110' 
              : 'translate-x-1 h-4 w-4'
          }`}
        />
      </button>
    </div>
  );
};
