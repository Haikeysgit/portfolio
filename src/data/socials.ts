import { siGithub, siX } from 'simple-icons';

export interface Social {
  label: string;
  href: string;
  /** SVG path on a 24x24 viewBox, drawn with fill="currentColor". */
  path: string;
}

// Simple Icons dropped the LinkedIn logo, so its "in" mark is drawn here by hand.
const LINKEDIN =
  'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z';
const MAIL =
  'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-8 5-8-5V6l8 5 8-5v2.24z';

export const EMAIL = 'imisioluwa@obaseki.dev';

export const SOCIALS: Social[] = [
  { label: 'GitHub', href: 'https://github.com/Haikeysgit', path: siGithub.path },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/imisioluwa-obaseki-537298318/', path: LINKEDIN },
  { label: 'X', href: 'https://x.com/Haikeystweett', path: siX.path },
  { label: 'Email', href: `mailto:${EMAIL}`, path: MAIL },
];
