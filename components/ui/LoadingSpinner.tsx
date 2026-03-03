interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function LoadingSpinner({ size = 'md', color = 'border-purple-500' }: LoadingSpinnerProps) {
  return (
    <div className={`${sizeClasses[size]} border-2 ${color} border-t-transparent rounded-full animate-spin`} />
  );
}
