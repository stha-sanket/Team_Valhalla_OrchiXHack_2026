const iconProps = {
  className: 'w-5 h-5',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
};

export const HomeIcon = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9-9v9m0 0h6m-6 0v9a1 1 0 001 1h4a1 1 0 001-1v-9m-6 0h6" />
  </svg>
);

export const CompassIcon = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
  </svg>
);

export const UserIcon = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const LogoutIcon = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 5v1a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h5a2 2 0 012 2v1" />
  </svg>
);

export const MapPinIcon = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
