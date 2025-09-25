import React from 'react';
import type { CreativeIdeas } from '../types/trinity';
import CategoryCard from './CategoryCard';

interface Step2CreativityProps {
    brandName: string;
    creativeIdeas: Partial<CreativeIdeas> | null;
    selectedItems: Record<string, string[]>;
    setSelectedItems: (items: Record<string, string[]>) => void;
    handleNext: () => void;
    error: string | null;
    setError: (error: string | null) => void;
}

const StepHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="text-center mb-8 md:mb-12 animate-fade-in-down">
        <h1 className="text-5xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="max-w-3xl mx-auto text-slate-600">{description}</p>
    </div>
);


const Step2_Creativity: React.FC<Step2CreativityProps> = ({
    brandName,
    creativeIdeas,
    selectedItems,
    setSelectedItems,
    handleNext,
    error,
    setError,
}) => {
    
    const handleItemSelect = (category: keyof CreativeIdeas, item: string, isSelected: boolean) => {
        setError(null);
        const currentSelection = selectedItems[category] || [];
        const newSelection = isSelected
            ? [...currentSelection, item]
            : currentSelection.filter(i => i !== item);
        setSelectedItems({ ...selectedItems, [category]: newSelection });
    };

    if (!creativeIdeas) {
        return <p>Loading creative ideas...</p>;
    }

    return (
        <div className="w-full max-w-7xl animate-fade-in">
             <StepHeader 
                title="Creativity: The Generator"
                description={`Here are new expressions for ${brandName}, built from its core identity. Select the most promising ideas to map against current cultural trends.`}
            />
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.keys(creativeIdeas) as Array<keyof CreativeIdeas>).map((key, index) => (
                    creativeIdeas[key] && creativeIdeas[key]!.length > 0 &&
                    <CategoryCard
                        key={key}
                        categoryNumber={index + 1}
                        title={key}
                        items={creativeIdeas[key]!}
                        isSelectable={true}
                        selectedItems={selectedItems[key] || []}
                        onItemSelect={(item, isSelected) => handleItemSelect(key, item, isSelected)}
                    />
                ))}
            </div>
            <div className="text-center mt-8">
                <button onClick={handleNext} className="text-white font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-opacity duration-300 text-lg" style={{ backgroundColor: '#6B7280' }}>
                    Analyze Cultural Trends →
                </button>
            </div>
        </div>
    );
};

export default Step2_Creativity;
