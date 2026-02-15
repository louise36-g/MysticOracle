import React from 'react';

interface AuthorAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const AUTHOR_IMAGE = 'https://res.cloudinary.com/dvt3q1p1c/image/upload/Me_Profile_CelestiArcana_copie_y2ar4f.jpg';
const AUTHOR_NAME = 'Louise Griffin';

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export const AuthorAvatar: React.FC<AuthorAvatarProps> = ({
  size = 'md',
  showName = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={AUTHOR_IMAGE}
        alt={AUTHOR_NAME}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-purple-400/30 shadow-lg shadow-purple-500/10`}
      />
      {showName && (
        <span className={`${textSizeClasses[size]} text-slate-300 font-medium`}>
          {AUTHOR_NAME}
        </span>
      )}
    </div>
  );
};

export default AuthorAvatar;
