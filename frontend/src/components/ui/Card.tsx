import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export default function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-navy-800 rounded-lg',
    bordered: 'bg-navy-800 rounded-lg border border-gray-200',
    elevated: 'bg-navy-800 rounded-lg shadow-md',
  };

  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
