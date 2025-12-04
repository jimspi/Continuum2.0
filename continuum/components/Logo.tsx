import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="12" className="fill-gray-900" />
    <circle cx="20" cy="20" r="10" className="stroke-white/30" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="5" className="fill-white" />
  </svg>
);