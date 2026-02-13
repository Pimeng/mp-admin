import type { ReactNode } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className = '', delay = 0 }: AnimatedContainerProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function SlideIn({ children, className = '', delay = 0 }: AnimatedContainerProps) {
  return (
    <div
      className={`animate-slide-in ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function ScaleIn({ children, className = '', delay = 0 }: AnimatedContainerProps) {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className = '' }: StaggerContainerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

interface TabContentProps {
  children: ReactNode;
  className?: string;
  isActive: boolean;
}

export function AnimatedTabContent({ children, className = '', isActive }: TabContentProps) {
  if (!isActive) return null;
  return (
    <div className={`animate-slide-in ${className}`}>
      {children}
    </div>
  );
}
