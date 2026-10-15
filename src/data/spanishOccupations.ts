export interface CnoOccupation {
  cno: string;
  title: string;
  defaultCategory: string;
  suggestedCotizacionGroup: string;
  suggestedAccidentsEpigrafe: string;
  keywords: string[];
}

export interface CotizacionGroup {
  group: string;
  description: string;
}

export interface AccidentsEpigrafe {
  code: string;
  description: string;
  itRate: string; // Incapacidad Temporal
  imsRate: string; // Invalidez, Muerte y Supervivencia
}

export const SPANISH_COTIZACION_GROUPS: CotizacionGroup[] = [
  { group: 'Grupo 1', description: 'Ingenieros y Licenciados. Personal de alta dirección' },
  { group: 'Grupo 2', description: 'Ingenieros Técnicos, Peritos y Ayudantes Titulados' },
  { group: 'Grupo 3', description: 'Jefes Administrativos y de Taller' },
  { group: 'Grupo 4', description: 'Ayudantes no Titulados' },
  { group: 'Grupo 5', description: 'Oficiales Administrativos' },
  { group: 'Grupo 6', description: 'Subalternos' },
  { group: 'Grupo 7', description: 'Auxiliares Administrativos' },
  { group: 'Grupo 8', description: 'Oficiales de primera y de segunda' },
  { group: 'Grupo 9', description: 'Oficiales de tercera y Especialistas' },
  { group: 'Grupo 10', description: 'Peones' },
  { group: 'Grupo 11', description: 'Trabajadores menores de dieciocho años' },
];

export const SPANISH_ACCIDENTS_EPIGRAFES: AccidentsEpigrafe[] = [
  {
    code: '45.20',
    description: 'Mantenimiento y reparación de vehículos de motor (Chapa, Pintura, Mecánica, Electricidad)',
    itRate: '1,70%',
    imsRate: '1,60%',
  },
  {
    code: '45.32',
    description: 'Comercio al por menor de repuestos y accesorios de vehículos de motor',
    itRate: '1,25%',
    imsRate: '1,00%',
  },
  {
    code: 'a',
    description: 'Personal en trabajos exclusivos de oficina (Administración y Facturación)',
    itRate: '0,65%',
    imsRate: '0,35%',
  },
  {
    code: 'b',
    description: 'Personal de ventas y comerciales en ruta',
    itRate: '1,70%',
    imsRate: '1,45%',
  },
  {
    code: '52.29',
    description: 'Otras actividades anexas al transporte / Grúas de asistencia y rescate',
    itRate: '2,10%',
    imsRate: '1,60%',
  },
];

export const SPANISH_CNO_CATALOG: CnoOccupation[] = [
  {
    cno: '7313',
    title: 'Chapistas y caldereros',
    defaultCategory: 'Chapista de automoción (Carrocería y Bancada)',
    suggestedCotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['chapa', 'chapista', 'carroceria', 'carrocería', 'bancada', 'desabollado', 'soldadura', 'aluminio', 'golpe', 'siniestro'],
  },
  {
    cno: '7232',
    title: 'Pintores en las industrias manufactureras y de vehículos',
    defaultCategory: 'Pintor de vehículos (Preparación y Cabina)',
    suggestedCotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['pintor', 'pintura', 'barniz', 'aparejo', 'masilla', 'cabina', 'colorimetria', 'colorimetría', 'pulido', 'decapado'],
  },
  {
    cno: '7401',
    title: 'Mecánicos y ajustadores de vehículos de motor',
    defaultCategory: 'Mecánico de taller de automoción',
    suggestedCotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['mecanico', 'mecánico', 'motor', 'frenos', 'suspension', 'embrague', 'caja de cambios', 'mantenimiento'],
  },
  {
    cno: '7521',
    title: 'Electricistas y electrónicos de automoción',
    defaultCategory: 'Técnico electromecánico / diagnosis',
    suggestedCotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['electricista', 'electronica', 'electrónica', 'diagnosis', 'obd', 'sensores', 'bateria', 'hibrido', 'electrico'],
  },
  {
    cno: '3121',
    title: 'Técnicos en automoción y jefes de taller mecánico y carrocería',
    defaultCategory: 'Jefe de taller / Encargado de producción',
    suggestedCotizacionGroup: 'Grupo 3: Jefes Administrativos y de Taller',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['jefe', 'jefe de taller', 'encargado', 'supervisor', 'coordinador', 'tecnico', 'técnico'],
  },
  {
    cno: '4111',
    title: 'Empleados de contabilidad, finanzas y recepción de taller',
    defaultCategory: 'Administrativo / Recepcionista de taller',
    suggestedCotizacionGroup: 'Grupo 5: Oficiales Administrativos',
    suggestedAccidentsEpigrafe: 'a (Oficina)',
    keywords: ['recepcion', 'recepción', 'atencion', 'atención', 'cliente', 'factura', 'caja', 'citas', 'ordenes'],
  },
  {
    cno: '5120',
    title: 'Mozos de almacén de recambios y logística de automoción',
    defaultCategory: 'Recambista / Encargado de almacén',
    suggestedCotizacionGroup: 'Grupo 9: Oficiales de tercera y Especialistas',
    suggestedAccidentsEpigrafe: '45.32 (Repuestos de vehículos)',
    keywords: ['recambios', 'almacen', 'almacén', 'piezas', 'repuestos', 'proveedores', 'pedidos'],
  },
  {
    cno: '9310',
    title: 'Lavadores y pulidores de vehículos',
    defaultCategory: 'Preparador de vehículos y detailing',
    suggestedCotizacionGroup: 'Grupo 9: Oficiales de tercera y Especialistas',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['lavador', 'limpieza', 'pulidor', 'detailing', 'entrega', 'preparacion'],
  },
  {
    cno: '2431',
    title: 'Peritos tasadores de seguros de automóviles e ingenieros técnicos',
    defaultCategory: 'Perito tasador / Asesor de siniestros',
    suggestedCotizacionGroup: 'Grupo 2: Ingenieros Técnicos y Peritos',
    suggestedAccidentsEpigrafe: 'a (Oficina)',
    keywords: ['perito', 'tasador', 'audatex', 'gt estimate', 'seguros', 'valoracion', 'valoración'],
  },
  {
    cno: '7112',
    title: 'Soldadores y oxicortadores de estructuras metálicas',
    defaultCategory: 'Soldador especializado en carrocería',
    suggestedCotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
    suggestedAccidentsEpigrafe: '45.20 (Reparación de vehículos)',
    keywords: ['soldador', 'soldadura', 'mig', 'mag', 'tig', 'oxiacetileno', 'caldereria'],
  },
  {
    cno: '8412',
    title: 'Conductores operadores de grúa de auxilio en carretera',
    defaultCategory: 'Conductor de grúa de asistencia',
    suggestedCotizacionGroup: 'Grupo 8: Oficiales de primera y de segunda',
    suggestedAccidentsEpigrafe: '52.29 (Grúas de transporte)',
    keywords: ['grua', 'grúa', 'remolque', 'asistencia', 'carretera', 'conductor'],
  },
];

export const searchOccupations = (query: string): CnoOccupation[] => {
  if (!query || !query.trim()) return SPANISH_CNO_CATALOG;
  const q = query.toLowerCase().trim();
  return SPANISH_CNO_CATALOG.filter((item) => {
    return (
      item.cno.includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.defaultCategory.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
    );
  });
};
