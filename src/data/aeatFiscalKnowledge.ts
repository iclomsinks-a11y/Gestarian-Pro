/**
 * BASE DE CONOCIMIENTOS FISCALES Y TRIBUTARIOS DE ESPAÑA (AEAT)
 * Para Metis AI en GESTARIAN PRO
 * 
 * Normativa incorporada:
 * - Agencia Estatal de Administración Tributaria (AEAT)
 * - Ley 37/1992 del Impuesto sobre el Valor Añadido (LIVA)
 * - Ley 35/2006 del Impuesto sobre la Renta de las Personas Físicas (LIRPF)
 * - Ley 27/2014 del Impuesto sobre Sociedades (LIS)
 * - Ley 58/2003 General Tributaria (LGT)
 * - Real Decreto 1619/2012 (Reglamento de Facturación)
 * - Ley 11/2021 de prevención del fraude fiscal y Reglamento Veri*factu (R.D. 1007/2023)
 * - Ley 18/2022 de Creación y Crecimiento de Empresas (Crea y Crece)
 * - Código de Comercio y Plan General de Contabilidad (PGC)
 */

export interface FiscalModelInfo {
  code: string;
  name: string;
  target: 'autonomos' | 'sociedades' | 'ambos';
  periodicity: 'trimestral' | 'mensual' | 'anual' | 'puntual';
  deadlines: string;
  description: string;
  keyPoints: string[];
  tipsForWorkshop: string;
}

