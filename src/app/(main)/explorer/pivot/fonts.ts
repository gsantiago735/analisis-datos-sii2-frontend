import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google';

// Display: títulos y eyebrows — carácter geométrico, usado con moderación
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

// Body/UI: el resto de la interfaz
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

// Data: números de la tabla dinámica — monoespaciada con tabular-nums,
// refuerza la identidad "hoja de cálculo" de la tabla dinámica
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});
