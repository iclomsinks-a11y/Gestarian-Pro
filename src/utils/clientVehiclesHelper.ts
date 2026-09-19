import { Client, GestarianDocument, VehicleOcrData } from '../types';

export interface ClientVehicleInfo {
  plate: string;
  brand: string;
  model: string;
  color?: string;
  vin?: string;
  images?: string[];
  ocrData?: VehicleOcrData;
}

// Catálogo base de vehículos conocidos para matrículas del sistema
const DEFAULT_KNOWN_VEHICLES: Record<string, { brand: string; model: string; color?: string; vin?: string }> = {
  '2345-KYX': { brand: 'VOLKSWAGEN', model: 'Golf VII 1.5 TSI', color: 'Blanco Puro', vin: 'WVWZZZAUZHP123987' },
  '4512-LKT': { brand: 'RENAULT', model: 'Megane E-Tech', color: 'Azul Rayo', vin: 'VF1RJB00568912345' },
  '9821-HMD': { brand: 'MERCEDES-BENZ', model: 'Clase A 200d', color: 'Gris Montaña', vin: 'WDD1770081J456789' },
  '7890-MRT': { brand: 'IVECO', model: 'Daily 35S15', color: 'Blanco Polar', vin: 'ZCFC35A8105987123' },
  '1122-BBC': { brand: 'FORD', model: 'Transit Custom', color: 'Plata Moondust', vin: 'WF0YXXTTGYLA12345' },
  '3344-DDD': { brand: 'PEUGEOT', model: 'Partner BlueHDi', color: 'Gris Artense', vin: 'VR3ECYHZJNJ654321' },
  '9821-KLS': { brand: 'VOLKSWAGEN', model: 'Golf VII 2.0 TDI', color: 'Negro Profundo', vin: 'WVWZZZAUZJP098712' },
  '4421-HJK': { brand: 'MERCEDES-BENZ', model: 'Clase C 220', color: 'Plata Iridio', vin: 'WDD2050041F123456' },
  '7190-LPZ': { brand: 'RENAULT', model: 'Clio V', color: 'Rojo Deseo', vin: 'VF1RJA00465432109' },
  '2045-MRB': { brand: 'PEUGEOT', model: '308 GT', color: 'Verde Olivine', vin: 'VR3FPYHZMN0123456' },
};

/**
 * Obtiene la lista completa de vehículos (marca, modelo, matrícula, color, vin, imágenes y OCR) de un cliente
 * cruzando datos del cliente, documentos vinculados y catálogo de vehículos.
 */
export function getClientVehiclesList(
  client: Client,
  documents: GestarianDocument[] = []
): ClientVehicleInfo[] {
  const map = new Map<string, ClientVehicleInfo>();

  // 1. Vehículos estructurados en el objeto Client si existen
  if (client.vehicles && Array.isArray(client.vehicles)) {
    for (const v of client.vehicles) {
      if (v.plate && v.plate.trim()) {
        const p = v.plate.trim().toUpperCase();
        map.set(p, {
          plate: p,
          brand: v.brand?.trim() || '',
          model: v.model?.trim() || '',
          color: v.color?.trim() || '',
          vin: v.vin?.trim() || '',
          images: v.images || [],
          ocrData: v.ocrData,
        });
      }
    }
  }

  // 2. Matrículas registradas en client.plates
  if (client.plates && Array.isArray(client.plates)) {
    for (const rawPlate of client.plates) {
      if (rawPlate && rawPlate.trim()) {
        const p = rawPlate.trim().toUpperCase();
        if (!map.has(p)) {
          map.set(p, {
            plate: p,
            brand: '',
            model: '',
          });
        }
      }
    }
  }

  // 3. Documentos vinculados al cliente que contengan vehículo
  const clientDocs = documents.filter((d) => {
    if (d.clientId && d.clientId === client.id) return true;
    if (d.clientCif && client.cif && d.clientCif.trim().toUpperCase() === client.cif.trim().toUpperCase()) return true;
    if (d.clientName && client.name && d.clientName.trim().toLowerCase() === client.name.trim().toLowerCase()) return true;
    if (d.vehiclePlate && client.plates && client.plates.includes(d.vehiclePlate)) return true;
    return false;
  });

  for (const doc of clientDocs) {
    if (doc.vehiclePlate && doc.vehiclePlate.trim()) {
      const p = doc.vehiclePlate.trim().toUpperCase();
      const existing = map.get(p) || { plate: p, brand: '', model: '' };
      if (!existing.brand && doc.vehicleBrand) {
        existing.brand = doc.vehicleBrand.trim();
      }
      if (!existing.model && (doc.vehicleModel || doc.vehicleType)) {
        existing.model = (doc.vehicleModel || doc.vehicleType || '').trim();
      }
      map.set(p, existing);
    }
  }

  // 4. Completar con catálogo de vehículos conocidos o valores por defecto
  const result: ClientVehicleInfo[] = [];
  map.forEach((item, plateKey) => {
    let brand = item.brand;
    let model = item.model;
    let color = item.color;
    let vin = item.vin;

    if (!brand || !model) {
      const known = DEFAULT_KNOWN_VEHICLES[plateKey];
      if (known) {
        if (!brand) brand = known.brand;
        if (!model) model = known.model;
        if (!color && known.color) color = known.color;
        if (!vin && known.vin) vin = known.vin;
      }
    }

    if (!brand) {
      brand = 'VEHÍCULO';
    }
    if (!model) {
      model = 'Turismo';
    }

    result.push({
      plate: item.plate,
      brand: brand.toUpperCase(),
      model,
      color,
      vin,
      images: item.images || [],
      ocrData: item.ocrData,
    });
  });

  return result;
}