export const AEAT_FISCAL_MODELS: FiscalModelInfo[] = [
  {
    code: 'Modelo 303',
    name: 'Autoliquidación del Impuesto sobre el Valor Añadido (IVA)',
    target: 'ambos',
    periodicity: 'trimestral',
    deadlines: '1T: 1-20 de abril | 2T: 1-20 de julio | 3T: 1-20 de octubre | 4T: 1-30 de enero del año siguiente',
    description: 'Declaración periódica donde se liquida el IVA repercutido (cobrado a clientes en facturas de reparaciones y ventas) menos el IVA soportado deducible (pagado a proveedores de recambios, pintura, herramientas, etc.).',
    keyPoints: [
      'Si el resultado es positivo (Repercutido > Soportado): Se debe ingresar la diferencia en Hacienda.',
      'Si el resultado es negativo (Soportado > Repercutido): Se puede compensar en los trimestres siguientes del mismo ejercicio. En el 4T se puede solicitar la devolución o seguir compensando.',
      'Tipos impositivos en España: General (21%), Reducido (10%), Superreducido (4%). En talleres la casi totalidad de servicios y recambios tributan al 21%.',
      'Exige conservar facturas completas con NIF/CIF emisor y receptor, desglose de bases y cuotas.'
    ],
    tipsForWorkshop: 'En el taller, guarda y registra de inmediato todas las facturas de proveedores de pintura, recambios, consumibles y suministros en la pestaña "Facturación Recibida" de GESTARIAN para maximizar la deducción de IVA en el trimestre.'
  },
  {
    code: 'Modelo 390',
    name: 'Declaración Resumen Anual del IVA',
    target: 'ambos',
    periodicity: 'anual',
    deadlines: 'Del 1 al 30 de enero del año siguiente',
    description: 'Declaración informativa anual que recopila y cuadra todas las operaciones realizadas a lo largo del año natural declaradas en los cuatro trimestres del Modelo 303.',
    keyPoints: [
      'Carácter meramente informativo, no genera pago ni devolución directa.',
      'Debe coincidir con exactitud milimétrica con la suma de los 4 trimestres del Modelo 303.',
      'Desglosa el volumen total de operaciones, bases imponibles por tipo impositivo, prorrata de IVA si existe y operaciones exentas o no sujetas.'
    ],
    tipsForWorkshop: 'GESTARIAN consolida automáticamente los 4 trimestres para que tu asesor o gestor pueda generar el fichero oficial BOE para la sede electrónica de la AEAT.'
  },
  {
    code: 'Modelo 130',
    name: 'Pago Fraccionado del IRPF (Estimación Directa)',
    target: 'autonomos',
    periodicity: 'trimestral',
    deadlines: '1T: 1-20 de abril | 2T: 1-20 de julio | 3T: 1-20 de octubre | 4T: 1-30 de enero del año siguiente',
    description: 'Pago a cuenta a la AEAT del 20% sobre el rendimiento neto acumulado (Ingresos acumulados - Gastos deducibles acumulados) desde el primer día del año hasta el trimestre liquidado.',
    keyPoints: [
      'Cálculo acumulativo: Rendimiento neto del periodo = Ingresos brutos anuales - Gastos deducibles anuales.',
      'Sobre dicho rendimiento se aplica el 20%, restando los pagos fraccionados ya ingresados en trimestres anteriores y las retenciones soportadas.',
      'Exención: Si al menos el 70% de tus ingresos del año anterior tuvieron retención de IRPF en factura (solo habitual en profesionales, no en talleres de venta a particulares), estarías exonerado de presentar el 130.'
    ],
    tipsForWorkshop: 'Para los autónomos de talleres en Estimación Directa Simplificada, este modelo es la base de anticipo de la Renta anual. Vigilar los gastos amortizables de maquinaria (elevadores, compresores, cabina).'
  },
  {
    code: 'Modelo 131',
    name: 'Pago Fraccionado del IRPF (Estimación Objetiva / Módulos)',
    target: 'autonomos',
    periodicity: 'trimestral',
    deadlines: '1T: 1-20 de abril | 2T: 1-20 de julio | 3T: 1-20 de octubre | 4T: 1-30 de enero',
    description: 'Pago fraccionado para autónomos en régimen de módulos en base a variables fijas (personal asalariado, potencia eléctrica contratada, superficie del local) en lugar de facturación real.',
    keyPoints: [
      'Cuota fija predeterminada independientemente de si facturas más o menos.',
      'Límites para permanecer en módulos: Facturación máxima de 150.000 € anuales (o 250.000 € si es exclusivo a particulares).'
    ],
    tipsForWorkshop: 'La mayoría de talleres con personal y compras elevadas de recambios optan por Estimación Directa para deducir todos los costes reales de material y mano de obra.'
  },
  {
    code: 'Modelo 100',
    name: 'Declaración del IRPF (Impuesto sobre la Renta / Renta Anual)',
    target: 'autonomos',
    periodicity: 'anual',
    deadlines: 'De abril a finales de junio de cada año',
    description: 'Liquidación definitiva anual del Impuesto sobre la Renta de las Personas Físicas para autónomos individuales, donde se integran todos los rendimientos económicos, del trabajo y patrimoniales con escala progresiva estatal y autonómica (de 19% a 47%).',
    keyPoints: [
      'Se restan todos los pagos fraccionados abonados previamente en el Modelo 130 y retenciones.',
      'Determina la cuota final a pagar o devolver.',
      'Desde 2023, todos los autónomos dados de alta en el RETA están obligados a presentar la Renta, sin importar el nivel de ingresos mínimos.'
    ],
    tipsForWorkshop: 'Mantener un balance de ingresos y gastos cuadrado y digitalizado en GESTARIAN minimiza discrepancias en las paralelas o requerimientos de la AEAT.'
  },
  {
    code: 'Modelo 200',
    name: 'Declaración Anual del Impuesto sobre Sociedades (IS)',
    target: 'sociedades',
    periodicity: 'anual',
    deadlines: 'Del 1 al 25 de julio (para ejercicios que coinciden con el año natural cerrados al 31 de diciembre)',
    description: 'Impuesto directo que grava el beneficio contable ajustado fiscalmente obtenido por las Sociedades Limitadas (S.L.), Sociedades Anónimas (S.A.) y demás entidades jurídicas.',
    keyPoints: [
      'Tipo impositivo general: 25% sobre la base imponible.',
      'Tipo reducido para empresas de nueva creación: 15% durante el primer ejercicio en que la base imponible sea positiva y en el siguiente.',
      'Tipo reducido para micropymes y entidades de reducida dimensión: 23% para sociedades con cifra de negocios inferior a 1 millón de euros según presupuestos del Estado.',
      'Se deducen los pagos a cuenta realizados mediante el Modelo 202 y las retenciones sufridas.'
    ],
    tipsForWorkshop: 'Para talleres constituidos como S.L., la contabilidad debe estar estrictamente adaptada al Plan General Contable (PGC PYMES) y reflejar existencias de recambios a cierre de ejercicio.'
  },
  {
    code: 'Modelo 202',
    name: 'Pagos Fraccionados del Impuesto sobre Sociedades',
    target: 'sociedades',
    periodicity: 'trimestral',
    deadlines: '1P: 1-20 de abril | 2P: 1-20 de octubre | 3P: 1-20 de diciembre',
    description: 'Pagos a cuenta anticipados del Impuesto sobre Sociedades para empresas en función del resultado del último ejercicio cerrado.',
    keyPoints: [
      'Modalidad general (Art. 40.2 LIS): 18% sobre la cuota íntegra del último Modelo 200 presentado.',
      'Modalidad opcional o para grandes empresas (Art. 40.3 LIS): Porcentaje sobre la base imponible acumulada del periodo.',
      'Obligatorio para sociedades cuya facturación superó 6.000.000 € o si la última cuota del Modelo 200 fue positiva.'
    ],
    tipsForWorkshop: 'Si la S.L. tuvo beneficios en el último ejercicio, deberás prever tesorería en abril, octubre y diciembre para estos 3 pagos anticipados.'
  },
  {
    code: 'Modelo 111',
    name: 'Retenciones e Ingresos a Cuenta de IRPF (Trabajadores y Profesionales)',
    target: 'ambos',
    periodicity: 'trimestral',
    deadlines: '1T: 1-20 de abril | 2T: 1-20 de julio | 3T: 1-20 de octubre | 4T: 1-20 de enero (mensual para grandes empresas)',
    description: 'Declaración e ingreso de las retenciones de IRPF que el taller ha practicado en las nóminas de sus mecánicos/chapistas/pintores y en las facturas de profesionales independientes (abogados, asesores, peritos).',
    keyPoints: [
      'El taller actúa como recaudador de la AEAT, reteniendo un % en nóminas o servicios profesionales.',
      'Esas retenciones deben ingresarse íntegramente a Hacienda.',
      'No presentar este modelo conlleva recargos y sanciones inmediatas al ser dinero retenido a terceros.'
    ],
    tipsForWorkshop: 'Comprueba mensualmente con tu gestor laboral el importe retenido en las nóminas de los operarios para no tener sorpresas a cierre de trimestre.'
  },
  {
    code: 'Modelo 190',
    name: 'Resumen Anual de Retenciones e Ingresos a Cuenta (Nóminas y Profesionales)',
    target: 'ambos',
    periodicity: 'anual',
    deadlines: 'Del 1 al 31 de enero',
    description: 'Declaración informativa anual que detalla perceptor por perceptor (NIF, nombre, percepciones íntegras y retenciones) lo ingresado trimestralmente en el Modelo 111.',
    keyPoints: [
      'Genera los certificados de retenciones que la empresa debe entregar a cada trabajador antes de la campaña de Renta.',
      'Debe cuadrar al céntimo con la suma de los 4 Modelos 111 del ejercicio.'
    ],
    tipsForWorkshop: 'Sirve de base para que tus operarios dispongan de su borrador de IRPF correcto en la AEAT.'
  },
  {
    code: 'Modelo 115',
    name: 'Retenciones por Arrendamiento de Inmuebles Urbanos (Alquiler de Nave/Local)',
    target: 'ambos',
    periodicity: 'trimestral',
    deadlines: '1T: 1-20 de abril | 2T: 1-20 de julio | 3T: 1-20 de octubre | 4T: 1-20 de enero',
    description: 'Declaración e ingreso de la retención del 19% de IRPF practicada en la factura de alquiler de la nave industrial, taller o local comercial al propietario.',
    keyPoints: [
      'Tipo de retención estándar: 19% sobre la base imponible del alquiler.',
      'Exenciones: Si la renta anual al mismo arrendador no supera los 900 € o si el arrendador acredita estar en el epígrafe 861.2 de IAE con cuota no cero.'
    ],
    tipsForWorkshop: 'Si tienes alquilada la nave del taller, asegúrate de aplicar el 19% de retención y el 21% de IVA en la factura mensual de tu casero.'
  },
  {
    code: 'Modelo 180',
    name: 'Resumen Anual de Retenciones por Alquileres de Inmuebles Urbanos',
    target: 'ambos',
    periodicity: 'anual',
    deadlines: 'Del 1 al 31 de enero',
    description: 'Resumen informativo anual del Modelo 115 donde se desglosan los datos de los propietarios, referencia catastral de la nave/local y cuantías satisfechas y retenidas.',
    keyPoints: [
      'Obligatorio incluir la Referencia Catastral de la nave o local del taller.',
      'Debe coincidir exactamente con los 4 trimestres del Modelo 115.'
    ],
    tipsForWorkshop: 'Ten a mano la referencia catastral de la nave industrial para facilitársela a la gestoría en enero.'
  },
  {
    code: 'Modelo 347',
    name: 'Declaración Anual de Operaciones con Terceros (> 3.005,06 €)',
    target: 'ambos',
    periodicity: 'anual',
    deadlines: 'Del 1 al 28/29 de febrero de cada año',
    description: 'Declaración informativa anual donde se declaran todos los clientes y proveedores con los que se hayan superado los 3.005,06 € anuales (IVA incluido) en volumen de negocio.',
    keyPoints: [
      'Cruza información con las declaraciones de tus proveedores de recambios, pintura y aseguradoras.',
      'Desglose trimestral de las operaciones para verificar concordancias.',
      'Excluidas las operaciones que ya hayan sido objeto de retención (ej. profesionales del Modelo 190 o arrendamientos del 180).'
    ],
    tipsForWorkshop: 'GESTARIAN permite exportar el listado de clientes y proveedores que superan los 3.005,06 € para conciliar importes con distribuidoras de recambios y aseguradoras antes de febrero.'
  },
  {
    code: 'Modelo 349',
    name: 'Declaración Recapitulativa de Operaciones Intracomunitarias',
    target: 'ambos',
    periodicity: 'trimestral',
    deadlines: '1-20 del mes siguiente a cada trimestre (o mensual si supera 50.000 € en adquisiciones)',
    description: 'Declaración obligatoria para compras o ventas de bienes y servicios con empresas de la Unión Europea (compras de maquinaria en Alemania, recambios en Francia o software en Irlanda).',
    keyPoints: [
      'Requiere estar dado de alta previamente en el Registro de Operadores Intracomunitarios (ROI) con NIF-IVA / VIES.',
      'Las facturas intracomunitarias van exentas de IVA en origen y se realiza inversión del sujeto pasivo en España.'
    ],
    tipsForWorkshop: 'Si compras herramientas o maquinaria de diagnosis en la UE sin IVA, comprueba que tu CIF esté validado en el sistema VIES de la AEAT.'
  },
  {
    code: 'Modelo 036 / 037',
    name: 'Declaración Censal de Alta, Modificación y Baja',
    target: 'ambos',
    periodicity: 'puntual',
    deadlines: 'Previo al inicio de la actividad o dentro del mes siguiente a cualquier cambio',
    description: 'Formulario oficial para comunicar a la AEAT el inicio de actividad, domicilio fiscal, epígrafes del IAE (691.2 para reparación de automóviles), régimen de IVA e IRPF, alta en ROI o modificaciones de administradores.',
    keyPoints: [
      'Modelo 037: Versión simplificada para personas físicas (autónomos) residentes.',
      'Modelo 036: Versión completa obligatoria para Sociedades Limitadas (S.L.), entidades sin personalidad jurídica, operadores intracomunitarios y ventas a distancia.'
    ],
    tipsForWorkshop: 'Revisa que tu epígrafe IAE (691.2 Taller mecánico/chapa/pintura) y local afecto estén correctamente registrados para evitar denegación de deducciones de suministros.'
  }
];

