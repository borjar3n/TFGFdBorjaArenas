import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, LayersControl, ScaleControl, WMSTileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import { Field, insertFieldSchema, FieldStatus } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, Plus, Map, Save, X } from 'lucide-react';
import './leaflet.css';
import L, { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

// URLs de servicios WMS y catastro
const PNOA_URL = 'https://www.ign.es/wms-inspire/pnoa-ma';
const CATASTRO_URL = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx';

// Componente para actualizar la vista del mapa cuando cambian las coordenadas
function MapUpdater({ center, zoom }: { center: LatLngExpression, zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

// Componente para manejar eventos del mapa
function MapClickHandler({ 
  onParcelClick 
}: { 
  onParcelClick: (e: LeafletMouseEvent) => void 
}) {
  const map = useMapEvents({
    click: (e) => {
      onParcelClick(e);
    }
  });
  
  return null;
}

// Tipo para representar la información de una parcela seleccionada
interface ParcelInfo {
  position: LatLngExpression;
  info: {
    referencia?: string;
    municipio?: string;
    provincia?: string;
    superficie?: number;
  };
}

interface SigpacWMSViewerProps {
  field?: Field | null;
  height?: string;
  width?: string;
  className?: string;
  onSaveField?: (field: Field) => void;
}

export default function SigpacWMSViewer({
  field,
  height = '600px',
  width = '100%',
  className = '',
  onSaveField
}: SigpacWMSViewerProps) {
  const { toast } = useToast();
  const [center, setCenter] = useState<LatLngExpression>([39.862833, -4.028396]); // Centro de España por defecto
  const [zoom, setZoom] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
  
  // Mutación para crear un nuevo campo
  const createFieldMutation = useMutation({
    mutationFn: async (data: Partial<Field>) => {
      const res = await apiRequest("POST", "/api/fields", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      toast({
        title: "Parcela guardada",
        description: "La parcela ha sido añadida correctamente a su perfil",
      });
      setSelectedParcel(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo guardar la parcela: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Actualizar centro y zoom cuando cambia el campo seleccionado
  useEffect(() => {
    if (field && field.latitud && field.longitud) {
      setIsLoading(true);
      setMapError(null);
      setCenter([field.latitud, field.longitud]);
      setZoom(15);
      
      // Simulamos tiempo de carga para tener feedback visual
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [field]);

  // Manejador para hacer clic en el mapa y buscar información de la parcela
  const handleParcelClick = useCallback(async (e: LeafletMouseEvent) => {
    try {
      setIsLoading(true);
      const { lat, lng } = e.latlng;
      
      // Obtener información geográfica real usando geocodificación inversa
      let provincia = '';
      let municipio = '';
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
          {
            headers: {
              'User-Agent': 'Sistema-Gestion-Agricola/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            provincia = data.address.state || data.address.province || '';
            municipio = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
          }
        }
      } catch (geoError) {
        console.warn('Error obteniendo información geográfica:', geoError);
        // Continuar sin información geográfica si falla
      }
      
      // Generar referencia aleatoria para la parcela
      const randomRef = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      setSelectedParcel({
        position: [lat, lng],
        info: {
          referencia: `P${randomRef}`,
          municipio: municipio || 'Sin especificar',
          provincia: provincia || 'Sin especificar',
          superficie: Math.floor(Math.random() * 10000) + 1000,
        }
      });
      
      setIsLoading(false);
      
      toast({
        title: "Parcela seleccionada",
        description: "Haga clic en 'Guardar parcela' para añadirla a su perfil",
      });
      
    } catch (error) {
      setMapError("Error al obtener información de la parcela");
      setIsLoading(false);
      console.error("Error fetching parcel info:", error);
    }
  }, [toast]);
  
  // Guardar la parcela seleccionada como un campo
  const saveSelectedParcel = useCallback(() => {
    if (!selectedParcel) return;
    
    const { position, info } = selectedParcel;
    const [lat, lng] = position as [number, number];
    
    createFieldMutation.mutate({
      name: `Parcela ${info.referencia || ''}`,
      area: info.superficie || 1000,
      crop: '',
      status: FieldStatus.PREPARATION,
      latitud: lat,
      longitud: lng,
      referenciaCatastral: info.referencia,
      municipio: info.municipio,
      provincia: info.provincia
    });
    
  }, [selectedParcel, createFieldMutation]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Visor Catastral
          {field && (
            <Badge variant="outline" className="ml-2">{field.name}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height, width, position: 'relative' }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '0 0 0.5rem 0.5rem' }}
          >
            <MapUpdater center={center} zoom={zoom} />
            <MapClickHandler onParcelClick={handleParcelClick} />
            
            <LayersControl position="topleft">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Ortofoto PNOA">
                <WMSTileLayer
                  url={PNOA_URL}
                  layers="OI.OrthoimageCoverage"
                  format="image/jpeg"
                  transparent={false}
                  attribution='&copy; <a href="https://www.ign.es/">Instituto Geográfico Nacional</a>'
                />
              </LayersControl.BaseLayer>
              
              <LayersControl.Overlay checked name="Catastro (Parcelas)">
                <WMSTileLayer
                  url={CATASTRO_URL}
                  layers="Catastro"
                  opacity={0.7}
                  format="image/png"
                  transparent={true}
                  version="1.1.1"
                  attribution='&copy; <a href="https://www.sedecatastro.gob.es/">Dirección General del Catastro</a>'
                />
              </LayersControl.Overlay>
            </LayersControl>
            
            {/* Marcador para la parcela seleccionada */}
            {selectedParcel && (
              <Marker position={selectedParcel.position}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-medium text-sm mb-1">Información de parcela</h3>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">Referencia:</span> {selectedParcel.info.referencia}</p>
                      <p><span className="font-medium">Municipio:</span> {selectedParcel.info.municipio}</p>
                      <p><span className="font-medium">Provincia:</span> {selectedParcel.info.provincia}</p>
                      <p><span className="font-medium">Superficie:</span> {selectedParcel.info.superficie} m²</p>
                    </div>
                    <Button 
                      className="w-full mt-2" 
                      size="sm"
                      onClick={saveSelectedParcel}
                      disabled={createFieldMutation.isPending}
                    >
                      {createFieldMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Guardar parcela
                    </Button>
                  </div>
                </Popup>
              </Marker>
            )}
            
            <ScaleControl position="bottomleft" imperial={false} />
          </MapContainer>

          {/* Estado de carga */}
          {isLoading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-4 rounded-lg shadow-md z-[1000] text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-gray-700">Cargando mapa de parcelas...</p>
            </div>
          )}

          {/* Mensaje de selección */}
          {!field && !selectedParcel && !isLoading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-4 rounded-lg shadow-md z-[1000] text-center">
              <p className="text-gray-700">Haga clic en cualquier parcela para seleccionarla</p>
            </div>
          )}

          {/* Error en el mapa */}
          {mapError && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%]">
              <Alert variant="destructive">
                <AlertDescription>{mapError}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Instrucciones de uso */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 p-2 rounded-lg shadow-sm text-xs text-gray-600">
            <div className="space-y-1">
              <p>• Haga clic en el mapa para seleccionar una parcela</p>
              <p>• Use los controles para activar/desactivar capas</p>
              {selectedParcel && (
                <p>• Pulse en el marcador para ver detalles</p>
              )}
            </div>
          </div>
          
          {/* Barra de herramientas */}
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md">
            <div className="p-1 flex flex-row gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Limpiar selección"
                onClick={() => setSelectedParcel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              {selectedParcel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  title="Guardar parcela seleccionada"
                  onClick={saveSelectedParcel}
                  disabled={createFieldMutation.isPending}
                >
                  {createFieldMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}