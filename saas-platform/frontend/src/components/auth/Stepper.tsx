import styles from './Stepper.module.css';

interface StepperProps {
  steps: string[];
  currentStep: number; // 1-indexed
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className={styles.stepper}>
      {steps.map((label, i) => {
        const stepNumber = i + 1;
        const state = stepNumber < currentStep ? 'done' : stepNumber === currentStep ? 'active' : 'pending';
        return (
          <li key={label} className={styles.step} data-state={state}>
            <span className={styles.circle}>{state === 'done' ? '✓' : stepNumber}</span>
            <span className={styles.label}>{label}</span>
            {i < steps.length - 1 && <span className={styles.connector} data-filled={stepNumber < currentStep} />}
          </li>
        );
      })}
    </ol>
  );
}
