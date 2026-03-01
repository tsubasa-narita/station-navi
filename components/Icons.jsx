import React from 'react';

export const ElevatorIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M12 6v12" />
        <path d="m9 9 3-3 3 3" />
        <path d="m9 15 3 3 3-3" />
    </svg>
);

export const EscalatorIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 20h4l5-5h7" />
        <path d="M15 15l-5 5" />
        <path d="M10 10l5-5h5" />
    </svg>
);

export const StairsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 21h4v-4h4v-4h4v-4h4V5" />
    </svg>
);
