
import React from 'react';
import type { CreativeIdeas } from '../types/trinity';

interface Step2CategorySelectionProps {
    selectedCategories: (keyof CreativeIdeas)[];
    setSelectedCategories: (categories: (keyof CreativeIdeas)[]) => void;
    handleNext: () => void;
    error: string | null;
    setError: (error: string | null) => void;
}

const creativeCategories: { key: keyof CreativeIdeas; name: string; description: string }[] = [
    { key: 'audience_expansion', name: 'Audience Expansion', description: 'Reach new consumer segments or demographics.' },
    { key: 'product_and_format_transposition', name: 'Product & Format Transposition', description: 'Re-imagine existing products or codes in new ways.' },
    { key: 'campaign_and_experience_innovation', name: 'Campaign & Experience Innovation', description: 'Translate the brand\'s core story into fresh activations.' },
    { key: 'category_exploration', name: 'Category Exploration', description: 'Extend the brand\'s codes into new or adjacent spaces.' },
    { key: 'partnership_and_collaboration', name: 'Partnership & Collaboration', description: 'Leverage the brand\'s codes in collaborations with others.' },
];

const Step2_CategorySelection: React.FC<Step2CategorySelectionProps> = ({
    selectedCategories,
    setSelectedCategories,
    handleNext,
    error,
    setError
}) => {
    const handleCategoryToggle = (categoryKey: keyof CreativeIdeas) => {
        setError(null);
        const newSelection = selectedCategories.includes(categoryKey)
            ? selectedCategories.filter(c => c !== categoryKey)
            : [...selectedCategories, categoryKey];
        setSelectedCategories(newSelection);
    };

    return (
        <div className="w-full max-w-3xl animate-fade-in">
            <div className="text-center mb-8 md:mb-12">
                <h1 className="text-5xl font-bold text-slate-800 mb-2">Creativity: The Generator</h1>
                <p className="max-w-3xl mx-auto text-slate-600">Select the areas you want to explore. The tool will generate targeted creative ideas based on your focus.</p>
            </div>
            
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}

            <div className="space-y-4">
                {creativeCategories.map(({ key, name, description }) => (
                    <label key={key} htmlFor={key} className="flex items-center p-4 bg-white/40 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                        <input
                            id={key}
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            checked={selectedCategories.includes(key)}
                            onChange={() => handleCategoryToggle(key)}
                        />
                        <div className="ml-4">
                            <h3 className="font-bold text-brand-text">{name}</h3>
                            <p className="text-sm text-brand-text/80">{description}</p>
                        </div>
                    </label>
                ))}
            </div>
            
            <div className="text-center mt-8">
                <button onClick={handleNext} className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-300 text-lg">
                    Build Identity Capsule →
                </button>
            </div>
        </div>
    );
};

export default Step2_CategorySelection;
