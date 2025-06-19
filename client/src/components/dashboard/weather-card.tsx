import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSun, 
  MapPin,
  Thermometer,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Field } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

interface WeatherSummary {
  location: string;
  temperature: number;
  conditions: string;
  weatherCode: number;
  forecast: Array<{
    date: string;
    temperature_max: number;
    temperature_min: number;
    weather_code: number;
  }>;
}

function getWeatherIcon(weatherCode: number, size: "sm" | "lg" = "lg") {
  const className = size === "lg" ? "h-10 w-10 text-blue-500" : "h-5 w-5 text-blue-500";
  
  // WMO Weather interpretation codes
  if (weatherCode <= 1) return <Sun className={className} />;
  if (weatherCode <= 3) return <CloudSun className={className} />;
  if (weatherCode <= 48) return <Cloud className={className} />;
  if (weatherCode <= 67 || (weatherCode >= 80 && weatherCode <= 82)) return <CloudRain className={className} />;
  return <Cloud className={className} />;
}

function getWeatherDescription(weatherCode: number): string {
  const descriptions: { [key: number]: string } = {
    0: "Despejado",
    1: "Principalmente despejado",
    2: "Parcialmente nublado", 
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna intensa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia intensa",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos intensos",
    95: "Tormenta",
    96: "Tormenta con granizo ligero",
    99: "Tormenta con granizo intenso"
  };
  return descriptions[weatherCode] || "Desconocido";
}

async function fetchWeatherForField(field: Field): Promise<WeatherSummary | null> {
  if (!field.latitud || !field.longitud) return null;
  
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${field.latitud}&longitude=${field.longitud}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/Madrid&forecast_days=4`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      location: `${field.municipio}, ${field.provincia}`,
      temperature: Math.round(data.current.temperature_2m),
      conditions: getWeatherDescription(data.current.weather_code),
      weatherCode: data.current.weather_code,
      forecast: data.daily.time.slice(1, 4).map((date: string, index: number) => ({
        date,
        temperature_max: Math.round(data.daily.temperature_2m_max[index + 1]),
        temperature_min: Math.round(data.daily.temperature_2m_min[index + 1]),
        weather_code: data.daily.weather_code[index + 1]
      }))
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

export default function WeatherCard() {
  const [, navigate] = useLocation();
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Query for fields data
  const fieldsQuery = useQuery<Field[]>({
    queryKey: ["/api/fields"],
  });

  // Load weather for the first field with coordinates
  useEffect(() => {
    async function loadWeather() {
      if (!fieldsQuery.data || fieldsQuery.isLoading) return;

      const fieldWithCoords = fieldsQuery.data.find(field => field.latitud && field.longitud);
      if (!fieldWithCoords) {
        setIsLoading(false);
        return;
      }

      const weather = await fetchWeatherForField(fieldWithCoords);
      setWeatherSummary(weather);
      setIsLoading(false);
    }

    loadWeather();
  }, [fieldsQuery.data, fieldsQuery.isLoading]);

  // Format date for forecast
  const formatForecastDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEE", { locale: es });
  };

  if (isLoading || fieldsQuery.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Información Meteorológica</h3>
          <button 
            onClick={() => navigate('/weather')}
            className="text-primary text-sm font-medium hover:underline focus:outline-none"
          >
            Ver detalles
          </button>
        </div>
        <div className="bg-blue-50 rounded-md p-3 mb-4 animate-pulse">
          <div className="h-16 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weatherSummary) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Información Meteorológica</h3>
          <button 
            onClick={() => navigate('/weather')}
            className="text-primary text-sm font-medium hover:underline focus:outline-none"
          >
            Ver detalles
          </button>
        </div>
        <div className="bg-gray-50 rounded-md p-3 mb-4 text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No hay datos meteorológicos disponibles
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Agregue coordenadas a sus parcelas para ver el clima
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Información Meteorológica</h3>
        <button 
          onClick={() => navigate('/weather')}
          className="text-primary text-sm font-medium hover:underline focus:outline-none"
        >
          Ver detalles
        </button>
      </div>
      
      <div className="bg-blue-50 rounded-md p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{weatherSummary.location}</p>
            <p className="text-2xl font-bold text-gray-800">{weatherSummary.temperature}°C</p>
            <p className="text-xs text-gray-600">{weatherSummary.conditions}</p>
          </div>
          {getWeatherIcon(weatherSummary.weatherCode)}
        </div>
        <div className="grid grid-cols-3 mt-3 text-center gap-2">
          {weatherSummary.forecast.map((day, index) => (
            <div key={index}>
              <p className="text-xs text-gray-600">{formatForecastDate(day.date)}</p>
              {getWeatherIcon(day.weather_code, "sm")}
              <p className="text-xs font-medium">{day.temperature_max}°/{day.temperature_min}°</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <button 
          onClick={() => navigate('/weather')}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Cloud className="h-4 w-4 mr-2" />
          Ver pronóstico completo
        </button>
      </div>
    </div>
  );
}