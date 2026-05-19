import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-sm',
      secondary: 'bg-[#4F46E5] text-white hover:bg-[#4338ca] shadow-sm',
      outline: 'border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F5F7FB]',
      ghost: 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F5F7FB]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = ({ className, hover, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all',
      hover && 'hover:shadow-md hover:border-[#CBD5E1]',
      className
    )}
    {...props}
  />
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'default';
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    success: 'bg-[#DCFCE7] text-[#166534]',
    warning: 'bg-[#FEF9C3] text-[#854d0e]',
    info: 'bg-[#DBEAFE] text-[#1e40af]',
    default: 'bg-[#F1F5F9] text-[#475569]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
