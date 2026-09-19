import { HighContrastThemeId } from '../types';

export interface HighContrastTheme {
  id: HighContrastThemeId;
  name: string;
  badge: string;
  level: string; // e.g. "Nivel 1 (Blanco) a Nivel 8 (Negro)"
  category: 'Claro' | 'Medio' | 'Oscuro' | 'Ultra Oscuro';
  bgHex: string;
  surfaceHex: string;
  borderHex: string;
  textPrimaryHex: string;
  textSecondaryHex: string;
  accentHex: string;
  contrastRatio: string;
  description: string;
  borderWidth: string;
}

export const HIGH_CONTRAST_THEMES: HighContrastTheme[] = [
  {
    id: 'blanco-puro',
    name: 'Blanco Puro Absoluto',
    badge: 'Contraste 21:1',
    level: 'Nivel 1 • Blanco Total',
    category: 'Claro',
    bgHex: '#FFFFFF',
    surfaceHex: '#F8FAFC',
    borderHex: '#000000',
    textPrimaryHex: '#000000',
    textSecondaryHex: '#1E293B',
    accentHex: '#0F172A',
    contrastRatio: '21:1 (Máximo WCAG AAA)',
    description: 'Fondo blanco níveo con tipografía negra sólida y bordes negros de alta definición para máxima nitidez bajo luz solar directa.',
    borderWidth: 'border-2 border-black',
  },
  {
    id: 'hueso-nordico',
    name: 'Hueso & Marfil Nórdico',
    badge: 'Contraste 18:1',
    level: 'Nivel 2 • Marfil Cálido',
    category: 'Claro',
    bgHex: '#F8F7F3',
    surfaceHex: '#FFFFFF',
    borderHex: '#334155',
    textPrimaryHex: '#0F172A',
    textSecondaryHex: '#475569',
    accentHex: '#0F2942',
    contrastRatio: '18:1 (WCAG AAA)',
    description: 'Tono marfil/hueso elegante anti-fatiga visual con tarjetas blancas resaltadas y contraste estricto en azul noche DM CAR.',
    borderWidth: 'border-2 border-[#334155]',
  },
  {
    id: 'plata-industrial',
    name: 'Plata Polar Industrial',
    badge: 'Contraste 15:1',
    level: 'Nivel 3 • Gris Plata Claro',
    category: 'Claro',
    bgHex: '#E2E8F0',
    surfaceHex: '#FFFFFF',
    borderHex: '#1E3A8A',
    textPrimaryHex: '#0F172A',
    textSecondaryHex: '#334155',
    accentHex: '#2563EB',
    contrastRatio: '15:1 (WCAG AAA)',
    description: 'Gris metálico claro de alta luminosidad con bordes azul cobalto y tarjetas blanco puro.',
    borderWidth: 'border-2 border-[#1E3A8A]',
  },
  {
    id: 'grafito-neutro',
    name: 'Grafito Técnico Neutro',
    badge: 'Contraste 13:1',
    level: 'Nivel 4 • Gris Medio',
    category: 'Medio',
    bgHex: '#94A3B8',
    surfaceHex: '#F8FAFC',
    borderHex: '#0F172A',
    textPrimaryHex: '#0F172A',
    textSecondaryHex: '#1E293B',
    accentHex: '#0F2942',
    contrastRatio: '13:1 (WCAG AAA)',
    description: 'Equilibrio técnico neutro con fondo grafito medio y superficies de alto contraste para puestos de inspección técnica.',
    borderWidth: 'border-2 border-[#0F172A]',
  },
  {
    id: 'titanio-ahumado',
    name: 'Titanio Ahumado & Asfalto',
    badge: 'Contraste 14:1',
    level: 'Nivel 5 • Asfalto Semioscuro',
    category: 'Oscuro',
    bgHex: '#475569',
    surfaceHex: '#1E293B',
    borderHex: '#E2E8F0',
    textPrimaryHex: '#FFFFFF',
    textSecondaryHex: '#E2E8F0',
    accentHex: '#38BDF8',
    contrastRatio: '14:1 (WCAG AAA)',
    description: 'Transición a tonos oscuros de titanio con tipografía blanca brillante y perfilado claro.',
    borderWidth: 'border-2 border-[#E2E8F0]',
  },
  {
    id: 'antracita-taller',
    name: 'Antracita Taller Pro',
    badge: 'Contraste 17:1',
    level: 'Nivel 6 • Carbón Taller',
    category: 'Oscuro',
    bgHex: '#1E293B',
    surfaceHex: '#0F172A',
    borderHex: '#94A3B8',
    textPrimaryHex: '#FFFFFF',
    textSecondaryHex: '#CBD5E1',
    accentHex: '#38BDF8',
    contrastRatio: '17:1 (WCAG AAA)',
    description: 'Estética automotriz en carbón oscuro, ideal para entornos de taller con acentos celestes de alta visibilidad.',
    borderWidth: 'border-2 border-[#94A3B8]',
  },
  {
    id: 'noche-neon',
    name: 'Noche Bicolor Neón',
    badge: 'Contraste 19:1',
    level: 'Nivel 7 • Noche Profunda',
    category: 'Oscuro',
    bgHex: '#0F172A',
    surfaceHex: '#020617',
    borderHex: '#00E5FF',
    textPrimaryHex: '#FFFFFF',
    textSecondaryHex: '#A5F3FC',
    accentHex: '#00FFCC',
    contrastRatio: '19:1 (WCAG AAA)',
    description: 'Base oscura azul noche profunda con ribetes cian neón y verde esmeralda de alto impacto óptico.',
    borderWidth: 'border-2 border-[#00E5FF]',
  },
  {
    id: 'negro-obsidiana',
    name: 'Negro Obsidiana OLED',
    badge: 'Contraste 21:1',
    level: 'Nivel 8 • Negro Total',
    category: 'Ultra Oscuro',
    bgHex: '#000000',
    surfaceHex: '#0A0A0A',
    borderHex: '#FFFFFF',
    textPrimaryHex: '#FFFFFF',
    textSecondaryHex: '#E2E8F0',
    accentHex: '#FFFFFF',
    contrastRatio: '21:1 (Máximo WCAG AAA)',
    description: 'Negro verdadero #000000 optimizado para pantallas OLED. Bordes y texto blanco puro sin degradados para cero reflejos.',
    borderWidth: 'border-2 border-white',
  },
];

export function getThemeById(themeId?: HighContrastThemeId): HighContrastTheme {
  const found = HIGH_CONTRAST_THEMES.find((t) => t.id === themeId);
  return found || HIGH_CONTRAST_THEMES[1]; // Por defecto Hueso & Marfil Nórdico (tema de DM CAR)
}
