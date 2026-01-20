import { forwardRef } from 'react';
import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
type ButtonSize = 'sm' | 'md';

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button({ className, variant = 'primary', size = 'md', ...props }, ref) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    brand: 'bg-[#ee4d2d] text-white hover:bg-[#d63f22] focus:ring-[#ee4d2d]/25',
    secondary: 'border bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
  };

  return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
});


