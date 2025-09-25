import React from 'react';

interface Item {
    id: string;
    label: string;
}

interface CategoryCardProps {
    categoryNumber: number;
    title: string;
    items: string[];
    description?: string;
    isSelectable?: boolean;
    selectedItems?: string[];
    onItemSelect?: (item: string, isSelected: boolean) => void;
    onAddItem?: (item: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
    categoryNumber,
    title,
    items,
    description,
    isSelectable = false,
    selectedItems = [],
    onItemSelect,
    onAddItem,
}) => {
    const formattedTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const [inputValue, setInputValue] = React.useState('');

    const handleAddItemClick = () => {
        if (inputValue.trim() && onAddItem) {
            onAddItem(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-semibold text-brand-text/60">CATEGORY {categoryNumber}</p>
                    <h3 className="text-xl font-bold text-brand-text">{formattedTitle}</h3>
                </div>
            </div>
            {description && <p className="text-sm text-brand-text/80 mb-4">{description}</p>}
            <ul className="space-y-3 text-sm text-brand-text/90 flex-grow">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start">
                        {isSelectable && onItemSelect ? (
                            <label className="flex items-start cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                    checked={selectedItems.includes(item)}
                                    onChange={(e) => onItemSelect(item, e.target.checked)}
                                />
                                <span>{item.replace(/\*/g, '')}</span>
                            </label>
                        ) : (
                            <span className="flex items-start">
                                <span className="mr-3 mt-1 text-brand-primary">&bull;</span>
                                <span>{item.replace(/\*/g, '')}</span>
                            </span>
                        )}
                    </li>
                ))}
            </ul>
             {isSelectable && onAddItem && (
                <div className="mt-4 pt-4 border-t border-brand-text/10">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddItemClick();
                                }
                            }}
                            placeholder="Add your own..."
                            className="flex-grow px-2 py-1 text-sm bg-white/50 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-primary focus:outline-none"
                        />
                        <button
                            onClick={handleAddItemClick}
                            className="px-3 py-1 text-sm font-semibold text-white rounded-md hover:opacity-90 transition-opacity" style={{ backgroundColor: '#6B7280' }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryCard;