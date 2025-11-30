import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  label, 
  icon, 
  variant = 'primary', 
  disabled = false, 
  fullWidth = false,
  className = ''
}) => {
  const baseStyles = "flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-sun-400 hover:bg-sun-500 text-white shadow-lg shadow-sun-200",
    secondary: "bg-sky-400 hover:bg-sky-500 text-white shadow-lg shadow-sky-200",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-sun-400 hover:text-sun-500"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};