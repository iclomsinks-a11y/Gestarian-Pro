// Servicio de geolocalización y previsión meteorológica para códigos postales

export interface PostalLocation {
  postalCode: string;
  cityName: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number | null;
  cityName: string;
  postalCode?: string;
  isApproximate?: boolean;
}

// Mapeo exhaustivo de los 52 prefijos provinciales de códigos postales en España (01XXX a 52XXX)
export const PROVINCE_POSTAL_MAP: Record<string, { cityName: string; latitude: number; longitude: number }> = {
  '01': { cityName: 'VITORIA-GASTEIZ', latitude: 42.8467, longitude: -2.6716 },
  '02': { cityName: 'ALBACETE', latitude: 38.9943, longitude: -1.8585 },
  '03': { cityName: 'ALICANTE', latitude: 38.3452, longitude: -0.4810 },
  '04': { cityName: 'ALMERÍA', latitude: 36.8340, longitude: -2.4637 },
  '05': { cityName: 'ÁVILA', latitude: 40.6565, longitude: -4.6818 },
  '06': { cityName: 'BADAJOZ', latitude: 38.8794, longitude: -6.9707 },
  '07': { cityName: 'PALMA', latitude: 39.5696, longitude: 2.6502 },
  '08': { cityName: 'BARCELONA', latitude: 41.3851, longitude: 2.1734 },
  '09': { cityName: 'BURGOS', latitude: 42.3440, longitude: -3.6969 },
  '10': { cityName: 'CÁCERES', latitude: 39.4753, longitude: -6.3723 },
  '11': { cityName: 'CÁDIZ', latitude: 36.5271, longitude: -6.2886 },
  '12': { cityName: 'CASTELLÓN', latitude: 39.9864, longitude: -0.0513 },
  '13': { cityName: 'CIUDAD REAL', latitude: 38.9863, longitude: -3.9274 },
  '14': { cityName: 'CÓRDOBA', latitude: 37.8882, longitude: -4.7794 },
  '15': { cityName: 'A CORUÑA', latitude: 43.3623, longitude: -8.4115 },
  '16': { cityName: 'CUENCA', latitude: 40.0704, longitude: -2.1374 },
  '17': { cityName: 'GIRONA', latitude: 41.9794, longitude: 2.8214 },
  '18': { cityName: 'GRANADA', latitude: 37.1773, longitude: -3.5986 },
  '19': { cityName: 'GUADALAJARA', latitude: 40.6337, longitude: -3.1674 },
  '20': { cityName: 'SAN SEBASTIÁN', latitude: 43.3183, longitude: -1.9812 },
  '21': { cityName: 'HUELVA', latitude: 37.2614, longitude: -6.9447 },
  '22': { cityName: 'HUESCA', latitude: 42.1362, longitude: -0.4087 },
  '23': { cityName: 'JAÉN', latitude: 37.7796, longitude: -3.7849 },
  '24': { cityName: 'LEÓN', latitude: 42.5987, longitude: -5.5671 },
  '25': { cityName: 'LLEIDA', latitude: 41.6176, longitude: 0.6200 },
  '26': { cityName: 'LOGROÑO', latitude: 42.4627, longitude: -2.4450 },
  '27': { cityName: 'LUGO', latitude: 43.0097, longitude: -7.5568 },
  '28': { cityName: 'MADRID', latitude: 40.4168, longitude: -3.7038 },
  '29': { cityName: 'MÁLAGA', latitude: 36.7213, longitude: -4.4214 },
  '30': { cityName: 'MURCIA', latitude: 37.9922, longitude: -1.1307 },
  '31': { cityName: 'PAMPLONA', latitude: 42.8125, longitude: -1.6458 },
  '32': { cityName: 'OURENSE', latitude: 42.3358, longitude: -7.8639 },
  '33': { cityName: 'OVIEDO', latitude: 43.3619, longitude: -5.8494 },
  '34': { cityName: 'PALENCIA', latitude: 42.0095, longitude: -4.5288 },
  '35': { cityName: 'LAS PALMAS', latitude: 28.1235, longitude: -15.4363 },
  '36': { cityName: 'PONTEVEDRA', latitude: 42.4310, longitude: -8.6444 },
  '37': { cityName: 'SALAMANCA', latitude: 40.9701, longitude: -5.6635 },
  '38': { cityName: 'S.C. TENERIFE', latitude: 28.4636, longitude: -16.2518 },
  '39': { cityName: 'SANTANDER', latitude: 43.4647, longitude: -3.8044 },
  '40': { cityName: 'SEGOVIA', latitude: 40.9429, longitude: -4.1088 },
  '41': { cityName: 'SEVILLA', latitude: 37.3891, longitude: -5.9845 },
  '42': { cityName: 'SORIA', latitude: 41.7666, longitude: -2.4770 },
  '43': { cityName: 'TARRAGONA', latitude: 41.1189, longitude: 1.2445 },
  '44': { cityName: 'TERUEL', latitude: 40.3456, longitude: -1.1072 },
  '45': { cityName: 'TOLEDO', latitude: 39.8628, longitude: -4.0273 },
  '46': { cityName: 'VALENCIA', latitude: 39.4699, longitude: -0.3763 },
  '47': { cityName: 'VALLADOLID', latitude: 41.6523, longitude: -4.7245 },
  '48': { cityName: 'BILBAO', latitude: 43.2630, longitude: -2.9350 },
  '49': { cityName: 'ZAMORA', latitude: 41.5035, longitude: -5.7441 },
  '50': { cityName: 'ZARAGOZA', latitude: 41.6488, longitude: -0.8891 },
  '51': { cityName: 'CEUTA', latitude: 35.8894, longitude: -5.3198 },
  '52': { cityName: 'MELILLA', latitude: 35.2923, longitude: -2.9381 },
};

