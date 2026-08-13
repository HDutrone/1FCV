import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface Step {
  label: string;
}

export function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < current;
        const isCurrent = stepNumber === current;
        return (
          <li key={step.label} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isComplete && "bg-brand-600 text-white",
                  isCurrent && "bg-brand-100 text-brand-700 ring-2 ring-brand-600",
                  !isComplete && !isCurrent && "bg-surface-muted text-foreground-muted",
                )}
              >
                {isComplete ? <Check size={16} /> : stepNumber}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isCurrent ? "text-foreground" : "text-foreground-muted",
                )}
              >
                {step.label}
              </span>
            </div>
            {stepNumber < steps.length && (
              <div className={cn("h-px flex-1", isComplete ? "bg-brand-600" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