export const COMPARATIVA_AUTONOMO_VS_SL = {
  autonomo: {
    title: 'Autónomo (Persona Física / RETA)',
    responsabilidad: 'Ilimitada: Responde de las deudas del negocio con todo su patrimonio personal presente y futuro.',
    tributacion: 'IRPF progresivo (desde 19% hasta 47% según tramo de beneficio neto). A partir de ~45.000 € - 50.000 € de beneficio neto suele ser más eficiente constituir una S.L.',
    constitucion: 'Inmediata, sin capital social mínimo inicial. Trámite telemático Circe/PAE.',
    contabilidad: 'Simplificada: Libros registro de Facturas Emitidas, Facturas Recibidas, Bienes de Inversión y Gastos.',
    obligacionesMercantiles: 'No está obligado a depositar cuentas anuales ni legalizar libros en el Registro Mercantil.',
    cotizacion: 'Sistema de cotización por tramos según rendimientos netos reales (RETA 2023-2026).'
  },
  sociedadLimitada: {
    title: 'Sociedad Limitada (S.L. / Persona Jurídica)',
    responsabilidad: 'Limitada al capital aportado en la sociedad. El patrimonio personal de los socios queda protegido (salvo avales personales bancarios o negligencia grave de administradores).',
    tributacion: 'Impuesto sobre Sociedades a tipo fijo (25% general, 15% para nueva creación, 23% micropymes). Muy ventajoso para reinvertir beneficios en maquinaria, instalaciones y crecimiento.',
    constitucion: 'Escritura pública notarial e inscripción en el Registro Mercantil. Capital social desde 1 € (Ley Crea y Crece, con reserva del 20% hasta alcanzar 3.000 €).',
    contabilidad: 'Formal y rigurosa según Plan General Contable (Libro Diario, Balances, Pérdidas y Ganancias, Memoria).',
    obligacionesMercantiles: 'Obligatoria Legalización de Libros Oficiales (hasta 30 de abril) y Depósito de Cuentas Anuales en el Registro Mercantil (hasta 30 de julio).',
    sueldoAdministrador: 'El socio-administrador puede cobrar mediante nómina (con retención IRPF) o mediante dividendos (tras pagar el 25% de IS y tributar del 19% al 28% en base del ahorro).'
  }
};

