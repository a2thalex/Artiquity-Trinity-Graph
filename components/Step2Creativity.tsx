import React, { useState, useCallback } from 'react';
import { generateCreativeImage } from '../services/artistCapsuleService';
import type { CreativeOutput } from '../types/artistCapsule';
import Card from './Card';
import Loader from './Loader';

interface Step2CreativityProps {
  artistName: string;
  selectedIdentityElements: string[];
  onComplete: (output: CreativeOutput) => void;
}

const strategies = {
  'Context Reimagination': {
    description: "Drop the artist's DNA into totally new backdrops.",
    inputs: [
      { name: 'timePeriod', placeholder: 'e.g., 1940s Hollywood, distant future' },
      { name: 'culturalSetting', placeholder: 'e.g., Tokyo street, Martian colony' },
      { name: 'genreShift', placeholder: 'e.g., Film noir, folk art, cyberpunk' },
    ],
  },
  'Medium Transposition': {
    description: 'Apply their style to different forms or materials.',
    inputs: [
        { name: 'newMedium', placeholder: 'e.g., Textiles, pottery, VR installation' },
        { name: 'newFormat', placeholder: 'e.g., Couture fashion, animated shorts' },
    ],
  },
  'Style & Motif Remixing': {
    description: "Recombine the artist's signature elements in unexpected ways.",
    inputs: [
        { name: 'motifToPair', placeholder: 'e.g., Pair motifs that normally live apart' },
        { name: 'themeToAmplify', placeholder: 'e.g., Amplify or mute a recurring theme' },
    ],
  },
  'World-Building Variations': {
    description: 'Construct alternate worlds that still feel authentic.',
    inputs: [{ name: 'whatIfScenario', placeholder: 'e.g., This artist in X mythology' }],
  },
};

const Step2Creativity: React.FC<Step2CreativityProps> = ({ artistName, selectedIdentityElements, onComplete }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [creativeOutput, setCreativeOutput] = useState<CreativeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setCustomInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedStrategy) return;
    
    setIsLoading(true);
    setError(null);
    setCreativeOutput(null);

    try {
      const result = await generateCreativeImage(artistName, selectedIdentityElements, selectedStrategy, customInputs);
      setCreativeOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [artistName, selectedIdentityElements, selectedStrategy, customInputs]);

  const handleProceed = () => {
    if (creativeOutput) {
      onComplete(creativeOutput);
    }
  };

  const isGenerateDisabled = !selectedStrategy || (strategies[selectedStrategy]?.inputs.some(input => !customInputs[input.name]?.trim()));

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in space-y-8">
      {!creativeOutput && (
        <>
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white text-shadow-md">The Generator</h2>
            <p className="text-white/80 mt-2 max-w-2xl mx-auto">
              Expands the Identity into new but still rule-aligned expressions. Select a strategy to begin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(strategies).map(([name, details]) => (
              <button
                key={name}
                onClick={() => setSelectedStrategy(name)}
                className={`p-6 rounded-2xl text-left transition-all duration-300 ${selectedStrategy === name ? 'bg-white/60 ring-2 ring-white' : 'bg-white/30 hover:bg-white/40'}`}
              >
                <h3 className="font-bold text-xl text-stone-800">{name}</h3>
                <p className="text-stone-700 mt-1">{details.description}</p>
              </button>
            ))}
          </div>
          
          {selectedStrategy && (
            <Card>
              <h3 className="font-bold text-xl mb-4">Define Direction for <span className="text-sky-700">{selectedStrategy}</span></h3>
              <div className="space-y-4">
                {strategies[selectedStrategy].inputs.map(input => (
                  <input
                    key={input.name}
                    type="text"
                    value={customInputs[input.name] || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    placeholder={input.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/50 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                  />
                ))}
              </div>
              <div className="mt-6 text-center">
                 <button onClick={handleGenerate} disabled={isGenerateDisabled || isLoading} className="px-10 py-4 text-white font-bold rounded-xl transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90" style={{ backgroundColor: '#6B7280' }}>
                  {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
              </div>
            </Card>
          )}

          {isLoading && <Loader message={`Generating a visual for "${selectedStrategy}"...`} />}
          {error && <Card><p className="text-red-700 text-center">{error}</p></Card>}
        </>
      )}

      {creativeOutput && (
         <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center text-white text-shadow-md mb-2">Creative Synthesis</h2>
            <p className="text-center text-white/80 -mt-1 mb-8">A new work, born from your direction and the essence of <span className="font-bold">{artistName}</span>.</p>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <img src={creativeOutput.imageUrl} alt="Generated artwork" className="rounded-lg shadow-lg w-full aspect-square object-cover" />
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl">Generated Vision</h3>
                        <p className="text-stone-700 leading-relaxed text-sm italic">{creativeOutput.prompt}</p>
                         <div className="flex gap-4 pt-4">
                           <button onClick={handleGenerate} disabled={isLoading} className="w-full px-6 py-3 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#6B7280' }}>
                             {isLoading ? 'Generating...' : 'Re-generate'}
                           </button>
                           <button onClick={handleProceed} className="w-full px-6 py-3 hover:opacity-90 text-white font-bold rounded-xl transition-all duration-300" style={{ backgroundColor: '#6B7280' }}>
                             Analyze Synchronicity
                           </button>
                         </div>
                    </div>
                </div>
            </Card>
            {error && <Card><p className="text-red-700 text-center">{error}</p></Card>}
        </div>
      )}
    </div>
  );
};

export default Step2Creativity;
