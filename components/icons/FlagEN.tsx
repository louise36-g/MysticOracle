import React from 'react';

const FlagEN: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 60 30"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <clipPath id="a">
      <path d="M0 0h60v30H0z" />
    </clipPath>
    <clipPath id="b">
      <path d="M30 15h30v15H30V15ZM0 0h30v15H0V0ZM30 0h30v15H30V0ZM0 15h30v15H0V15Z" />
    </clipPath>
    <g clipPath="url(#a)">
      <path d="M0 0v30h60V0H0Z" fill="#00247D" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#FFF" strokeWidth="6" />
      <path d="M0 0 60 30M60 0 0 30" clipPath="url(#b)" stroke="#C60C30" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#FFF" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C60C30" strokeWidth="6" />
    </g>
  </svg>
);

export default FlagEN;
