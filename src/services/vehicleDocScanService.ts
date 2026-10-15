import { VehicleOcrData } from '../types';

export interface ScanVehicleDocResponse {
  success: boolean;
  data?: Partial<VehicleOcrData>;
  error?: string;
  isSimulated?: boolean;
}

/**
 * Realiza el escaneo y extracción OCR de un Permiso de Circulación o Ficha Técnica
 * comunicando con el endpoint seguro del servidor con IA Gemini.
 */
export async function scanVehicleDocument(
  imageBase64: string,
  docType: 'permiso_circulacion' | 'ficha_tecnica'
): Promise<ScanVehicleDocResponse> {
  try {
    const response = await fetch('/api/scan-vehicle-docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        docType,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Error del servidor HTTP ${response.status}`,
      };
    }

    const resJson = await response.json();
    return resJson;
  } catch (err: unknown) {
    console.error('Error al escanear documentación de vehículo:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión con el servicio de OCR',
    };
  }
}