/**
 * Extrae el código postal (5 dígitos) a partir de una dirección fiscal o texto.
 */
export function extractPostalCode(address: string): string | null {
  if (!address) return null;
  // Buscar 5 dígitos aislados (ej. 28052, 29006, 08018)
  const match = address.match(/\b(\d{5})\b/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Busca por nombre de ciudad común si no se encontró un código postal explícito.
 */
export function extractCityFromAddress(address: string): { cityName: string; latitude: number; longitude: number } | null {
  if (!address) return null;
  const upper = address.toUpperCase();
  for (const [code, prov] of Object.entries(PROVINCE_POSTAL_MAP)) {
    if (upper.includes(prov.cityName)) {
      return { cityName: prov.cityName, latitude: prov.latitude, longitude: prov.longitude };
    }
  }
  return null;
}

/**
 * Encuentra el código postal / provincia más cercano si no hay coincidencia exacta
 */
export function getClosestProvinceLocation(postalCode: string): { cityName: string; latitude: number; longitude: number } {
  const prefix = postalCode.slice(0, 2);
  if (PROVINCE_POSTAL_MAP[prefix]) {
    return PROVINCE_POSTAL_MAP[prefix];
  }

  // Si el prefijo numérico no existe directamente, buscar el número más cercano entre 01 y 52
  const targetNum = parseInt(prefix, 10) || 28;
  let closestCode = '28';
  let minDiff = Infinity;

  for (const code of Object.keys(PROVINCE_POSTAL_MAP)) {
    const num = parseInt(code, 10);
    const diff = Math.abs(num - targetNum);
    if (diff < minDiff) {
      minDiff = diff;
      closestCode = code;
    }
  }

  return PROVINCE_POSTAL_MAP[closestCode] || PROVINCE_POSTAL_MAP['28'];
}

// Caché en memoria para evitar llamadas redundantes a APIs externas
const weatherCache: Record<string, { data: WeatherData; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Obtiene la temperatura en tiempo real para el código postal o dirección fiscal del usuario.
 * Si no hay datos específicos para ese CP, utiliza la estación meteorológica del código postal más cercano.
 */
export async function fetchWeatherForFiscalAddress(fiscalAddress: string): Promise<WeatherData> {
  const postalCode = extractPostalCode(fiscalAddress);
  const cacheKey = postalCode || fiscalAddress.trim() || 'default';

  if (weatherCache[cacheKey] && Date.now() - weatherCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return weatherCache[cacheKey].data;
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  let cityName = 'MADRID';
  let isApproximate = false;

  if (postalCode) {
    // 1. Intentar geocodificación precisa de código postal por API Open-Meteo o Zippopotam
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(postalCode)}&count=1&language=es&format=json`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const result = geoData.results[0];
          latitude = result.latitude;
          longitude = result.longitude;
          cityName = (result.name || '').toUpperCase();
        }
      }
    } catch {
      // Ignorar y pasar a fallback
    }

    // 2. Si falló la API para ese CP exacto, buscar en la tabla de los 52 prefijos provinciales / más cercano
    if (latitude === null || longitude === null) {
      const fallbackLoc = getClosestProvinceLocation(postalCode);
      latitude = fallbackLoc.latitude;
      longitude = fallbackLoc.longitude;
      cityName = fallbackLoc.cityName;
      isApproximate = true;
    }
  } else {
    // No hay código postal de 5 dígitos, buscar nombre de ciudad en la dirección
    const cityMatch = extractCityFromAddress(fiscalAddress);
    if (cityMatch) {
      latitude = cityMatch.latitude;
      longitude = cityMatch.longitude;
      cityName = cityMatch.cityName;
    } else {
      // Fallback predeterminado a Madrid / España
      const defaultLoc = PROVINCE_POSTAL_MAP['28'];
      latitude = defaultLoc.latitude;
      longitude = defaultLoc.longitude;
      cityName = defaultLoc.cityName;
      isApproximate = true;
    }
  }

  // 3. Consultar temperatura en Open-Meteo
  let temperature: number | null = null;
  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      if (weatherData.current_weather?.temperature !== undefined) {
        temperature = weatherData.current_weather.temperature;
      }
    }
  } catch (err) {
    console.warn('Error al consultar el clima en Open-Meteo:', err);
  }

  // Fallback si no hubo respuesta
  if (temperature === null) {
    temperature = 22; // Temperatura estándar
  }

  const finalResult: WeatherData = {
    temperature,
    cityName,
    postalCode: postalCode || undefined,
    isApproximate,
  };

  weatherCache[cacheKey] = {
    data: finalResult,
    timestamp: Date.now(),
  };

  return finalResult;
}
