export interface OfficialMaintenanceItem {
  id: string;
  component: string;
  intervalKm: number;
  intervalMonths: number;
  description: string;
  estimatedCost?: number;
}

export interface OfficialVehiclePlan {
  id: string;
  brandModel: string;
  category: string;
  fuelType: string;
  items: OfficialMaintenanceItem[];
}

export const OFFICIAL_MAINTENANCE_PLANS: OfficialVehiclePlan[] = [
  {
    id: 'ford_transit_custom_20_ecoblue',
    brandModel: 'Ford Transit Custom 2.0 EcoBlue',
    category: 'Furgón Comercial Ligero',
    fuelType: 'Diésel',
    items: [
      {
        id: 'ft_oil_filter',
        component: 'Aceite Motor y Filtro de Aceite',
        intervalKm: 40000,
        intervalMonths: 24,
        description: 'Sustitución de lubricante Castrol Magnatec 0W-30 D y cartucho filtrante.',
        estimatedCost: 145,
      },
      {
        id: 'ft_air_fuel',
        component: 'Filtro de Aire y Filtro de Combustible',
        intervalKm: 60000,
        intervalMonths: 24,
        description: 'Purgado y cambio de filtro de gasóleo con sensor de agua y filtro de admisión.',
        estimatedCost: 110,
      },
      {
        id: 'ft_brake_pads',
        component: 'Pastillas y Discos de Freno Delanteros',
        intervalKm: 80000,
        intervalMonths: 36,
        description: 'Inspección de desgaste y sustitución de pastillas de freno en eje delantero.',
        estimatedCost: 195,
      },
      {
        id: 'ft_timing_belt',
        component: 'Correa de Distribución en Baño de Aceite',
        intervalKm: 160000,
        intervalMonths: 72,
        description: 'Cambio de kit de correa húmeda, tensor, bomba de agua y anticongelante orgánico.',
        estimatedCost: 650,
      },
    ],
  },
  {
    id: 'mercedes_sprinter_314_cdi',
    brandModel: 'Mercedes-Benz Sprinter 314 CDI',
    category: 'Furgón Gran Volumen / Chasis',
    fuelType: 'Diésel',
    items: [
      {
        id: 'mb_assyst_a',
        component: 'Mantenimiento A (Servicio Menor)',
        intervalKm: 30000,
        intervalMonths: 12,
        description: 'Aceite sintético MB 229.52, filtro y revisión de 30 puntos de seguridad.',
        estimatedCost: 180,
      },
      {
        id: 'mb_assyst_b',
        component: 'Mantenimiento B (Servicio Mayor)',
        intervalKm: 60000,
        intervalMonths: 24,
        description: 'Filtro combustible, filtro polen, líquido de frenos DOT 4 Plus y diagnosis Star.',
        estimatedCost: 290,
      },
      {
        id: 'mb_poly_v',
        component: 'Correa de Accesorios Poli-V y Tensores',
        intervalKm: 120000,
        intervalMonths: 60,
        description: 'Revisión y sustitución de correa de alternador, compresor y poleas locas.',
        estimatedCost: 160,
      },
      {
        id: 'mb_diff_fluid',
        component: 'Valvulina de Grupo Trasero y Transmisión',
        intervalKm: 150000,
        intervalMonths: 72,
        description: 'Sustitución de lubricante para diferencial y engrase de crucetas de cardán.',
        estimatedCost: 130,
      },
    ],
  },
  {
    id: 'renault_master_23_dci',
    brandModel: 'Renault Master 2.3 dCi',
    category: 'Furgón Comercial',
    fuelType: 'Diésel',
    items: [
      {
        id: 'rm_oil_service',
        component: 'Aceite RN0720 y Filtro de Aceite',
        intervalKm: 40000,
        intervalMonths: 24,
        description: 'Cambio de aceite 5W-30 Low SAPS y filtro metálico.',
        estimatedCost: 140,
      },
      {
        id: 'rm_filters_pack',
        component: 'Juego de Filtros (Aire, Polen y Gasóleo)',
        intervalKm: 40000,
        intervalMonths: 24,
        description: 'Sustitución completa de filtros de aspiración e inyección.',
        estimatedCost: 125,
      },
      {
        id: 'rm_coolant',
        component: 'Líquido Refrigerante Glaceol RX',
        intervalKm: 120000,
        intervalMonths: 48,
        description: 'Vaciado, limpieza del circuito y rellenado de líquido anticongelante tipo D.',
        estimatedCost: 85,
      },
    ],
  },
  {
    id: 'vag_20_tdi_golf_leon',
    brandModel: 'Volkswagen Golf / SEAT León 2.0 TDI',
    category: 'Turismo / Compacto',
    fuelType: 'Diésel',
    items: [
      {
        id: 'vag_oil_longlife',
        component: 'Servicio LongLife 507.00 0W-30',
        intervalKm: 30000,
        intervalMonths: 24,
        description: 'Cambio de aceite LongLife y filtro de aceite de cartucho.',
        estimatedCost: 135,
      },
      {
        id: 'vag_filters',
        component: 'Filtro de Aire, Polen y Combustible',
        intervalKm: 60000,
        intervalMonths: 24,
        description: 'Revisión y cambio de elementos filtrantes de admisión y gasoil.',
        estimatedCost: 115,
      },
      {
        id: 'vag_brake_fluid',
        component: 'Líquido de Frenos DOT 4',
        intervalKm: 60000,
        intervalMonths: 24,
        description: 'Purga por presión y renovación del líquido de frenos.',
        estimatedCost: 65,
      },
      {
        id: 'vag_timing',
        component: 'Kit de Distribución y Bomba de Agua',
        intervalKm: 210000,
        intervalMonths: 84,
        description: 'Sustitución completa de correa de distribución, rodillos guía y bomba de agua.',
        estimatedCost: 550,
      },
    ],
  },
];
