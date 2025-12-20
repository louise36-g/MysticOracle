import React from 'react';

const FlagFR: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 3 2"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="1" height="2" fill="#002654" />
    <rect x="1" width="1" height="2" fill="#FFFFFF" />
    <rect x="2" width="1" height="2" fill="#ED2939" />
  </svg>
);

export default FlagFR;
