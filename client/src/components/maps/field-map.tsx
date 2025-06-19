import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Rectangle, CircleMarker, LayersControl, LayerGroup } from 'react-leaflet';
import { GeoJSONPolygon, Field } from '@shared/schema';
import './leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Corregir el problema de los iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Componente para WMS (una implementación simple y directa)
const WMSTileLayer = (props: any) => {
  return (
    <TileLayer
      url={props.url}
      attribution={props.attribution}
      opacity={props.opacity || 1}
    />
  );
};

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente para centrar el mapa en la ubicación
function SetMapView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Estilo base para todas las parcelas
const baseStyle = {
  weight: 2,
  opacity: 1,
  color: '#3388ff',
  fillOpacity: 0.3
};

// Estilo para la parcela seleccionada
const selectedStyle = {
  weight: 3,
  color: '#ff4500',
  dashArray: '',
  fillOpacity: 0.5
};

// Tipos para las propiedades del componente
interface FieldMapProps {
  fields: Field[];
  selectedField?: Field | null;
  onFieldSelect?: (field: Field) => void;
  readOnly?: boolean;
  height?: string;
  width?: string;
  className?: string;
}

export default function FieldMap({
  fields,
  selectedField,
  onFieldSelect,
  readOnly = false,
  height = '100%',
  width = '100%',
  className = ''
}: FieldMapProps) {
  const [center, setCenter] = useState<[number, number]>([39.862833, -4.028396]); // Centro de España por defecto
  const [zoom, setZoom] = useState(6);

  // Calcular los límites para encuadrar todas las parcelas
  const fieldBounds = useMemo(() => {
    const pointsArray: [number, number][] = [];
    
    fields.forEach(field => {
      if (field.latitud && field.longitud) {
        pointsArray.push([field.latitud, field.longitud]);
      } else if (field.geometria) {
        const geom = field.geometria as GeoJSONPolygon;
        if (geom.coordinates && geom.coordinates[0]) {
          geom.coordinates[0].forEach(coord => {
            // En GeoJSON, las coordenadas están en [longitud, latitud]
            pointsArray.push([coord[1], coord[0]]);
          });
        }
      }
    });
    
    return pointsArray.length > 0 ? pointsArray : null;
  }, [fields]);

  // Estimar centroide y zoom adecuados
  useEffect(() => {
    if (fieldBounds && fieldBounds.length > 0) {
      // Si hay una sola parcela o punto, centramos en ella
      if (fieldBounds.length === 1) {
        setCenter(fieldBounds[0]);
        setZoom(15);
      } else {
        // Calcular el centro aproximado de todas las parcelas
        const sumLat = fieldBounds.reduce((acc, curr) => acc + curr[0], 0);
        const sumLng = fieldBounds.reduce((acc, curr) => acc + curr[1], 0);
        setCenter([sumLat / fieldBounds.length, sumLng / fieldBounds.length]);
        setZoom(12); // Un zoom que permita ver varias parcelas
      }
    }
  }, [fieldBounds]);

  // Cuando cambia el campo seleccionado, centra el mapa en él
  useEffect(() => {
    if (selectedField && selectedField.latitud && selectedField.longitud) {
      setCenter([selectedField.latitud, selectedField.longitud]);
      setZoom(15); // Acerca el zoom al seleccionar un campo
    } else if (selectedField && selectedField.geometria) {
      const geom = selectedField.geometria as GeoJSONPolygon;
      if (geom.coordinates && geom.coordinates[0] && geom.coordinates[0].length > 0) {
        // Calcular el centroide del polígono
        let sumX = 0;
        let sumY = 0;
        geom.coordinates[0].forEach(coord => {
          sumX += coord[1]; // latitud
          sumY += coord[0]; // longitud
        });
        const centerLat = sumX / geom.coordinates[0].length;
        const centerLng = sumY / geom.coordinates[0].length;
        setCenter([centerLat, centerLng]);
        setZoom(15);
      }
    }
  }, [selectedField]);

  // Maneja el clic en un polígono de una parcela
  const handleFieldClick = (field: Field) => {
    if (onFieldSelect && !readOnly) {
      onFieldSelect(field);
    }
  };

  // Función para obtener el estilo de una parcela
  const getFieldStyle = (field: Field) => {
    if (selectedField && selectedField.id === field.id) {
      return selectedStyle;
    }
    return baseStyle;
  };

  // Verifica si hay campos con información geográfica
  const hasFieldsWithGeography = fields.some(field => 
    field.geometria || (field.latitud && field.longitud)
  );
  
  // Generar rectángulos para parcelas que no tienen geometría pero tienen dimensiones
  const generateRectangle = (field: Field): L.LatLngBoundsExpression | null => {
    if (field.latitud && field.longitud && !field.geometria) {
      // Calcular un rectángulo aproximado basado en el área de la parcela
      const areaInMeters = field.area || 10000; // Área en metros cuadrados
      const sideLength = Math.sqrt(areaInMeters); // Longitud de lado aproximada en metros
      
      // Convertir metros a grados (aproximación)
      // 1 grado de latitud ≈ 111 km
      // 1 grado de longitud a 40° N ≈ 85 km
      const latDelta = sideLength / 111000 / 2;
      const lngDelta = sideLength / 85000 / 2;
      
      return [
        [field.latitud - latDelta, field.longitud - lngDelta],
        [field.latitud + latDelta, field.longitud + lngDelta]
      ];
    }
    return null;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4">
        <CardTitle className="text-xl">Visualización de Parcelas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height, width }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '0 0 0.5rem 0.5rem' }}
          >
            <LayersControl position="topright">
              {/* Capas base */}
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              
              <LayersControl.BaseLayer name="Ortofoto PNOA">
                <TileLayer
                  attribution='&copy; <a href="https://www.ign.es/">Instituto Geográfico Nacional</a>'
                  url="https://www.ign.es/wmts/pnoa-ma?request=getTile&layer=OI.OrthoimageCoverage&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileCol={x}&TileRow={y}&format=image/jpeg"
                />
              </LayersControl.BaseLayer>
              
              {/* Capas adicionales */}
              <LayersControl.Overlay checked name="Parcelas SIGPAC">
                <WMSTileLayer
                  attribution='&copy; <a href="https://www.mapa.gob.es/es/">MAPA</a> - SIGPAC'
                  url="https://wms.mapama.gob.es/wms/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=PARCELA&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"
                  opacity={0.7}
                />
              </LayersControl.Overlay>
              
              <LayersControl.Overlay checked name="Recintos SIGPAC">
                <WMSTileLayer
                  attribution='&copy; <a href="https://www.mapa.gob.es/es/">MAPA</a> - SIGPAC'
                  url="https://wms.mapama.gob.es/wms/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=RECINTO&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"
                  opacity={0.6}
                />
              </LayersControl.Overlay>
              
              <LayersControl.Overlay name="Usos SIGPAC">
                <WMSTileLayer
                  attribution='&copy; <a href="https://www.mapa.gob.es/es/">MAPA</a> - SIGPAC'
                  url="https://wms.mapama.gob.es/wms/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=USO&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"
                  opacity={0.6}
                />
              </LayersControl.Overlay>
              
              <LayersControl.Overlay name="Municipios">
                <WMSTileLayer
                  attribution='&copy; <a href="https://www.mapa.gob.es/es/">MAPA</a> - SIGPAC'
                  url="https://wms.mapama.gob.es/wms/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=MUNICIPIOS&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"
                  opacity={0.4}
                />
              </LayersControl.Overlay>
              
              <LayersControl.Overlay name="Provincias">
                <WMSTileLayer
                  attribution='&copy; <a href="https://www.mapa.gob.es/es/">MAPA</a> - SIGPAC'
                  url="https://wms.mapama.gob.es/wms/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=PROVINCIAS&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}"
                  opacity={0.4}
                />
              </LayersControl.Overlay>
            </LayersControl>

            {/* Renderiza los GeoJSON de las parcelas si están disponibles */}
            {fields.map(field => {
              if (field.geometria) {
                return (
                  <GeoJSON
                    key={field.id}
                    data={field.geometria as GeoJSONPolygon}
                    style={() => getFieldStyle(field)}
                    onEachFeature={(_, layer) => {
                      layer.on({
                        click: () => handleFieldClick(field)
                      });
                      layer.bindPopup(`
                        <strong>${field.name}</strong><br>
                        Área: ${field.area} m²<br>
                        Cultivo: ${field.crop || 'No especificado'}<br>
                        Estado: ${field.status || 'No especificado'}
                      `);
                    }}
                  />
                );
              }
              return null;
            })}

            {/* Rectángulos para campos con coordenadas pero sin geometría GeoJSON */}
            {fields.map(field => {
              const bounds = generateRectangle(field);
              if (bounds) {
                return (
                  <Rectangle 
                    key={`rect-${field.id}`}
                    bounds={bounds}
                    pathOptions={{
                      color: selectedField && selectedField.id === field.id ? '#ff4500' : '#3388ff',
                      weight: selectedField && selectedField.id === field.id ? 3 : 2,
                      fillOpacity: 0.5,
                      fillColor: selectedField && selectedField.id === field.id ? '#ff7f50' : '#3388ff'
                    }}
                    eventHandlers={{
                      click: () => handleFieldClick(field)
                    }}
                  >
                    <Popup>
                      <div>
                        <h3 className="text-lg font-semibold">{field.name}</h3>
                        <p>Área: {field.area} m²</p>
                        {field.crop && <p>Cultivo: {field.crop}</p>}
                        <p>Estado: {field.status}</p>
                        {!readOnly && (
                          <Button
                            className="mt-2 w-full"
                            onClick={() => onFieldSelect && onFieldSelect(field)}
                          >
                            Seleccionar
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Rectangle>
                );
              }
              return null;
            })}

            {/* Marcadores para todos los campos con coordenadas */}
            {fields.map(field => {
              if (field.latitud && field.longitud) {
                return (
                  <CircleMarker 
                    key={`marker-${field.id}`}
                    center={[field.latitud, field.longitud]}
                    radius={selectedField && selectedField.id === field.id ? 6 : 4}
                    pathOptions={{
                      color: selectedField && selectedField.id === field.id ? '#ff4500' : '#3388ff',
                      fillColor: selectedField && selectedField.id === field.id ? '#ff7f50' : '#3388ff',
                      fillOpacity: 0.8
                    }}
                    eventHandlers={{
                      click: () => handleFieldClick(field)
                    }}
                  >
                    <Popup>
                      <div>
                        <h3 className="text-lg font-semibold">{field.name}</h3>
                        <p>Área: {field.area} m²</p>
                        {field.crop && <p>Cultivo: {field.crop}</p>}
                        <p>Estado: {field.status}</p>
                        {!readOnly && (
                          <Button
                            className="mt-2 w-full"
                            onClick={() => onFieldSelect && onFieldSelect(field)}
                          >
                            Seleccionar
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              }
              return null;
            })}

            {/* Actualizamos la vista según el centro seleccionado */}
            <SetMapView center={center} zoom={zoom} />
          </MapContainer>

          {/* Mensaje cuando no hay campos con información geográfica */}
          {!hasFieldsWithGeography && fields.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-[1000] text-center">
              <p className="text-gray-700">No hay parcelas con información geográfica.</p>
              <p className="text-sm text-gray-500 mt-1">Edite las parcelas para añadir coordenadas o geometría.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}