"use client";

import React from 'react';
// Remove direct import of LucideIcon type to avoid conflicts

export interface IconWrapperProps extends React.ComponentPropsWithoutRef<'div'> {
  // Use a more generic type that doesn't rely on a specific LucideIcon implementation
  icon: React.ComponentType<{ size?: number; className?: string }>;
  size?: number;
}

/**
 * This component wraps Lucide icons to fix React 18 type compatibility issues
 * between different packages that might use different versions of lucide-react
 */
export const IconWrapper = ({
  icon: Icon,
  size = 24,
  className,
  ...props
}: IconWrapperProps) => {
  return (
    <div className={className} {...props}>
      <Icon size={size} />
    </div>
  );
};
