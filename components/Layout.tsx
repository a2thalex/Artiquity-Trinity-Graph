
import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const InkwellLogo: React.FC = () => (
    <div className="flex items-center space-x-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
            <path d="M12 10.5C12.83 10.5 13.5 9.83 13.5 9C13.5 8.17 12.83 7.5 12 7.5C11.17 7.5 10.5 8.17 10.5 9C10.5 9.83 11.17 10.5 12 10.5ZM12 11.5C9.5 11.5 7.5 13.04 7.5 15.5C7.5 16.33 8.17 17 9 17H15C15.83 17 16.5 16.33 16.5 15.5C16.5 13.04 14.5 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
        <span className="font-semibold text-gray-500">Inkwell</span>
    </div>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-brand-bg-start to-brand-bg-end text-brand-text font-sans flex flex-col p-4 sm:p-6 lg:p-8">
            <main className="flex-grow flex items-center justify-center">
                {children}
            </main>
            <footer className="w-full text-xs text-gray-500 mt-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <span>Tuesday, August 20, 2024</span>
                    <InkwellLogo />
                    <span>Confidential</span>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
