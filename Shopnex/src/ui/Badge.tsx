import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'secondary';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  secondary: 'bg-slate-200 text-slate-600',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}


