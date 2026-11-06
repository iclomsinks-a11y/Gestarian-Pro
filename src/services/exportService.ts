import { GestarianDocument, QuarterlyReport } from '../types';

/**
 * Genera el Libro de Facturas Emitidas y Recibidas en formato XML / XLS compatible con Excel
 * Contiene tres hojas de cálculo:
 * 1. Facturas Emitidas (Ingresos / Ventas)
 * 2. Facturas Recibidas (Gastos / Proveedores / Suministros)
 * 3. Resumen y Liquidación de Importes
 */
export function generateExcelXmlReport(
  report: QuarterlyReport,
  receivedInvoices: GestarianDocument[] = []
): string {
  // Filas facturas emitidas
  const emittedRows = report.invoices.map((inv) => `
      <Row>
        <Cell><Data ss:Type="String">${inv.number}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.date}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.clientCif}</Data></Cell>
        <Cell><Data ss:Type="String"><![CDATA[${inv.clientName}]]></Data></Cell>
        <Cell><Data ss:Type="Number">${inv.subtotal.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIva ? inv.ivaRate : 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.ivaAmount.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIrpf ? inv.irpfRate : 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.irpfAmount.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.total.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.status.toUpperCase()}</Data></Cell>
      </Row>
  `).join('');

  // Filas facturas recibidas
  const totalReceivedSubtotal = receivedInvoices.reduce((acc, d) => acc + (d.subtotal || 0), 0);
  const totalReceivedIva = receivedInvoices.reduce((acc, d) => acc + (d.ivaAmount || (d.subtotal * 0.21) || 0), 0);
  const totalReceivedGross = receivedInvoices.reduce((acc, d) => acc + (d.total || (d.subtotal + (d.ivaAmount || d.subtotal * 0.21)) || 0), 0);

  const receivedRows = receivedInvoices.map((inv) => `
      <Row>
        <Cell><Data ss:Type="String">${inv.number}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.date}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.clientCif || inv.issuerCif || '-'}</Data></Cell>
        <Cell><Data ss:Type="String"><![CDATA[${inv.clientName || inv.issuerName || 'Proveedor'}]]></Data></Cell>
        <Cell><Data ss:Type="String"><![CDATA[${inv.items?.[0]?.description || 'Gasto / Recambio / Suministro'}]]></Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.subtotal || 0).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIva ? inv.ivaRate : 21}</Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.ivaAmount || inv.subtotal * 0.21 || 0).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.total || 0).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="String">DEDUCIBLE</Data></Cell>
      </Row>
  `).join('');

  const netIvaBalance = report.totalIva - totalReceivedIva;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2942" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="HeaderGastos">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#475569" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HighlightGreen">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- HOJA 1: FACTURAS EMITIDAS -->
 <Worksheet ss:Name="Facturas Emitidas ${report.quarter}">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="60"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">NÚMERO</Data></Cell>
    <Cell><Data ss:Type="String">FECHA</Data></Cell>
    <Cell><Data ss:Type="String">NIF/CIF</Data></Cell>
    <Cell><Data ss:Type="String">CLIENTE</Data></Cell>
    <Cell><Data ss:Type="String">BASE IMPONIBLE</Data></Cell>
    <Cell><Data ss:Type="String">% IVA</Data></Cell>
    <Cell><Data ss:Type="String">CUOTA IVA</Data></Cell>
    <Cell><Data ss:Type="String">% IRPF</Data></Cell>
    <Cell><Data ss:Type="String">RETENCIÓN</Data></Cell>
    <Cell><Data ss:Type="String">TOTAL FACTURA</Data></Cell>
    <Cell><Data ss:Type="String">ESTADO</Data></Cell>
   </Row>
   ${emittedRows}
   <Row ss:StyleID="Total">
    <Cell><Data ss:Type="String">TOTALES EMITIDAS</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">${report.invoices.length} facturas</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalSubtotal.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalIva.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalIrpf.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalGross.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- HOJA 2: FACTURAS RECIBIDAS (GASTOS) -->
 <Worksheet ss:Name="Facturas Recibidas ${report.quarter}">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Row ss:StyleID="HeaderGastos">
    <Cell><Data ss:Type="String">NÚMERO / FRA</Data></Cell>
    <Cell><Data ss:Type="String">FECHA</Data></Cell>
    <Cell><Data ss:Type="String">NIF PROVEEDOR</Data></Cell>
    <Cell><Data ss:Type="String">PROVEEDOR / EXPEDIDOR</Data></Cell>
    <Cell><Data ss:Type="String">CONCEPTO / RECAMBIO</Data></Cell>
    <Cell><Data ss:Type="String">BASE IMPONIBLE</Data></Cell>
    <Cell><Data ss:Type="String">% IVA</Data></Cell>
    <Cell><Data ss:Type="String">IVA SOPORTADO</Data></Cell>
    <Cell><Data ss:Type="String">TOTAL FACTURA</Data></Cell>
    <Cell><Data ss:Type="String">TIPO</Data></Cell>
   </Row>
   ${receivedRows}
   <Row ss:StyleID="Total">
    <Cell><Data ss:Type="String">TOTALES RECIBIDAS</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">${receivedInvoices.length} facturas</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedSubtotal.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedIva.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedGross.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- HOJA 3: RESUMEN FISCAL E IMPORTES -->
 <Worksheet ss:Name="Resumen Liquidación">
  <Table>
   <Column ss:Width="250"/>
   <Column ss:Width="140"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">CONCEPTO TRIBUTARIO (${report.quarter} ${report.year})</Data></Cell>
    <Cell><Data ss:Type="String">IMPORTE (€)</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">1. Base Imponible Facturas Emitidas (Ingresos)</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalSubtotal.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">2. IVA Repercutido Devengado (Casilla [03] Modelo 303)</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalIva.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">3. Base Imponible Facturas Recibidas (Gastos Deducibles)</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedSubtotal.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">4. IVA Soportado Deducible (Casilla [29] Modelo 303)</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedIva.toFixed(2)}</Data></Cell>
   </Row>
   <Row ss:StyleID="HighlightGreen">
    <Cell><Data ss:Type="String">RESULTADO ESTIMADO MODELO 303 (A ingresar / Compensar)</Data></Cell>
    <Cell><Data ss:Type="Number">${netIvaBalance.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Genera el informe especializado para la gestoría donde se muestran SOLO LOS IMPORTES
 * de todas las facturas emitidas y recibidas en formato XML / XLS compatible con Excel.
 */
export function generateAmountsOnlyReport(
  report: QuarterlyReport,
  receivedInvoices: GestarianDocument[] = []
): string {
  const emittedLines = report.invoices.map((inv) => `
      <Row>
        <Cell><Data ss:Type="String">${report.quarter} ${report.year}</Data></Cell>
        <Cell><Data ss:Type="String">EMITIDA (VENTA)</Data></Cell>
        <Cell><Data ss:Type="String">${inv.number}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.date}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.clientCif}</Data></Cell>
        <Cell><Data ss:Type="String"><![CDATA[${inv.clientName}]]></Data></Cell>
        <Cell><Data ss:Type="Number">${inv.subtotal.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIva ? inv.ivaRate : 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.ivaAmount.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.applyIrpf ? inv.irpfAmount : 0).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.total.toFixed(2)}</Data></Cell>
      </Row>
  `).join('');

  const receivedLines = receivedInvoices.map((inv) => `
      <Row>
        <Cell><Data ss:Type="String">${report.quarter} ${report.year}</Data></Cell>
        <Cell><Data ss:Type="String">RECIBIDA (GASTO)</Data></Cell>
        <Cell><Data ss:Type="String">${inv.number}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.date}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.clientCif || inv.issuerCif || '-'}</Data></Cell>
        <Cell><Data ss:Type="String"><![CDATA[${inv.clientName || inv.issuerName || 'Proveedor'}]]></Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.subtotal || 0).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIva ? inv.ivaRate : 21}</Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.ivaAmount || inv.subtotal * 0.21 || 0).toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">0.00</Data></Cell>
        <Cell><Data ss:Type="Number">${(inv.total || 0).toFixed(2)}</Data></Cell>
      </Row>
  `).join('');

  const totalEmittedSubtotal = report.totalSubtotal;
  const totalEmittedIva = report.totalIva;
  const totalEmittedGross = report.totalGross;

  const totalReceivedSubtotal = receivedInvoices.reduce((acc, d) => acc + (d.subtotal || 0), 0);
  const totalReceivedIva = receivedInvoices.reduce((acc, d) => acc + (d.ivaAmount || (d.subtotal * 0.21) || 0), 0);
  const totalReceivedGross = receivedInvoices.reduce((acc, d) => acc + (d.total || (d.subtotal + (d.ivaAmount || d.subtotal * 0.21)) || 0), 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2942" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="NetResult">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Informe Solo Importes">
  <Table>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="110"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">PERIODO</Data></Cell>
    <Cell><Data ss:Type="String">TIPO FACTURA</Data></Cell>
    <Cell><Data ss:Type="String">NÚMERO</Data></Cell>
    <Cell><Data ss:Type="String">FECHA</Data></Cell>
    <Cell><Data ss:Type="String">NIF/CIF</Data></Cell>
    <Cell><Data ss:Type="String">TITULAR / RAZÓN SOCIAL</Data></Cell>
    <Cell><Data ss:Type="String">BASE IMPONIBLE (€)</Data></Cell>
    <Cell><Data ss:Type="String">% IVA</Data></Cell>
    <Cell><Data ss:Type="String">CUOTA IVA (€)</Data></Cell>
    <Cell><Data ss:Type="String">RET. IRPF (€)</Data></Cell>
    <Cell><Data ss:Type="String">TOTAL (€)</Data></Cell>
   </Row>
   ${emittedLines}
   ${receivedLines}
   <Row ss:StyleID="Total">
    <Cell><Data ss:Type="String">SUBTOTALES</Data></Cell>
    <Cell><Data ss:Type="String">EMITIDAS (VENTAS)</Data></Cell>
    <Cell><Data ss:Type="String">${report.invoices.length} fras</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${totalEmittedSubtotal.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${totalEmittedIva.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalIrpf.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="Number">${totalEmittedGross.toFixed(2)}</Data></Cell>
   </Row>
   <Row ss:StyleID="Total">
    <Cell><Data ss:Type="String">SUBTOTALES</Data></Cell>
    <Cell><Data ss:Type="String">RECIBIDAS (GASTOS)</Data></Cell>
    <Cell><Data ss:Type="String">${receivedInvoices.length} fras</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedSubtotal.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedIva.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="Number">0.00</Data></Cell>
    <Cell><Data ss:Type="Number">${totalReceivedGross.toFixed(2)}</Data></Cell>
   </Row>
   <Row ss:StyleID="NetResult">
    <Cell><Data ss:Type="String">BALANCE NETO</Data></Cell>
    <Cell><Data ss:Type="String">IVA A INGRESAR / COMPENSAR</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">Diferencia IVA Devengado - Soportado</Data></Cell>
    <Cell><Data ss:Type="Number">${(totalEmittedSubtotal - totalReceivedSubtotal).toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${(totalEmittedIva - totalReceivedIva).toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${(totalEmittedGross - totalReceivedGross).toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Genera el archivo para software contable SAGE (Despachos y 50c)
 * Formato CSV estándar con separador punto y coma y cuentas del PGC
 * Incluye tanto facturas emitidas (cuentas 430, 705, 477) como facturas recibidas (cuentas 600, 472, 400)
 */
export function generateSageReport(
  report: QuarterlyReport,
  receivedInvoices: GestarianDocument[] = []
): string {
  const header = 'ASIENTO;FECHA;CUENTA;CONCEPTO;DEBE;HABER;FACTURA;NIF\n';
  let asiento = 1;
  const lines: string[] = [];

  // 1. Facturas Emitidas
  report.invoices.forEach((inv) => {
    const fecha = inv.date.replace(/-/g, '');
    const clienteCta = `43000000`;
    const ventasCta = `70500000`;
    const ivaCta = `47700021`;

    // Apunte Cliente (Debe Total)
    lines.push(
      `${asiento};${fecha};${clienteCta};Fra ${inv.number} ${inv.clientName};${inv.total.toFixed(2)};0.00;${inv.number};${inv.clientCif}`
    );
    // Apunte Ingresos (Haber Base)
    lines.push(
      `${asiento};${fecha};${ventasCta};Fra ${inv.number} Base Imponible;0.00;${inv.subtotal.toFixed(2)};${inv.number};${inv.clientCif}`
    );
    // Apunte IVA Repercutido (Haber IVA)
    if (inv.ivaAmount > 0) {
      lines.push(
        `${asiento};${fecha};${ivaCta};Fra ${inv.number} IVA 21%;0.00;${inv.ivaAmount.toFixed(2)};${inv.number};${inv.clientCif}`
      );
    }
    asiento++;
  });

  // 2. Facturas Recibidas (Gastos / Proveedores)
  receivedInvoices.forEach((inv) => {
    const fecha = (inv.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const gastoCta = `60000000`;
    const ivaSoportadoCta = `47200021`;
    const proveedorCta = `40000000`;

    const sub = inv.subtotal || 0;
    const iva = inv.ivaAmount || sub * 0.21;
    const tot = inv.total || sub + iva;
    const provName = inv.clientName || inv.issuerName || 'Proveedor';
    const provNif = inv.clientCif || inv.issuerCif || '';

    // Apunte Gasto / Compras (Debe Base)
    lines.push(
      `${asiento};${fecha};${gastoCta};Fra Recibida ${inv.number} ${provName};${sub.toFixed(2)};0.00;${inv.number};${provNif}`
    );
    // Apunte IVA Soportado (Debe IVA)
    if (iva > 0) {
      lines.push(
        `${asiento};${fecha};${ivaSoportadoCta};Fra Recibida ${inv.number} IVA Soportado;${iva.toFixed(2)};0.00;${inv.number};${provNif}`
      );
    }
    // Apunte Proveedor (Haber Total)
    lines.push(
      `${asiento};${fecha};${proveedorCta};Fra Recibida ${inv.number} ${provName};0.00;${tot.toFixed(2)};${inv.number};${provNif}`
    );
    asiento++;
  });

  return header + lines.join('\n');
}

/**
 * Genera enlace de importación contable para A3ASESOR / A3eco (Wolters Kluwer)
 * Incluye tanto facturas emitidas (E) como facturas recibidas (R)
 */
export function generateA3Report(
  report: QuarterlyReport,
  receivedInvoices: GestarianDocument[] = []
): string {
  const lines: string[] = [
    `# A3ECO - ENLACE CONTABLE FACTURAS EMITIDAS Y RECIBIDAS - TRIMESTRE ${report.quarter} ${report.year}`,
    `# CÓDIGO EMPRESA;FECHA;TIPO;SERIE;NUMERO;NIF;NOMBRE;BASE;TIPO_IVA;CUOTA_IVA;TOTAL`,
  ];

  // Facturas emitidas (E)
  report.invoices.forEach((inv) => {
    lines.push(
      `00001;${inv.date};E;${inv.series || 'A'};${inv.number};${inv.clientCif};${inv.clientName};${inv.subtotal.toFixed(2)};${inv.applyIva ? inv.ivaRate : 0};${inv.ivaAmount.toFixed(2)};${inv.total.toFixed(2)}`
    );
  });

  // Facturas recibidas (R)
  receivedInvoices.forEach((inv) => {
    const sub = inv.subtotal || 0;
    const iva = inv.ivaAmount || sub * 0.21;
    const tot = inv.total || sub + iva;
    lines.push(
      `00001;${inv.date};R;${inv.series || 'R'};${inv.number};${inv.clientCif || inv.issuerCif || ''};${inv.clientName || inv.issuerName || 'Proveedor'};${sub.toFixed(2)};${inv.applyIva ? inv.ivaRate : 21};${iva.toFixed(2)};${tot.toFixed(2)}`
    );
  });

  return lines.join('\n');
}

/**
 * Genera el Libro de Facturas Emitidas y Recibidas en formato CSV delimitado por comas
 */
export function generateCsvReport(
  report: QuarterlyReport,
  receivedInvoices: GestarianDocument[] = []
): string {
  const header = 'Tipo,Numero,Fecha,NIF,Nombre,Base_Imponible,Tipo_IVA,Cuota_IVA,Tipo_IRPF,Retencion_IRPF,Total_Factura,Estado\n';
  const emittedRows = report.invoices.map((inv) =>
    `"EMITIDA","${inv.number}","${inv.date}","${inv.clientCif}","${inv.clientName.replace(/"/g, '""')}",${inv.subtotal.toFixed(2)},${inv.applyIva ? inv.ivaRate : 0},${inv.ivaAmount.toFixed(2)},${inv.applyIrpf ? inv.irpfRate : 0},${inv.irpfAmount.toFixed(2)},${inv.total.toFixed(2)},"${inv.status}"`
  );

  const receivedRows = receivedInvoices.map((inv) => {
    const sub = inv.subtotal || 0;
    const iva = inv.ivaAmount || sub * 0.21;
    const tot = inv.total || sub + iva;
    const provName = inv.clientName || inv.issuerName || 'Proveedor';
    const provNif = inv.clientCif || inv.issuerCif || '';
    return `"RECIBIDA","${inv.number}","${inv.date}","${provNif}","${provName.replace(/"/g, '""')}",${sub.toFixed(2)},21,${iva.toFixed(2)},0,0.00,${tot.toFixed(2)},"CONFIRMADA"`;
  });

  return header + [...emittedRows, ...receivedRows].join('\n');
}

/**
 * Descarga en el navegador cualquier cadena como archivo
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
