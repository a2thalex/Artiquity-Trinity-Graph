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
                    accept="image/*,video/*,audio/*,.pdf,.txt"
                />
                <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E7EB' }}>
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>

                {isDragActive ? (
                    <p className="text-gray-600 font-medium">Drop the file here...</p>
                ) : (
                    <div>
                        <p className="text-gray-600 font-medium mb-2">
                            <span className="text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                            Any image, video, audio, PDF, or text file (Max 20MB)
                        </p>
                    </div>
                )}
            </div>
            {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        </div>
    );
};

const ConfigureStep: React.FC<{
    rslFile: RSLFile;
    licenseOptions: LicenseOptions;
    setLicenseOptions: React.Dispatch<React.SetStateAction<LicenseOptions>>;
    onBack: () => void;
    onNext: () => void;
    isLoading: boolean;
}> = ({ rslFile, licenseOptions, setLicenseOptions, onBack, onNext, isLoading }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374151' }}>
                Configure Your License
            </h2>
            <p className="text-gray-600 mb-8">
                Define the usage rights and payment terms for your artwork. These settings will be embedded in your RSL certificate.
            </p>
            
            <div className="space-y-8">
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Selected File</h3>
                    <div className="flex items-center space-x-3">
                        {rslFile.file.type.startsWith('image/') ? (
                            <img src={rslFile.previewUrl} alt="Preview" className="w-12 h-12 rounded-md object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-900">{rslFile.file.name}</p>
                            <p className="text-xs text-gray-500">{(rslFile.file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provenance Information *
                        </label>
                        <textarea
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="e.g., Created by [Artist Name] on [Date]. This work is an original digital painting."
                            value={licenseOptions.provenanceInfo}
                            onChange={(e) => setLicenseOptions(prev => ({ ...prev, provenanceInfo: e.target.value }))}
                        />
                        <p className="mt-1 text-xs text-gray-500">Provide a brief history or context for your artwork.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">AI Model Training</h4>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="allowAIModels"
                                        value="true"
                                        checked={licenseOptions.allowAIModels === true}
                                        onChange={(e) => setLicenseOptions(prev => ({ ...prev, allowAIModels: e.target.value === 'true' }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Allow</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="allowAIModels"
                                        value="false"
                                        checked={licenseOptions.allowAIModels === false}
                                        onChange={(e) => setLicenseOptions(prev => ({ ...prev, allowAIModels: e.target.value === 'true' }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Deny</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Search Engine Indexing</h4>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="allowIndexing"
                                        value="true"
                                        checked={licenseOptions.allowIndexing === true}
                                        onChange={(e) => setLicenseOptions(prev => ({ ...prev, allowIndexing: e.target.value === 'true' }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Allow</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="allowIndexing"
                                        value="false"
                                        checked={licenseOptions.allowIndexing === false}
                                        onChange={(e) => setLicenseOptions(prev => ({ ...prev, allowIndexing: e.target.value === 'true' }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Deny</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Model</h4>
                        <div className="space-y-3">
                            {[
                                { value: 'free', label: 'Free Use', description: 'No payment required' },
                                { value: 'attribution', label: 'Attribution Required', description: 'Free use with attribution' },
                                { value: 'per-crawl', label: 'Pay Per Crawl', description: 'Charge per access' },
                                { value: 'per-inference', label: 'Pay Per Inference', description: 'Charge per AI use' },
                                { value: 'subscription', label: 'Subscription', description: 'Recurring payment' }
                            ].map((option) => (
                                <label key={option.value} className="flex items-start">
                                    <input
                                        type="radio"
                                        name="paymentModel"
                                        value={option.value}
                                        checked={licenseOptions.paymentModel === option.value}
                                        onChange={(e) => setLicenseOptions(prev => ({ ...prev, paymentModel: e.target.value as any }))}
                                        className="mt-1 mr-3"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-700">{option.label}</div>
                                        <div className="text-xs text-gray-500">{option.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

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
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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


            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Back
                </button>
                <button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Generate RSL Certificate'}
                </button>
            </div>
        </div>
    );
};

const CompleteStep: React.FC<{
    rslFile: RSLFile;
    rslText: string;
    embeddedFile: File;
    onStartOver: () => void;
}> = ({ rslFile, rslText, embeddedFile, onStartOver }) => {
    const downloadEmbeddedFile = () => {
        const element = document.createElement("a");
        element.href = URL.createObjectURL(embeddedFile);
        element.download = embeddedFile.name;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374151' }}>
                Your Artwork is Secured
            </h2>
            <p className="text-gray-600 mb-8">
                RSL metadata has been embedded into your file. The file looks identical to the original but now contains invisible licensing information that AI systems and crawlers can read.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Embedded Metadata Preview</h3>
                <div className="text-left text-sm text-gray-600 bg-white rounded border p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{rslText.substring(0, 500)}...</pre>
                </div>
            </div>

            <div className="flex justify-center space-x-4">
                <button
                    onClick={onStartOver}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Protect Another File
                </button>
                <button
                    onClick={downloadEmbeddedFile}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Download Protected File
                </button>
            </div>
        </div>
    );
};