export const REGLAS_GASTOS_DEDUCIBLES_TALLER = [
  {
    categoria: 'Materiales y Recambios',
    criterio: '100% Deducible en IVA y en IRPF / IS.',
    detalle: 'Pinturas, barnices, aparejos, masillas, abrasivos, piezas de recambio originales y compatibles, aceites, filtros y consumibles de taller.',
    requisito: 'Factura oficial con CIF/NIF del proveedor, desglose de IVA y descripción clara.'
  },
  {
    categoria: 'Maquinaria y Herramientas (Bienes de Inversión)',
    criterio: 'Amortizable en IRPF/IS + IVA 100% deducible en el trimestre de compra.',
    detalle: 'Cabinas de pintura, bancadas, elevadores, pistolas HVLP, compresores, máquinas de soldadura, equipos de diagnosis OBD.',
    requisito: 'Bienes con valor superior a 300 € se amortizan anualmente según tablas oficiales de amortización de la AEAT (p. ej. maquinaria 12% anual / 8 años, herramientas 30% anual / 3 años).'
  },
  {
    categoria: 'Local o Nave Industrial del Taller',
    criterio: '100% Deducible si está 100% afecta a la actividad.',
    detalle: 'Alquiler mensual (con retención 19% Modelo 115 e IVA 21%), IBI, tasa de basuras, comunidad de propietarios, seguros de responsabilidad civil y multirriesgo taller.',
    requisito: 'El inmueble debe constar afecto a la actividad en el Modelo 036/037 de la AEAT.'
  },
  {
    categoria: 'Suministros (Luz, Agua, Gas, Internet, Teléfono)',
    criterio: '100% Deducible en naves industriales y locales comerciales exclusivos.',
    detalle: 'Electricidad de cabina y compresores, gas natural de secado, agua de lavado de piezas, fibra óptica del taller y líneas móviles corporativas.',
    requisito: 'Facturas a nombre de la empresa/autónomo con dirección de la nave.'
  },
  {
    categoria: 'Vehículos de Taller (Grúas, Vehículos de sustitución, Furgonetas)',
    criterio: '100% Deducible en IVA e IRPF/IS solo si son vehículos industriales o comerciales de uso exclusivo.',
    detalle: 'Furgonetas de transporte de recambios con rotulación, grúa del taller, coches de sustitución para clientes con contrato de cesión.',
    requisito: 'Turismos de gerencia o uso mixto: Presunción general de la AEAT del 50% de IVA deducible, salvo prueba fehaciente de afectación exclusiva al 100%.'
  },
  {
    categoria: 'Personal y Servicios Profesionales',
    criterio: '100% Deducible.',
    detalle: 'Sueldos brutos de mecánicos, chapistas y pintores, Seguridad Social a cargo de la empresa (TC1/TC2), servicios de asesoría contable, peritaciones y software como GESTARIAN PRO.',
    requisito: 'Nóminas contabilizadas y facturas de servicios profesionales.'
  }
];

