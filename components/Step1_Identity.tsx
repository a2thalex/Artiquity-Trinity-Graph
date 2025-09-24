
import React from 'react';
import type { IdentityCapsule } from '../types/trinity';
import { AppStep } from '../types/trinity';
import CategoryCard from './CategoryCard';

interface Step1IdentityProps {
    step: AppStep;
    brandName: string;
    setBrandName: (name: string) => void;
    setBrandFiles: (files: File[]) => void;
    identityCapsule: IdentityCapsule | null;
    setIdentityCapsule: (capsule: React.SetStateAction<IdentityCapsule | null>) => void;
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

const Step1_Identity: React.FC<Step1IdentityProps> = ({
    step,
    brandName,
    setBrandName,
    setBrandFiles,
    identityCapsule,
    setIdentityCapsule,
    selectedItems,
    setSelectedItems,
    handleNext,
    error,
    setError,
}) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setBrandFiles(Array.from(event.target.files));
        }
    };
    
    const handleItemSelect = (category: keyof IdentityCapsule, item: string, isSelected: boolean) => {
        setError(null);
        const currentSelection = selectedItems[category] || [];
        const newSelection = isSelected
            ? [...currentSelection, item]
            : currentSelection.filter(i => i !== item);
        setSelectedItems({ ...selectedItems, [category]: newSelection });
    };

    const handleAddItem = (category: keyof IdentityCapsule, newItem: string) => {
        if (!newItem.trim() || !identityCapsule) return;

        // Prevent adding duplicates
        if (identityCapsule[category].map(item => item.toLowerCase()).includes(newItem.trim().toLowerCase())) {
            return;
        }

        setIdentityCapsule(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [category]: [...prev[category], newItem.trim()]
            };
        });

        // Auto-select the newly added item
        handleItemSelect(category, newItem.trim(), true);
    };


    if (step === AppStep.IDENTITY_INPUT) {
        return (
            <div className="w-full max-w-lg text-center animate-fade-in">
                <h2 className="text-3xl font-bold text-brand-text mb-4">Define the Brand</h2>
                <p className="text-brand-text/80 mb-8">Enter a brand name and optionally upload any relevant materials like brand guides or mission statements.</p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
                <div className="space-y-4">
                    <input
                        type="text"
                        value={brandName}
                        onChange={(e) => {
                            setBrandName(e.target.value);
                            if(error) setError(null);
                        }}
                        placeholder="e.g., Nike, Coca-Cola, etc."
                        className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"
                    />
                </div>
                <button
                    onClick={handleNext}
                    className="mt-8 w-full bg-brand-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-600 transition-colors duration-300"
                >
                    Select Objectives →
                </button>
            </div>
        );
    }

    if (step === AppStep.IDENTITY_RESULT && identityCapsule) {
        // Define the desired order of categories
        const categoryOrder: (keyof IdentityCapsule)[] = [
            'hero_products',
            'aesthetic_codes_and_expressions',
            'mission_and_values',
            'usage_contexts',
            'constraints_and_boundaries',
            'brand_archetype'
        ];

        // Filter keys to only those present in the result, while maintaining order
        const orderedKeys = categoryOrder.filter(key => key in identityCapsule && Array.isArray(identityCapsule[key]));

        return (
            <div className="w-full max-w-7xl animate-fade-in">
                <StepHeader 
                    title="Identity: The Capsule" 
                    description={`This is the core DNA of ${brandName}. Select the elements you want to use as a foundation for generating new creative ideas.`}
                />
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orderedKeys.map((key, index) => (
                        <CategoryCard
                            key={key}
                            categoryNumber={index + 1}
                            title={key}
                            items={identityCapsule[key]}
                            isSelectable={true}
                            selectedItems={selectedItems[key] || []}
                            onItemSelect={(item, isSelected) => handleItemSelect(key, item, isSelected)}
                            onAddItem={(item) => handleAddItem(key, item)}
                        />
                    ))}
                </div>
                <div className="text-center mt-8">
                    <button onClick={handleNext} className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-300 text-lg">
                        Generate Creative Ideas →
                    </button>
                </div>
            </div>
        );
    }
    
    return null;
};

export default Step1_Identity;
