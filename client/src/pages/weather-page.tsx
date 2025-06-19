import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSun, 
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Gauge,
  RefreshCw,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Field } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import CompanySelector from "@/components/layout/company-selector";

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    visibility: number;
    wind_speed: number;
    wind_direction: number;
    weather_code: number;
    weather_description: string;
  };
  forecast: Array<{
    date: string;
    temperature_max: number;
    temperature_min: number;
    weather_code: number;
    weather_description: string;
    precipitation: number;
  }>;
  lastUpdated: string;
}

function getWeatherIcon(weatherCode: number, size: "sm" | "md" | "lg" = "md") {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8";
  
  // WMO Weather interpretation codes
  if (weatherCode <= 1) return <Sun className={`${iconSize} text-yellow-500`} />;
  if (weatherCode <= 3) return <CloudSun className={`${iconSize} text-yellow-400`} />;
  if (weatherCode <= 48) return <Cloud className={`${iconSize} text-gray-500`} />;
  if (weatherCode <= 67 || (weatherCode >= 80 && weatherCode <= 82)) return <CloudRain className={`${iconSize} text-blue-500`} />;
  return <Cloud className={`${iconSize} text-gray-500`} />;
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

async function fetchWeatherData(lat: number, lon: number, locationName: string): Promise<WeatherData> {
  const currentResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe/Madrid&forecast_days=5`
  );
  
  if (!currentResponse.ok) {
    throw new Error('Error al obtener datos meteorológicos');
  }
  
  const data = await currentResponse.json();
  
  return {
    location: locationName,
    current: {
      temperature: Math.round(data.current.temperature_2m),
      feels_like: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      pressure: Math.round(data.current.surface_pressure),
      visibility: Math.round(data.current.visibility / 1000), // Convert to km
      wind_speed: Math.round(data.current.wind_speed_10m * 3.6), // Convert to km/h
      wind_direction: data.current.wind_direction_10m,
      weather_code: data.current.weather_code,
      weather_description: getWeatherDescription(data.current.weather_code)
    },
    forecast: data.daily.time.slice(1, 5).map((date: string, index: number) => ({
      date,
      temperature_max: Math.round(data.daily.temperature_2m_max[index + 1]),
      temperature_min: Math.round(data.daily.temperature_2m_min[index + 1]),
      weather_code: data.daily.weather_code[index + 1],
      weather_description: getWeatherDescription(data.daily.weather_code[index + 1]),
      precipitation: data.daily.precipitation_sum[index + 1] || 0
    })),
    lastUpdated: new Date().toISOString()
  };
}

function WeatherCard({ field, weatherData, isLoading, onRefresh }: {
  field: Field;
  weatherData?: WeatherData;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            {field.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Cargando datos meteorológicos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            {field.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-gray-600 text-center mb-3">No se pudieron cargar los datos meteorológicos</p>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {field.name}
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{field.provincia}, {field.municipio}</span>
          <Badge variant="outline">{field.area} m²</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weatherData.current.weather_code, "lg")}
            <div>
              <p className="text-3xl font-bold">{weatherData.current.temperature}°C</p>
              <p className="text-sm text-gray-600">{weatherData.current.weather_description}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Sensación térmica</p>
            <p className="font-medium">{weatherData.current.feels_like}°C</p>
          </div>
        </div>

        <Separator />

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span>Humedad: {weatherData.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span>Viento: {weatherData.current.wind_speed} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-500" />
            <span>Presión: {weatherData.current.pressure} hPa</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-500" />
            <span>Visibilidad: {weatherData.current.visibility} km</span>
          </div>
        </div>

        <Separator />

        {/* 4-Day Forecast */}
        <div>
          <h4 className="font-medium text-sm mb-3">Pronóstico 4 días</h4>
          <div className="grid grid-cols-4 gap-2">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-gray-600 mb-1">
                  {format(new Date(day.date), 'EEE', { locale: es })}
                </p>
                <div className="flex justify-center mb-1">
                  {getWeatherIcon(day.weather_code, "sm")}
                </div>
                <p className="text-xs font-medium">{day.temperature_max}°</p>
                <p className="text-xs text-gray-500">{day.temperature_min}°</p>
                {day.precipitation > 0 && (
                  <p className="text-xs text-blue-600">{day.precipitation}mm</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Actualizado: {format(new Date(weatherData.lastUpdated), 'HH:mm', { locale: es })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WeatherPage() {
  const [, setLocation] = useLocation();
  const [weatherData, setWeatherData] = useState<Map<number, WeatherData>>(new Map());
  const [loadingFields, setLoadingFields] = useState<Set<number>>(new Set());

  // Query for fields
  const fieldsQuery = useQuery<Field[]>({
    queryKey: ["/api/fields"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loadWeatherForField = async (field: Field) => {
    if (!field.latitud || !field.longitud) return;
    
    setLoadingFields(prev => new Set(prev).add(field.id));
    
    try {
      const weather = await fetchWeatherData(
        field.latitud, 
        field.longitud, 
        `${field.municipio}, ${field.provincia}`
      );
      
      setWeatherData(prev => new Map(prev).set(field.id, weather));
    } catch (error) {
      console.error(`Error loading weather for field ${field.id}:`, error);
    } finally {
      setLoadingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field.id);
        return newSet;
      });
    }
  };

  // Load weather data for all fields when they are available
  useEffect(() => {
    if (fieldsQuery.data) {
      fieldsQuery.data.forEach(field => {
        if (field.latitud && field.longitud && !weatherData.has(field.id)) {
          loadWeatherForField(field);
        }
      });
    }
  }, [fieldsQuery.data, weatherData]);

  const refreshAllWeather = () => {
    if (fieldsQuery.data) {
      setWeatherData(new Map());
      fieldsQuery.data.forEach(field => {
        if (field.latitud && field.longitud) {
          loadWeatherForField(field);
        }
      });
    }
  };

  if (fieldsQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Cargando parcelas...</span>
        </div>
      </div>
    );
  }

  const fieldsWithCoordinates = fieldsQuery.data?.filter(field => field.latitud && field.longitud) || [];
  const fieldsWithoutCoordinates = fieldsQuery.data?.filter(field => !field.latitud || !field.longitud) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Selector */}
      <CompanySelector />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Información Meteorológica</h1>
              <p className="text-gray-600 mt-1">
                Condiciones meteorológicas actuales y pronóstico para sus parcelas
              </p>
            </div>
            </div>
          <Button variant="outline" onClick={refreshAllWeather}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar todo
          </Button>
        </div>
      </div>

      {fieldsWithCoordinates.length === 0 && fieldsWithoutCoordinates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay parcelas registradas</h3>
            <p className="text-gray-600 text-center">
              Registre parcelas en la sección de Campos para ver información meteorológica
            </p>
          </CardContent>
        </Card>
      )}

      {fieldsWithCoordinates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {fieldsWithCoordinates.map(field => (
            <WeatherCard
              key={field.id}
              field={field}
              weatherData={weatherData.get(field.id)}
              isLoading={loadingFields.has(field.id)}
              onRefresh={() => loadWeatherForField(field)}
            />
          ))}
        </div>
      )}

      {fieldsWithoutCoordinates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Parcelas sin coordenadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Las siguientes parcelas no tienen coordenadas geográficas y no pueden mostrar información meteorológica:
            </p>
            <div className="space-y-2">
              {fieldsWithoutCoordinates.map(field => (
                <div key={field.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{field.name}</span>
                  <Badge variant="outline" className="ml-auto">Sin coordenadas</Badge>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Edite estas parcelas para añadir coordenadas geográficas y poder mostrar información meteorológica.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}