import React from 'react';

export default function Logo({ size = 32, className = "" }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className="bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        V
      </div>
    </div>
  );
}

export { Logo };