export const NORMATIVA_VERIFACTU_FACTURA_ELECTRONICA = {
  verifactu: {
    norma: 'Ley 11/2021 de medidas de prevención del fraude fiscal y Real Decreto 1007/2023 (Reglamento Veri*factu).',
    resumen: 'Los sistemas informáticos de facturación deben garantizar la integridad, inalterabilidad, trazabilidad, inviolabilidad, conservación, accesibilidad y legibilidad de los registros de facturación.',
    claves: [
      'Prohibición expresa del software de doble uso o cajas de facturación B.',
      'Generación de registro de facturación encadenado mediante huella digital (Hash SHA-256) antes de la expedición.',
      'Inclusión obligatoria en la factura del código QR tributario y la referencia "Factura verificable en la sede electrónica de la AEAT / VERI*FACTU".',
      'GESTARIAN PRO está diseñado conforme a los estándares técnicos del R.D. 1007/2023 para emitir facturas con trazabilidad correlativa blindada.'
    ]
  },
  creaYcrece: {
    norma: 'Ley 18/2022 de Creación y Crecimiento de Empresas (Factura Electrónica B2B obligatoria).',
    resumen: 'Obligatoriedad de expedir y remitir factura electrónica en todas las relaciones comerciales entre empresas y autónomos (B2B), con reporte de estado de pago para combatir la morosidad.',
    calendario: 'Entrada en vigor escalonada: 1 año tras desarrollo reglamentario para empresas con facturación > 8M€, y 2 años para el resto de pymes y autónomos.'
  }
};

