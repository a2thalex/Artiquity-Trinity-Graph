import React, { useState, useCallback } from 'react';
import { generateIdentityCapsule } from '../services/artistCapsuleService';
import Card from './Card';
import Loader from './Loader';
import type { IdentityCapsule } from '../types/artistCapsule';

interface Step1IdentityProps {
  onComplete: (name: string, capsule: IdentityCapsule, selectedElements: string[]) => void;
}

const categoryTitles: { [K in keyof IdentityCapsule]: string } = {
  aestheticCodes: "Aesthetic Codes",
  tonalSignatures: "Tonal Signatures",
  techniquesAndMediums: "Techniques & Mediums",
  philosophyAndIntent: "Philosophy & Intent",
  constraintsAndBoundaries: "Constraints & Boundaries",
  signatureGesturesAndCodes: "Signature Gestures & Codes"
};

const Step1Identity: React.FC<Step1IdentityProps> = ({ onComplete }) => {
  const [artistName, setArtistName] = useState('');
  const [capsule, setCapsule] = useState<IdentityCapsule | null>(null);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim()) return;
    setIsLoading(true);
    setError(null);
    setCapsule(null);
    setSelectedElements(new Set());
    try {
      const result = await generateIdentityCapsule(artistName);
      setCapsule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [artistName]);

  const toggleSelection = (element: string) => {
    setSelectedElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(element)) {
        newSet.delete(element);
      } else {
        newSet.add(element);
      }
      return newSet;
    });
  };
  
  const handleProceed = () => {
    if (capsule) {
      onComplete(artistName, capsule, Array.from(selectedElements));
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      {!capsule && (
        <Card className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Build the Capsule</h2>
          <p className="text-stone-600 mb-6">
            Enter the name of an artist to define their enduring DNA – the ethos, aesthetic codes, and recurring signatures that make their work unmistakably theirs.
          </p>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g., Vincent van Gogh, Banksy, Frida Kahlo"
              className="w-full sm:w-96 px-4 py-3 rounded-xl border border-white/30 bg-white/50 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-8 py-3 bg-white/70 hover:bg-white/90 text-stone-800 font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !artistName.trim()}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </form>
          {isLoading && <Loader message={`Analyzing ${artistName}...`} />}
          {error && <p className="mt-4 text-red-700 bg-red-100 p-3 rounded-lg">{error}</p>}
        </Card>
      )}

      {capsule && (
        <div className="space-y-8">
           <h2 className="text-4xl font-bold text-center text-white text-shadow-md mb-2">{artistName}'s Identity Capsule</h2>
           <p className="text-center text-white/80 -mt-1 mb-8">Select the core elements you want to carry into the next phase.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FIX: Use a type-safe method to iterate over capsule properties to avoid indexing errors. */}
            {(Object.keys(capsule) as Array<keyof IdentityCapsule>).map((key) => (
              <Card key={key}>
                <h3 className="font-bold text-lg mb-3 border-b border-stone-400/50 pb-2">{categoryTitles[key]}</h3>
                <ul className="space-y-2">
                  {capsule[key].map((item, index) => (
                    <li key={index} className="flex items-center">
                      <label className="flex items-start text-sm text-stone-700 cursor-pointer">
                        <input
                           type="checkbox"
                           checked={selectedElements.has(item)}
                           onChange={() => toggleSelection(item)}
                           className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 shrink-0"
                        />
                        <span>{item}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={handleProceed}
              className="px-10 py-4 bg-white/80 hover:bg-white text-stone-800 font-bold rounded-xl transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedElements.size === 0}
            >
              Proceed to Creativity ({selectedElements.size} selected)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Identity;