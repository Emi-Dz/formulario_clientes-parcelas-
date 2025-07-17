import React from 'react';

export const Logo: React.FC = () => (
    <div className="w-full max-w-xs mx-auto mb-4">
        <svg viewBox="0 0 500 250" className="w-full h-auto" aria-labelledby="logo-title">
            <title id="logo-title">Electro Parcelas Logo</title>
            {/* Blue background rectangle */}
            <rect width="500" height="250" fill="#0038a8" />
            
            {/* Yellow oval outline */}
            <ellipse cx="250" cy="125" rx="235" ry="110" fill="none" stroke="#fcee21" strokeWidth="8" />

            {/* Text block */}
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontFamily="Arial, 'Helvetica Neue', Helvetica, sans-serif"
                fontWeight="900"
                fontSize="85"
                fill="#fcee21"
                style={{ letterSpacing: '-3px', textTransform: 'capitalize' }}
            >
                <tspan x="50%" dy="-0.6em">Electro</tspan>
                <tspan x="50%" dy="1.2em">Parcelas</tspan>
            </text>
        </svg>
    </div>
);
