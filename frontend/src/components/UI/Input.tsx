import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(7);
    const hasError = !!error;

    return (
      <div className={`w-full flex flex-col ${className}`}>
        {label && (
          <label htmlFor={inputId} className="fs-label">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`fs-input ${leftIcon ? '!pl-10' : ''} ${rightIcon ? '!pr-10' : ''} ${
              hasError ? 'border-brand-danger focus:border-brand-danger focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : ''
            }`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <span className={`text-caption mt-1 ${error ? 'text-brand-danger' : ''}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
