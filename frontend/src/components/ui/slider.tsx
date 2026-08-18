import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, className }, ref) => {
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className={cn('w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary', className)}
      />
    );
  },
);
Slider.displayName = 'Slider';
