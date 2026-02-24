"use client";
import { Check } from "@phosphor-icons/react";
import type { BookingStep } from "@/lib/types";

const STEPS = [
  { number: 1, label: "Village & Dates" },
  { number: 2, label: "Room Selection" },
  { number: 3, label: "Guest Details" },
  { number: 4, label: "Confirmation" },
] as const;

interface StepIndicatorProps {
  currentStep: BookingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, idx) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isUpcoming = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-body transition-all duration-150
                  ${isCompleted ? "bg-lynra-obsidian text-lynra-white" : ""}
                  ${isActive ? "bg-lynra-ember text-lynra-white" : ""}
                  ${isUpcoming ? "border border-lynra-aluminium text-lynra-haze bg-lynra-white" : ""}
                `}
              >
                {isCompleted ? (
                  <Check size={14} weight="bold" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`
                  text-xs font-body whitespace-nowrap hidden sm:block
                  ${isActive ? "text-lynra-obsidian font-semibold" : "text-lynra-haze"}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`
                  flex-1 h-px mx-3 mb-5 sm:mb-0 transition-colors duration-150
                  ${step.number < currentStep ? "bg-lynra-obsidian" : "bg-lynra-aluminium"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
