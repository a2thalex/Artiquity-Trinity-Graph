
import React from 'react';

interface ActionButtonsProps {
    onBack?: () => void;
    onNext: () => void;
    nextText: string;
    isNextDisabled?: boolean;
    isLoading?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onBack, onNext, nextText, isNextDisabled = false, isLoading = false }) => {
    return (
        <div className="flex items-center justify-end space-x-4 pt-8 w-full max-w-2xl">
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-md bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                >
                    Back
                </button>
            )}
            <button
                type="button"
                onClick={onNext}
                disabled={isNextDisabled || isLoading}
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {isLoading ? 'Processing...' : nextText}
            </button>
        </div>
    );
};
