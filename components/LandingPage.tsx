import React, { useState } from 'react';
import { RSLFile, LicenseOptions } from '../types';
import { generateRSL, generateRSLPreview } from '../services/rslService';

const initialLicenseOptions: LicenseOptions = {
    provenanceInfo: '',
    allowAIModels: false,
    allowIndexing: false,
    allowDerivatives: 'no',
    commercialUse: 'no',
    paymentModel: 'free',
    paymentAmount: 0.01,
    paymentCurrency: 'USD',
    attributionText: '',
    subscriptionPeriod: 'monthly',
};

type Step = 'upload' | 'configure' | 'review' | 'complete';

export const LandingPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>('upload');
    const [rslFile, setRslFile] = useState<RSLFile | null>(null);
    const [licenseOptions, setLicenseOptions] = useState<LicenseOptions>(initialLicenseOptions);
    const [rslText, setRslText] = useState<string>('');
    const [embeddedFile, setEmbeddedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const steps = [
        { id: 'upload', title: 'Upload Content', description: 'Select your digital artwork' },
        { id: 'configure', title: 'Configure License', description: 'Set permissions and payment' },
        { id: 'review', title: 'Review & Generate', description: 'Preview your RSL certificate' },
        { id: 'complete', title: 'Complete', description: 'Download your license' }
    ];

    const handleFileSelect = (file: RSLFile) => {
        setRslFile(file);
        setError('');
        setCurrentStep('configure');
    };

    const handleNext = () => {
        if (currentStep === 'configure') {
            setCurrentStep('review');
        } else if (currentStep === 'review') {
            handleGenerate();
        }
    };

    const handleBack = () => {
        if (currentStep === 'configure') {
            setCurrentStep('upload');
        } else if (currentStep === 'review') {
            setCurrentStep('configure');
        }
    };

    const handleGenerate = async () => {
        if (!rslFile) return;

        setIsLoading(true);
        setError('');
        try {
            const previewText = generateRSLPreview(rslFile, licenseOptions);
            setRslText(previewText);
            
            const embeddedFile = await generateRSL(rslFile, licenseOptions);
            setEmbeddedFile(embeddedFile);
            
            setCurrentStep('complete');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOver = () => {
        setCurrentStep('upload');
        setRslFile(null);
        setLicenseOptions(initialLicenseOptions);
        setRslText('');
        setEmbeddedFile(null);
        setIsLoading(false);
        setError('');
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'upload':
                return <UploadStep onFileSelect={handleFileSelect} />;
            case 'configure':
        return (
                <ConfigureStep
                        rslFile={rslFile!}
                    licenseOptions={licenseOptions}
                    setLicenseOptions={setLicenseOptions}
                        onBack={handleBack}
                        onNext={handleNext}
                        isLoading={isLoading}
                    />
                );
            case 'review':
                return (
                    <ReviewStep
                        rslFile={rslFile!}
                        licenseOptions={licenseOptions}
                    onBack={handleBack}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                />
                );
            case 'complete':
                return (
                    <CompleteStep
                        rslFile={rslFile!}
                        rslText={rslText}
                        embeddedFile={embeddedFile!}
                        onStartOver={handleStartOver}
                    />
                );
            default:
                return <UploadStep onFileSelect={handleFileSelect} />;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const stepIndex = steps.findIndex(s => s.id === currentStep);
                        const isActive = step.id === currentStep;
                        const isCompleted = index < stepIndex;
                        
                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                            isActive
                                                ? 'text-white'
                                                : isCompleted
                                                ? 'text-white'
                                                : 'text-gray-400'
                                        }`}
                                        style={{
                                            backgroundColor: isActive || isCompleted ? '#6B7280' : '#E5E7EB'
                                        }}
                                    >
                                        {isCompleted ? '✓' : index + 1}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <div className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {step.title}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {step.description}
                                        </div>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className="flex-1 h-0.5 mx-4"
                                        style={{
                                            backgroundColor: index < stepIndex ? '#6B7280' : '#E5E7EB'
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
                {renderStepContent()}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
            </div>
            </div>
        );
};

const UploadStep: React.FC<{ onFileSelect: (file: RSLFile) => void }> = ({ onFileSelect }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFile = (file: File | null | undefined) => {
        setError('');
        if (!file) return;
        
        if (file.size > 20 * 1024 * 1024) {
            setError('File is too large. Please select a file under 20MB.');
            return;
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
        onFileSelect({ file, previewUrl });
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374151' }}>
                Upload Your Digital Artwork
            </h2>
            <p className="text-gray-600 mb-8">
                Select the content you want to protect with an RSL license. This will define how AI systems and search engines can use your work.
            </p>
            
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                role="button"
                tabIndex={0}
                className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                }`}
            >
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleChange} 
            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!licenseOptions.provenanceInfo.trim()}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next: Review
                </button>
            </div>
        </div>
    );
};

const ReviewStep: React.FC<{
    rslFile: RSLFile;
    licenseOptions: LicenseOptions;
    onBack: () => void;
    onGenerate: () => void;
    isLoading: boolean;
}> = ({ rslFile, licenseOptions, onBack, onGenerate, isLoading }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374151' }}>
                Review Your License
            </h2>
            <p className="text-gray-600 mb-8">
                Review your license configuration before generating the RSL certificate.
            </p>

            <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Content</h3>
                    <p className="text-sm text-gray-600">{rslFile.file.name} ({(rslFile.file.size / 1024).toFixed(2)} KB)</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">License Terms</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Provenance:</strong> {licenseOptions.provenanceInfo}</p>
                        <p><strong>AI Training:</strong> {licenseOptions.allowAIModels ? 'Allowed' : 'Denied'}</p>
                        <p><strong>Search Indexing:</strong> {licenseOptions.allowIndexing ? 'Allowed' : 'Denied'}</p>
                        <p><strong>Payment Model:</strong> {licenseOptions.paymentModel}</p>
                        {licenseOptions.paymentAmount && (
                            <p><strong>Amount:</strong> {licenseOptions.paymentAmount} {licenseOptions.paymentCurrency}</p>
                        )}
                    </div>
                </div>
            </div>

