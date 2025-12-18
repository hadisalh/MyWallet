import React from 'react';

export const BrandWalletIcon: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* الأوراق النقدية الخضراء */}
      <rect x="100" y="60" width="280" height="160" rx="15" fill="#15803d" transform="rotate(-10 100 60)" />
      <rect x="140" y="40" width="280" height="160" rx="15" fill="#22c55e" transform="rotate(-5 140 40)" />
      
      {/* العملات الذهبية */}
      <circle cx="400" cy="140" r="35" fill="#f59e0b" stroke="#d97706" strokeWidth="4" />
      <circle cx="430" cy="100" r="30" fill="#fbbf24" stroke="#d97706" strokeWidth="4" />

      {/* المحفظة البنية */}
      <rect x="40" y="160" width="432" height="312" rx="40" fill="#78350f" />
      <rect x="40" y="160" width="432" height="120" rx="40" fill="#92400e" opacity="0.5" />
      
      {/* لسان المحفظة */}
      <rect x="360" y="240" width="130" height="140" rx="20" fill="#451a03" />
      <circle cx="450" cy="310" r="12" fill="#d97706" />
      
      {/* تفاصيل الظل والعمق */}
      <path d="M40 200C40 177.909 57.9086 160 80 160H432C454.091 160 472 177.909 472 200V220H40V200Z" fill="#92400e" />
    </svg>
  );
};