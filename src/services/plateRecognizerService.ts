import { PlateRecognizerResult, SystemConfig } from '../types';

export async function fetchSystemConfig(): Promise<SystemConfig> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Si la llamada falla o estamos en modo estático
  }

  return {
    githubRepoUrl: 'https://github.com/gestarian/gestarian-core',
    hasPlateRecognizerKey: false,
    hasResendKey: false,
  };
}

export interface RecognitionOutcome {
  success: boolean;
  result?: PlateRecognizerResult;
  error?: string;
  isConfigured?: boolean;
}

export async function recognizePlateImage(
  imageDataUrl: string,
  region: string = 'es'
): Promise<RecognitionOutcome> {
  try {
    const res = await fetch('/api/plate-recognizer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageDataUrl,
        region,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'No se pudo procesar la matrícula con Plate Recognizer.',
        isConfigured: data.isConfigured !== false,
      };
    }

    const firstResult = data.data?.results?.[0];

    if (!firstResult || !firstResult.plate) {
      return {
        success: false,
        error: 'No se detectó ninguna matrícula legible en la imagen proporcionada.',
      };
    }

    const outcome: PlateRecognizerResult = {
      plate: firstResult.plate.toUpperCase(),
      confidence: Math.round((firstResult.score || firstResult.dscore || 0.9) * 100),
      region: firstResult.region ? { code: firstResult.region.code, score: firstResult.region.score } : undefined,
      vehicle: firstResult.vehicle ? { type: firstResult.vehicle.type, score: firstResult.vehicle.score } : undefined,
      box: firstResult.box,
    };

    return {
      success: true,
      result: outcome,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con el servidor';
    return {
      success: false,
      error: `Error de conexión: ${msg}`,
    };
  }
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