/**
 * Motor de resolución de consultas fiscales AEAT para Metis AI
 */
export function getAeatFiscalAdvice(query: string, options: { isEmployee?: boolean; isSL?: boolean; isAutonomo?: boolean } = {}): string | null {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remover tildes

  // Restricción por rol de empleado si la consulta es netamente económica/estratégica
  if (options.isEmployee) {
    const isRestricted = q.includes('beneficio') || q.includes('declarar') || q.includes('sociedades') || q.includes('irpf') || q.includes('hacienda') || q.includes('aeat') || q.includes('modelo 200') || q.includes('modelo 130');
    if (isRestricted) {
      return '⚠️ **Acceso Restringido a Información Fiscal:** Las consultas detalladas sobre liquidaciones tributarias, Modelos de la AEAT y balances fiscales están reservadas a la gerencia del taller.';
    }
  }

  // 1. CONSULTA ESPECÍFICA POR MODELO TRIBUTARIO
  const foundModel = AEAT_FISCAL_MODELS.find(m => {
    const codeClean = m.code.toLowerCase().replace(/[^0-9]/g, '');
    const queryDigits = q.replace(/[^0-9]/g, '');
    return q.includes(m.code.toLowerCase()) || (queryDigits && queryDigits === codeClean && (q.includes('modelo') || q.includes('mod') || q.includes('mod.')));
  });

  if (foundModel) {
    return `🏛️ **Guía Oficial AEAT · ${foundModel.code}**
**Nombre:** ${foundModel.name}
**Destinatarios:** ${foundModel.target === 'ambos' ? 'Autónomos y Sociedades Limitadas (S.L.)' : foundModel.target === 'autonomos' ? 'Autónomos individuales' : 'Sociedades Mercantiles (S.L. / S.A.)'}
**Periodicidad:** ${foundModel.periodicity.toUpperCase()}
📅 **Plazos de Presentación:** ${foundModel.deadlines}

**¿En qué consiste?**
${foundModel.description}

**Puntos clave según la Agencia Tributaria:**
${foundModel.keyPoints.map(pt => `• ${pt}`).join('\n')}

💡 **Consejo Gestarian para el Taller:**
${foundModel.tipsForWorkshop}`;
  }

  // 2. COMPARATIVA AUTÓNOMO VS SOCIEDAD LIMITADA
  if ((q.includes('autonomo') || q.includes('autonoma')) && (q.includes('sociedad') || q.includes('s.l.') || q.includes('sl') || q.includes('empresa') || q.includes('diferencia') || q.includes('conviene') || q.includes('constituir'))) {
    return `🏛️ **Comparativa AEAT / Mercantil: Autónomo vs Sociedad Limitada (S.L.)**

1. **Responsabilidad Legal:**
   • **Autónomo:** ${COMPARATIVA_AUTONOMO_VS_SL.autonomo.responsabilidad}
   • **Sociedad Limitada (S.L.):** ${COMPARATIVA_AUTONOMO_VS_SL.sociedadLimitada.responsabilidad}

2. **Tributación y Tipos Impositivos:**
   • **Autónomo (IRPF):** ${COMPARATIVA_AUTONOMO_VS_SL.autonomo.tributacion}
   • **Sociedad Limitada (Impuesto de Sociedades):** ${COMPARATIVA_AUTONOMO_VS_SL.sociedadLimitada.tributacion}

3. **Obligaciones Contables y Mercantiles:**
   • **Autónomo:** ${COMPARATIVA_AUTONOMO_VS_SL.autonomo.contabilidad}. No deposita cuentas anuales en el Registro Mercantil.
   • **Sociedad Limitada:** ${COMPARATIVA_AUTONOMO_VS_SL.sociedadLimitada.contabilidad}. Obligada a Legalizar Libros Oficiales (hasta 30 de abril) y Depósito de Cuentas Anuales (hasta 30 de julio).

4. **¿Cuándo dar el salto a S.L. en un taller?**
   Cuando el beneficio neto anual consolidado supera los **45.000 € - 50.000 €**, se reinvierten ganancias en maquinaria/instalaciones, se contrata más plantilla o se busca blindar el patrimonio personal familiar frente a riesgos de actividad.`;
  }

  // 3. CALENDARIO FISCAL / PLAZOS DE TRIMESTRES
  if (q.includes('calendario') || q.includes('plazos') || q.includes('cuando se paga') || q.includes('fecha limite') || (q.includes('trimestre') && (q.includes('cuanto') || q.includes('cuando') || q.includes('dias') || q.includes('fechas')))) {
    return `📅 **Calendario Oficial del Contribuyente AEAT (Autónomos y Pymes):**

• **1er Trimestre (1T - Enero a Marzo):**
  - Presentación: **1 al 20 de Abril**
  - Modelos: 303 (IVA), 130/131 (IRPF), 111 (Retenciones nóminas/profesionales), 115 (Alquiler nave), 202 (IS Pago 1P).

• **2º Trimestre (2T - Abril a Junio):**
  - Presentación: **1 al 20 de Julio**
  - Modelos: 303, 130/131, 111, 115.
  - **Impuesto sobre Sociedades Anual (Modelo 200):** Del **1 al 25 de Julio**.

• **3er Trimestre (3T - Julio a Septiembre):**
  - Presentación: **1 al 20 de Octubre**
  - Modelos: 303, 130/131, 111, 115, 202 (IS Pago 2P).

• **4º Trimestre y Resúmenes Anuales (4T - Octubre a Diciembre):**
  - Presentación: **1 al 30 de Enero del año siguiente**
  - Modelos: 303 (hasta 30 enero), 390 (hasta 30 enero), 130/131 (hasta 30 enero), 111 (hasta 20 enero), 190 (hasta 31 enero), 115 (hasta 20 enero), 180 (hasta 31 enero).

• **Febrero:**
  - **Modelo 347** (Operaciones con terceros > 3.005,06 €): Hasta el 28 de Febrero.

• **Abril a Junio:**
  - **Campaña de la Renta (Modelo 100):** Liquidación anual de IRPF.`;
  }

  // 4. GASTOS DEDUCIBLES EN EL TALLER / IVA SOPORTADO
  if (q.includes('deducible') || q.includes('desgravar') || q.includes('que puedo deducir') || q.includes('gasto') || q.includes('gastos') || q.includes('iva deducible') || q.includes('factura deducible')) {
    return `🧾 **Guía AEAT: Gastos y Cuotas de IVA Deducibles en el Taller:**

Para que un gasto sea deducible ante la Agencia Tributaria debe cumplir 3 requisitos obligatorios:
1. **Vinculación directa:** Estar afecto a la actividad del taller.
2. **Justificación documental:** Factura completa con CIF/NIF emisor y receptor (los tickets/facturas simplificadas sin CIF no desgravan IRPF/IS ni IVA deducible sin canje).
3. **Registro contable:** Asentado en el libro registro de gastos.

**Categorías principales en talleres de automoción:**
• **Pinturas, recambios y consumibles:** 100% deducible en IVA e IRPF/IS.
• **Maquinaria y herramientas (> 300 €):** IVA 100% deducible en el trimestre de compra. La base se amortiza según tablas AEAT (elevadores, cabina, soldadura).
• **Nave industrial / Local:** 100% alquiler, IBI, comunidad y seguros.
• **Suministros (Luz, agua, gas secado, internet):** 100% en locales exclusivos del negocio.
• **Vehículos de empresa / Furgoneta de piezas:** 100% si es furgón comercial/grúa rotulada. En turismos particulares/comerciales la AEAT aplica presunción del 50% de IVA.
• **Software y gestión:** Licencia de GESTARIAN PRO 100% deducible como gasto operativo.`;
  }

  // 5. FACTURACIÓN ELECTRÓNICA, VERI*FACTU Y LEY ANTIFRAUDE
  if (q.includes('verifactu') || q.includes('veri*factu') || q.includes('antifraude') || q.includes('factura electronica') || q.includes('crea y crece') || q.includes('qr')) {
    return `🛡️ **Normativa Veri*factu y Factura Electrónica en España:**

1. **Reglamento Veri*factu (R.D. 1007/2023 & Ley 11/2021 Antifraude):**
   • Exige que los programas de facturación generen registros seguros, correlativos e inalterables mediante huellas criptográficas (**Hash encadenado**).
   • Toda factura expedida debe incluir un **Código QR tributario** y la leyenda oficial que permite al cliente comprobar al instante la validez del documento en la sede electrónica de la AEAT.
   • Queda prohibida cualquier alteración u omisión retroactiva de facturas emitidas.

2. **Ley Crea y Crece (Facturación Electrónica B2B):**
   • Hace obligatoria la emisión y recepción de factura electrónica estructurada (Facturae / formatos interoperables) en todas las operaciones entre empresas y autónomos.
   • Obligación de reportar los estados de factura (Aceptación comercial y Pago efectivo).

3. **Cumplimiento en GESTARIAN PRO:**
   • GESTARIAN genera series correlativas continuadas, control de estados de cobro y documentos PDF estándar A4 preparados para la verificación tributaria.`;
  }

  // 6. RETENCIONES (IRPF, ALQUILERES, NÓMINAS)
  if (q.includes('retencion') || q.includes('retenciones') || q.includes('retener') || q.includes('19%') || q.includes('15%') || q.includes('7%')) {
    return `📌 **Guía de Retenciones de IRPF según la AEAT:**

1. **Retenciones en Facturas de Venta del Taller:**
   • Si tu actividad es **empresarial pura** (Epígrafe IAE 691.2 - Reparación de vehículos), tus facturas a clientes particulares o empresas **NO llevan retención de IRPF**. Llevan Base + 21% IVA.
   • Solo los profesionales titulados (Sección 2ª del IAE) aplican retención del 15% (o 7% los dos primeros años de alta).

2. **Retenciones en Alquiler de Nave / Local (Modelo 115 / 180):**
   • Se practica una retención del **19%** sobre la base imponible del alquiler al arrendador propietario.
   • El taller ingresa ese 19% trimestralmente a la AEAT mediante el Modelo 115.

3. **Retenciones en Nóminas de Operarios (Modelo 111 / 190):**
   • Retención calculada en nómina según las tablas oficiales de IRPF de la AEAT en función del salario bruto anual y la situación familiar del trabajador.

4. **Retenciones en Dividendos de Sociedades (Modelo 123 / 193):**
   • Si una S.L. reparte dividendos a sus socios, retiene el **19%** a cuenta del IRPF del socio.`;
  }

  // 7. CONSULTA GENERAL DE IMPUESTOS / AEAT
  if (q.includes('aeat') || q.includes('hacienda') || q.includes('tributo') || q.includes('impuesto') || q.includes('fiscal') || q.includes('obligaciones')) {
    return `🏛️ **Obligaciones Fiscales Básicas en España (AEAT) para Talleres y Pymes:**

Las empresas y autónomos en España tienen tres grandes pilares tributarios:

1. **IVA (Impuesto sobre el Valor Añadido):**
   • **Modelo 303:** Autoliquidación trimestral (IVA repercutido 21% - IVA soportado deducible).
   • **Modelo 390:** Resumen anual consolidado en enero.

2. **Impuesto Directo sobre el Rendimiento:**
   • **Si eres Autónomo:** Pagos fraccionados trimestrales con **Modelo 130** (20% del beneficio) y liquidación anual con **Modelo 100 (Renta)**.
   • **Si eres Sociedad Limitada (S.L.):** Pagos a cuenta con **Modelo 202** (abril, octubre, diciembre) y liquidación anual del **Modelo 200 (Impuesto sobre Sociedades - 25% general)** en julio.

3. **Retenciones e Informativas:**
   • **Modelo 111 / 190:** Retenciones de IRPF a operarios y profesionales independientes.
   • **Modelo 115 / 180:** Retención del 19% por alquiler de la nave del taller.
   • **Modelo 347:** Operaciones anuales con terceros superiores a 3.005,06 €.

¿Necesitas conocer el funcionamiento o plazos de algún modelo específico (303, 130, 200, 115, 347)? Dime el modelo o tu duda concreta y te detallaré la normativa de la AEAT.`;
  }

  return null;
}
