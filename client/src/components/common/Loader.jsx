// src/components/common/Loader.jsx
import React, { memo } from 'react';

// CSS-in-JS approach for dynamic colors to avoid inline styles
const getSpinnerStyle = (color) => {
  const colorMap = {
    primary: '#2563eb',
    white: '#ffffff',
    gray: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };
  return { borderTopColor: colorMap[color] || colorMap.primary };
};

const Loader = memo(({ 
  size = 'md', 
  color = 'primary', 
  text = '', 
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4 border-[1px]',
    sm: 'w-6 h-6 border-[2px]',
    md: 'w-8 h-8 border-[2px]',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-[3px]'
  };

  const textSizeClasses = {
    xs: 'text-xs mt-1',
    sm: 'text-sm mt-2',
    md: 'text-base mt-3',
    lg: 'text-lg mt-3',
    xl: 'text-xl mt-4'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-gray-200 dark:border-gray-700 rounded-full animate-spin`}
        style={getSpinnerStyle(color)}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium text-center max-w-xs`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50"
        role="dialog"
        aria-label="Loading overlay"
      >
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div 
        className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-40"
        role="status"
        aria-label="Loading overlay"
      >
        {spinner}
      </div>
    );
  }

  return spinner;
});

Loader.displayName = 'Loader';

// Memoized skeleton loader with proper prop validation
export const SkeletonLoader = memo(({ 
  lines = 3, 
  className = '',
  animated = true,
  width = 'full'
}) => {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3'
  };

  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: Math.max(1, Math.min(10, lines)) }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
            index === lines - 1 ? widthClasses['3/4'] : widthClasses[width]
          } ${animated ? 'animate-pulse' : ''}`}
        />
      ))}
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

// Enhanced card skeleton with better structure
export const CardSkeleton = memo(({ 
  className = '', 
  showAvatar = true,
  showActions = true,
  lines = 3
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse ${className}`}
      role="status"
      aria-label="Loading card"
    >
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${
              index === lines - 1 ? 'w-4/6' : 'w-full'
            }`} 
          />
        ))}
      </div>
      
      {showActions && (
        <div className="mt-6 flex justify-between items-center">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      )}
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';

// Optimized list skeleton
export const ListSkeleton = memo(({ 
  items = 5, 
  className = '',
  cardProps = {} 
}) => {
  const validItemCount = Math.max(1, Math.min(20, items)); // Limit between 1-20
  
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading list">
      {Array.from({ length: validItemCount }).map((_, index) => (
        <CardSkeleton key={index} {...cardProps} />
      ))}
    </div>
  );
});

ListSkeleton.displayName = 'ListSkeleton';

// Enhanced button loader with better accessibility
export const ButtonLoader = memo(({ 
  size = 'md', 
  className = '',
  srText = 'Loading'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[1px]',
    md: 'w-5 h-5 border-[2px]',
    lg: 'w-6 h-6 border-[2px]'
  };

  return (
    <>
      <div
        className={`${sizeClasses[size]} border-current border-r-transparent rounded-full animate-spin ${className}`}
        role="status"
        aria-hidden="true"
      />
      <span className="sr-only">{srText}</span>
    </>
  );
});

ButtonLoader.displayName = 'ButtonLoader';

// Improved dots loader with staggered animation
export const DotsLoader = memo(({ 
  size = 'md', 
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  return (
    <div 
      className={`flex space-x-1 items-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{ 
            animationDelay: `${index * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
});

DotsLoader.displayName = 'DotsLoader';

// Enhanced progress loader with better UX
export const ProgressLoader = memo(({ 
  progress = 0, 
  className = '',
  showPercentage = false,
  label = ''
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(normalizedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
});

ProgressLoader.displayName = 'ProgressLoader';

// Improved chart skeleton with consistent heights
export const ChartSkeleton = memo(({ 
  bars = 5, 
  className = '',
  height = 'variable' // 'variable' | 'equal'
}) => {
  const barCount = Math.max(1, Math.min(15, bars)); // Limit between 1-15
  
  return (
    <div 
      className={`flex items-end space-x-2 h-32 ${className}`}
      role="status" 
      aria-label="Loading chart"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const barHeight = height === 'equal' 
          ? 'h-16' 
          : `h-${Math.floor(Math.random() * 20) + 8}`; // Random height between h-8 to h-28
        
        return (
          <div
            key={i}
            className={`bg-gray-200 dark:bg-gray-700 rounded-t flex-1 animate-pulse ${barHeight}`}
            style={{ 
              animationDelay: `${i * 0.1}s`,
              minHeight: '2rem'
            }}
          />
        );
      })}
    </div>
  );
});

ChartSkeleton.displayName = 'ChartSkeleton';

// New: Table skeleton loader
export const TableSkeleton = memo(({ 
  rows = 5, 
  columns = 4, 
  className = ''
}) => {
  const validRows = Math.max(1, Math.min(20, rows));
  const validColumns = Math.max(1, Math.min(10, columns));
  
  return (
    <div className={`w-full ${className}`} role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex space-x-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        {Array.from({ length: validColumns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1 animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: validRows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 p-4">
            {Array.from({ length: validColumns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"
                style={{ animationDelay: `${(rowIndex * validColumns + colIndex) * 0.05}s` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

export default Loader;