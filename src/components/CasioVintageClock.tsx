import React, { useEffect, useState } from 'react';
import { fetchWeatherForFiscalAddress, WeatherData } from '../services/weatherService';

interface CasioVintageClockProps {
  isLightBackground?: boolean;
  fiscalAddress?: string;
}

// Componente SVG para un solo dígito de 7 segmentos con estilo Casio vintage
const SevenSegmentDigit: React.FC<{
  char: string;
  color: string;
  className?: string;
  size?: 'normal' | 'large';
}> = ({ char, color, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ color }}>
      <span className="absolute inset-0 text-current opacity-10 blur-[1px]">8</span>
      <span className="relative z-10 text-current drop-shadow-[0_0_8px_currentColor]">{char}</span>
    </div>
  );
};

const SevenSegmentAmPm: React.FC<{
  isPm: boolean;
  color: string;
  className?: string;
}> = ({ isPm, color, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ color }}>
      <span className="absolute inset-0 text-current opacity-10 blur-[1px]">~~</span>
      <span className="relative z-10 text-current drop-shadow-[0_0_8px_currentColor]">
        {isPm ? 'PM' : 'AM'}
      </span>
    </div>
  );
};

// Función para determinar el color de temperatura según los rangos solicitados por el usuario
export function getTemperatureColor(temp: number | null): string {
  if (temp === null) return '#22C55E';
  if (temp < 10) return '#F0F9FF'; // menos de 10 grados: blanco glaciar
  if (temp < 15) return '#38BDF8'; // menos de 15 grados C: celeste
  if (temp < 20) return '#2563EB'; // menos de 20 grados: azul
  if (temp < 30) return '#22C55E'; // menos de 30 grados: verde
  if (temp < 35) return '#F97316'; // menos de 35 grados: naranja
  return '#EF4444'; // más de 35 grados: rojo
}

