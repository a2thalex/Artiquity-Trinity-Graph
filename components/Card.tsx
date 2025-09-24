import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 text-stone-800 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
