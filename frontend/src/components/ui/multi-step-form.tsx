import React from 'react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import type { StepConfig } from '@/hooks/useMultiStepForm';

export interface MultiStepFormFooterProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isEditing?: boolean;
  isSubmitting?: boolean;
  cancelLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  createLabel?: string;
  saveLabel?: string;
  saveAndContinueLabel?: string;
  showSaveAndContinue?: boolean;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onSaveAndContinue?: () => void;
  onSubmit?: (e?: React.FormEvent) => void;
}

export function MultiStepFormFooter({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  isEditing = false,
  isSubmitting = false,
  cancelLabel = 'Cancel',
  nextLabel = 'Next',
  backLabel = 'Back',
  createLabel = 'Create',
  saveLabel = 'Save Changes',
  saveAndContinueLabel,
  showSaveAndContinue = false,
  onCancel,
  onBack,
  onNext,
  onSaveAndContinue,
  onSubmit,
}: MultiStepFormFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between border-t border-border/80 pt-3 mt-4 gap-2">
      {/* Left side: Cancel button */}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      </div>

      {/* Right side: Back, Next, Save & Continue, and Final Submit buttons */}
      <div className="flex items-center gap-2">
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Button>
        )}

        {!isLastStep && (
          <Button
            type="button"
            size="sm"
            className="text-xs h-8 gap-1 font-semibold"
            onClick={onNext}
            disabled={isSubmitting}
          >
            {nextLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {isLastStep && showSaveAndContinue && onSaveAndContinue && !isEditing && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs h-8 font-medium"
            disabled={isSubmitting}
            onClick={onSaveAndContinue}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            {saveAndContinueLabel ?? 'Save & Continue'}
          </Button>
        )}

        {isLastStep && (
          <Button
            type={onSubmit ? 'button' : 'submit'}
            size="sm"
            className="text-xs h-8 font-semibold gap-1 min-w-[100px]"
            disabled={isSubmitting}
            onClick={onSubmit ? (e) => onSubmit(e) : undefined}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isEditing ? saveLabel : createLabel}</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export interface MultiStepTabsHeaderProps {
  steps: StepConfig[];
  currentStep: number;
  onSelectStep: (stepIndex: number) => void;
  className?: string;
}

export function MultiStepTabsHeader({
  steps,
  currentStep,
  onSelectStep,
  className = '',
}: MultiStepTabsHeaderProps) {
  const gridColsClass =
    steps.length === 2
      ? 'grid-cols-2'
      : steps.length === 3
      ? 'grid-cols-3'
      : steps.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-5';

  return (
    <TabsList className={`grid w-full ${gridColsClass} ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <TabsTrigger
            key={step.id}
            value={step.id}
            className="text-xs relative flex items-center justify-center gap-1.5 py-1.5"
            onClick={(e) => {
              e.preventDefault();
              onSelectStep(idx);
            }}
          >
            {isCompleted ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                <Check className="h-2.5 w-2.5" />
              </span>
            ) : (
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx + 1}
              </span>
            )}
            <span className="truncate">{step.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
