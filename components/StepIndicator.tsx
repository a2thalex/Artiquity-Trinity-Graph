import React from 'react';
import { Step } from '../types/artistCapsule';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps = [
  { id: Step.Identity, name: 'Identity' },
  { id: Step.Creativity, name: 'Creativity' },
  { id: Step.Synchronicity, name: 'Synchronicity' },
  { id: Step.Campaign, name: 'Campaign' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <nav className="flex justify-center items-center space-x-4 sm:space-x-8 my-8 animate-fade-in" aria-label="Progress">
      {steps.map((step, index) => (
        <div key={step.name} className="flex items-center">
          <div className="flex items-center text-sm font-medium">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold transition-all duration-300 ${
                currentStep >= step.id ? 'bg-white/80 text-stone-700 scale-110' : 'bg-white/30 text-white/70'
              }`}
            >
              {step.id}
            </span>
            <span className={`ml-4 text-base font-bold hidden sm:block ${currentStep >= step.id ? 'text-white' : 'text-white/60'}`}>{step.name}</span>
          </div>
          {index !== steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-4 transition-all duration-300 ${currentStep > step.id ? 'bg-white/70' : 'bg-white/20'}`} />
          )}
        </div>
      ))}
    </nav>
  );
};

export default StepIndicator;
