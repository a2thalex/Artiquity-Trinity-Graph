
import React, { useState } from 'react';
import { DocumentDuplicateIcon, CheckCircleIcon } from './icons';

interface OutputDisplayProps {
    rslText: string;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ rslText }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(rslText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-lg relative">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Generated RSL Certificate</h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-800 p-4 rounded-md overflow-x-auto">
                    {rslText}
                </pre>
            </div>
            <div className="absolute top-4 right-4">
                <button
                    onClick={handleCopy}
                    className="flex items-center justify-center p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
                >
                    {copied ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    ) : (
                        <DocumentDuplicateIcon className="w-5 h-5" />
                    )}
                    <span className="sr-only">Copy</span>
                </button>
            </div>
        </div>
    );
};
