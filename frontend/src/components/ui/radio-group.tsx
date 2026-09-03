import * as React from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value: valueProp, defaultValue, onValueChange, disabled, children, ...props }, ref) => {
    const [value, setValue] = React.useState(valueProp ?? defaultValue);

    React.useEffect(() => {
      if (valueProp !== undefined) {
        setValue(valueProp);
      }
    }, [valueProp]);

    const handleValueChange = React.useCallback(
      (val: string) => {
        if (valueProp === undefined) {
          setValue(val);
        }
        onValueChange?.(val);
      },
      [onValueChange, valueProp]
    );

    return (
      <RadioGroupContext.Provider value={{ value, onValueChange: handleValueChange, disabled }}>
        <div role="radiogroup" className={cn('grid gap-2', className)} ref={ref} {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const checked = context.value === value;
    const isDisabled = disabled || context.disabled;

    return (
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={isDisabled}
        onClick={() => !isDisabled && context.onValueChange?.(value)}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-all',
          checked ? 'bg-primary text-primary-foreground' : 'bg-transparent',
          className
        )}
        ref={ref}
        {...props}
      >
        {checked && <Circle className="h-2 w-2 fill-current text-current" />}
      </button>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
