interface EyeIconProps {
  className?: string;
}

export const EyeIcon = ({ className }: EyeIconProps) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4.5C7.305 4.5 3.27 7.59 1.5 12c1.77 4.41 5.805 7.5 10.5 7.5s8.73-3.09 10.5-7.5c-1.77-4.41-5.805-7.5-10.5-7.5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EyeOffIcon = ({ className }: EyeIconProps) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.695 0 8.73 3.09 10.5 7.5a13.16 13.16 0 0 1-1.67 2.68"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.61 6.61A13.526 13.526 0 0 0 1.5 12a10.94 10.94 0 0 0 5.63 5.63"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="2"
      y1="2"
      x2="22"
      y2="22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);