import { useState, useCallback } from 'react';
import type { UseFormReturn, FieldPath } from 'react-hook-form';

export interface StepConfig<TFieldValues extends Record<string, any> = Record<string, any>> {
  id: string;
  label: string;
  fields?: FieldPath<TFieldValues>[];
}

export interface UseMultiStepFormOptions<TFieldValues extends Record<string, any>> {
  steps: StepConfig<TFieldValues>[];
  form: UseFormReturn<TFieldValues, any, undefined>;
  initialStep?: number;
  onStepChange?: (stepIndex: number, stepId: string) => void;
}

export function useMultiStepForm<TFieldValues extends Record<string, any>>({
  steps,
  form,
  initialStep = 0,
  onStepChange,
}: UseMultiStepFormOptions<TFieldValues>) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepConfig = steps[currentStep];

  /**
   * Validate only the fields registered for the current step.
   * Returns true if step is valid, false otherwise.
   */
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const fieldsToValidate = currentStepConfig?.fields;
    if (!fieldsToValidate || fieldsToValidate.length === 0) {
      return true;
    }
    const isValid = await form.trigger(fieldsToValidate as any);
    return isValid;
  }, [form, currentStepConfig]);

  /**
   * Validate all steps prior to targetStepIndex.
   */
  const validatePrecedingSteps = useCallback(
    async (targetStepIndex: number): Promise<boolean> => {
      let allFieldsToValidate: FieldPath<TFieldValues>[] = [];
      for (let i = 0; i < targetStepIndex; i++) {
        if (steps[i]?.fields) {
          allFieldsToValidate = [...allFieldsToValidate, ...steps[i].fields!];
        }
      }
      if (allFieldsToValidate.length === 0) {
        return true;
      }
      return await form.trigger(allFieldsToValidate as any);
    },
    [form, steps]
  );

  /**
   * Advance to the next step if current step validation passes.
   */
  const goToNextStep = useCallback(async (): Promise<boolean> => {
    if (isLastStep) return false;
    const isValid = await validateCurrentStep();
    if (isValid) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      if (onStepChange && steps[nextIndex]) {
        onStepChange(nextIndex, steps[nextIndex].id);
      }
      return true;
    }
    return false;
  }, [currentStep, isLastStep, validateCurrentStep, onStepChange, steps]);

  /**
   * Move back to the previous step.
   */
  const goToPreviousStep = useCallback(() => {
    if (isFirstStep) return;
    const prevIndex = currentStep - 1;
    setCurrentStep(prevIndex);
    if (onStepChange && steps[prevIndex]) {
      onStepChange(prevIndex, steps[prevIndex].id);
    }
  }, [currentStep, isFirstStep, onStepChange, steps]);

  /**
   * Jump to a specific step if all preceding steps are valid (or going backward).
   */
  const goToStep = useCallback(
    async (targetStepIndex: number): Promise<boolean> => {
      if (targetStepIndex < 0 || targetStepIndex >= steps.length) return false;
      if (targetStepIndex === currentStep) return true;

      // Moving backward is always allowed without re-validating forward fields
      if (targetStepIndex < currentStep) {
        setCurrentStep(targetStepIndex);
        if (onStepChange && steps[targetStepIndex]) {
          onStepChange(targetStepIndex, steps[targetStepIndex].id);
        }
        return true;
      }

      // Moving forward requires validating all preceding steps
      const isPrecedingValid = await validatePrecedingSteps(targetStepIndex);
      if (isPrecedingValid) {
        setCurrentStep(targetStepIndex);
        if (onStepChange && steps[targetStepIndex]) {
          onStepChange(targetStepIndex, steps[targetStepIndex].id);
        }
        return true;
      }
      return false;
    },
    [currentStep, steps, validatePrecedingSteps, onStepChange]
  );

  /**
   * Completely reset multi-step form state & react-hook-form values & validation errors.
   */
  const resetMultiStepForm = useCallback(
    (defaultValues?: Partial<TFieldValues>) => {
      setCurrentStep(0);
      form.reset(defaultValues as any);
      form.clearErrors();
      if (onStepChange && steps[0]) {
        onStepChange(0, steps[0].id);
      }
    },
    [form, onStepChange, steps]
  );

  return {
    currentStep,
    activeStepId: currentStepConfig?.id ?? steps[0]?.id ?? '',
    isFirstStep,
    isLastStep,
    totalSteps: steps.length,
    currentStepConfig,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    validateCurrentStep,
    resetMultiStepForm,
  };
}