export const CasioVintageClock: React.FC<CasioVintageClockProps> = ({ 
  isLightBackground = false,
  fiscalAddress = 'Polígono Industrial Las Eras, Nave 14, 28052 Madrid, España'
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherData>({
    temperature: null,
    cityName: 'MADRID',
  });

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Consultar temperatura en tiempo real del código postal correspondiente a los datos fiscales
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      try {
        const data = await fetchWeatherForFiscalAddress(fiscalAddress);
        if (isMounted) {
          setWeather(data);
        }
      } catch (err) {
        console.warn('Error al cargar previsión meteorológica:', err);
      }
    };

    loadWeather();
    const weatherTimer = setInterval(loadWeather, 15 * 60 * 1000); // cada 15 min
    return () => {
      isMounted = false;
      clearInterval(weatherTimer);
    };
  }, [fiscalAddress]);

  // Color del reloj digital CASIO vintage
  const clockColor = isLightBackground ? '#1E293B' : '#FAF5DA';

  const hours24 = time.getHours();
  const isPm = hours24 >= 12;
  const hours12 = hours24 % 12 || 12;
  const hoursStr = hours12.toString().padStart(2, '0');
  const minutesStr = time.getMinutes().toString().padStart(2, '0');
  const secondsStr = time.getSeconds().toString().padStart(2, '0');

  // Formato de fecha solicitado: Dia, número día, mes, últimos dos dígitos del año.
  // Ejemplo: "Viernes, 18 de Septiembre 26"
  const formatDateCasio = (d: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const monthName = months[d.getMonth()];
    const yearShort = d.getFullYear().toString().slice(-2);
    return `${dayName}, ${dayNum} de ${monthName} ${yearShort}`;
  };

  const tempColor = getTemperatureColor(weather.temperature);

  return (
    <div className="w-full flex flex-col items-center select-none pt-0">
      {/* Importar fuentes DSEG y tipografía estilizada alta para la fecha */}
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/css/dseg.css');
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
        .font-casio-dseg {
          font-family: 'DSEG7-Classic', monospace;
        }
        .font-casio-letters {
          font-family: 'DSEG14-Classic', 'DSEG7-Classic', monospace;
        }
        .font-date-tall {
          font-family: 'Barlow Condensed', 'Oswald', 'Teko', 'Arial Narrow', sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      {/* RELOJ DIGITAL CASIO VINTAGE:
          - Centrado arriba a 10px del borde superior
      */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4">
        {/* LADO IZQUIERDO: PM o AM en 7 segmentos, simétrico al segundero */}
        <div className="w-8 sm:w-12 md:w-14 flex justify-end items-center">
          <div className="flex flex-col items-center">
            <SevenSegmentAmPm
              isPm={isPm}
              color={clockColor}
              className="text-xs sm:text-sm md:text-base font-casio-letters"
            />
          </div>
        </div>

        {/* CENTRO: HORAS (2 dígitos) : MINUTOS (2 dígitos) en 7 segmentos */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Horas */}
          <SevenSegmentDigit
            char={hoursStr[0]}
            color={clockColor}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-casio-dseg leading-none"
          />
          <SevenSegmentDigit
            char={hoursStr[1]}
            color={clockColor}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-casio-dseg leading-none"
          />

          {/* Dos puntos separadores parpadeantes */}
          <div
            className="flex flex-col justify-center items-center gap-1.5 sm:gap-2.5 px-0.5 sm:px-1 animate-pulse"
          >
            <div
              className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-xs"
              style={{ backgroundColor: clockColor, boxShadow: `0 0 6px ${clockColor}80` }}
            />
            <div
              className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-xs"
              style={{ backgroundColor: clockColor, boxShadow: `0 0 6px ${clockColor}80` }}
            />
          </div>

          {/* Minutos */}
          <SevenSegmentDigit
            char={minutesStr[0]}
            color={clockColor}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-casio-dseg leading-none"
          />
          <SevenSegmentDigit
            char={minutesStr[1]}
            color={clockColor}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-casio-dseg leading-none"
          />
        </div>

        {/* LADO DERECHO: SEGUNDERO (2 dígitos) en 7 segmentos, simétrico a AM/PM */}
        <div className="w-8 sm:w-12 md:w-14 flex justify-start items-center">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <SevenSegmentDigit
              char={secondsStr[0]}
              color={clockColor}
              className="text-base sm:text-2xl md:text-3xl font-casio-dseg leading-none"
            />
            <SevenSegmentDigit
              char={secondsStr[1]}
              color={clockColor}
              className="text-base sm:text-2xl md:text-3xl font-casio-dseg leading-none"
            />
          </div>
        </div>
      </div>

      {/* DEBAJO DE LA HORA:
          - A la izquierda: Fecha en formato "Viernes, 18 de Septiembre 26", tamaño multiplicado x1.2
          - A la derecha: Ciudad y Temperatura del código postal fiscal, tamaño multiplicado x1.2 con aire de 10px a la derecha
      */}
      <div className="w-full max-w-4xl mx-auto mt-2 sm:mt-3 px-3 sm:px-6 flex items-end justify-between gap-3">
        {/* Izquierda: Fecha con tipografía estilizada, tamaño de ancho x1.1 */}
        <div className="text-left overflow-hidden">
          <span
            className="block text-base sm:text-lg md:text-xl lg:text-2xl font-semibold font-date-tall tracking-wider uppercase whitespace-nowrap"
            style={{
              color: clockColor,
              textShadow: !isLightBackground ? `0 0 10px ${clockColor}40` : 'none',
              letterSpacing: '0.06em',
              transform: 'scaleX(1.1)',
              transformOrigin: 'left',
            }}
          >
            {formatDateCasio(time)}
          </span>
        </div>

        {/* Derecha: Ciudad y Temperatura del CP de los datos fiscales x1.2 */}
        <div className="shrink-0 text-right pr-[10px]">
          <span className="block text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-extrabold uppercase tracking-widest text-[#94A3B8]">
            {weather.cityName}
          </span>
          <span
            className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-mono tracking-tight leading-none mt-0.5"
            style={{
              color: tempColor,
              textShadow: `0 0 12px ${tempColor}66`,
            }}
          >
            {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : '--°'}
          </span>
        </div>
      </div>
    </div>
  );
};
