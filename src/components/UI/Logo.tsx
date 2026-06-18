import React, { forwardRef } from 'react';
import config from '@/config/config';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(({ className = '', style }, ref) => {
  const title = config.appName || 'PROJECT';
  const subtitle = config.company.buildingAddress || config.company.address || 'ADDRESS';

  return (
    <div ref={ref} style={style} className={`flex flex-col items-center justify-center select-none ${className}`}>
      <h1
        style={{
          fontFamily: "'Garet', sans-serif",
          fontWeight: 300,
          textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.6)',
          fontSize: '1em',
          lineHeight: 1,
          letterSpacing: '0.3em',
          marginLeft: '0.3em',
          color: 'var(--color-brand-primary)',
        }}
      >
        {title.toUpperCase()}
      </h1>
      <h2
        style={{
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 400,
          textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)',
          fontSize: '0.25em',
          letterSpacing: '0.6em',
          marginTop: '0.5em',
          marginLeft: '0.6em',
          color: '#f3f4f6',
        }}
      >
        {subtitle.toUpperCase()}
      </h2>
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
