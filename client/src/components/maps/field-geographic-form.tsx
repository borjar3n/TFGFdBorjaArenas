import { useState, useEffect } from "react";
import { Field } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Link, MapPin, ExternalLink, Upload } from "lucide-react";

// Esquema para los datos catastrales y geográficos
const geoDataSchema = z.object({
  // Datos catastrales
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  poligono: z.string().optional(),
  parcela: z.string().optional(),
  recinto: z.string().optional(),
  referenciaCatastral: z.string().optional(),
  
  // Coordenadas
  latitud: z.union([
    z.string().transform(str => {
      const num = parseFloat(str);
      return isNaN(num) ? undefined : num;
    }),
    z.number(),
    z.undefined()
  ]).optional(),
  longitud: z.union([
    z.string().transform(str => {
      const num = parseFloat(str);
      return isNaN(num) ? undefined : num;
    }),
    z.number(),
    z.undefined()
  ]).optional(),
  altitud: z.union([
    z.string().transform(str => {
      const num = parseFloat(str);
      return isNaN(num) ? undefined : num;
    }),
    z.number(),
    z.undefined()
  ]).optional(),
});

type GeoDataFormValues = z.infer<typeof geoDataSchema>;

interface FieldGeographicFormProps {
  field: Field;
  onSave: (data: Partial<Field>) => void;
  isLoading?: boolean;
}

export default function FieldGeographicForm({ field, onSave, isLoading = false }: FieldGeographicFormProps) {
  const [geoJsonFile, setGeoJsonFile] = useState<File | null>(null);
  const [isGeneratingLocation, setIsGeneratingLocation] = useState(false);

  // Get coordinates for a specific location using Nominatim search
  const getCoordinatesForLocation = async (location: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=es&countrycodes=es`,
        {
          headers: {
            'User-Agent': 'Sistema-Gestion-Agricola/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error en la API de geocodificación');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: Number(parseFloat(result.lat).toFixed(6)),
          lon: Number(parseFloat(result.lon).toFixed(6))
        };
      }
      
      throw new Error('No se encontraron coordenadas para esta ubicación');
    } catch (error) {
      console.error('Error obteniendo coordenadas:', error);
      throw error;
    }
  };

  // Get location info from coordinates using Nominatim
  const getLocationFromCoordinates = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=es`,
        {
          headers: {
            'User-Agent': 'Sistema-Gestion-Agricola/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error en la API de geocodificación');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        return {
          provincia: address.state || address.province || '',
          municipio: address.city || address.town || address.village || address.municipality || ''
        };
      }
      
      return { provincia: '', municipio: '' };
    } catch (error) {
      console.warn('Error obteniendo información geográfica:', error);
      return { provincia: '', municipio: '' };
    }
  };

  // Form para los datos catastrales y geográficos
  const form = useForm<GeoDataFormValues>({
    resolver: zodResolver(geoDataSchema),
    defaultValues: {
      provincia: field.provincia || '',
      municipio: field.municipio || '',
      poligono: field.poligono || '',
      parcela: field.parcela || '',
      recinto: field.recinto || '',
      referenciaCatastral: field.referenciaCatastral || '',
      latitud: field.latitud || undefined,
      longitud: field.longitud || undefined,
      altitud: field.altitud || undefined,
    },
  });

  // Actualizar el formulario cuando cambie la parcela
  useEffect(() => {
    form.reset({
      provincia: field.provincia || '',
      municipio: field.municipio || '',
      poligono: field.poligono || '',
      parcela: field.parcela || '',
      recinto: field.recinto || '',
      referenciaCatastral: field.referenciaCatastral || '',
      latitud: field.latitud || undefined,
      longitud: field.longitud || undefined,
      altitud: field.altitud || undefined,
    });
  }, [field, form]);

  // Abrir SIGPAC en una nueva ventana para la parcela seleccionada
  const openSigpacViewer = () => {
    const { provincia, municipio, poligono, parcela, recinto } = form.getValues();
    
    if (provincia && municipio && poligono && parcela) {
      const url = `https://sigpac.mapama.gob.es/fega/visor/`;
      window.open(url, '_blank');
    } else {
      alert('Por favor, introduce al menos provincia, municipio, polígono y parcela.');
    }
  };

  // Geocodificación manual bajo demanda
  const handleManualGeocode = async () => {
    const currentLat = form.getValues('latitud');
    const currentLon = form.getValues('longitud');
    
    if (currentLat && currentLon && !isGeneratingLocation) {
      setIsGeneratingLocation(true);
      try {
        const locationInfo = await getLocationFromCoordinates(currentLat, currentLon);
        
        // Actualizar provincia y municipio
        form.setValue('provincia', locationInfo.provincia || '');
        form.setValue('municipio', locationInfo.municipio || '');
        
        // Guardar los datos
        onSave({
          latitud: currentLat,
          longitud: currentLon,
          provincia: locationInfo.provincia,
          municipio: locationInfo.municipio
        });
      } catch (error) {
        console.warn('Error obteniendo información geográfica:', error);
      } finally {
        setIsGeneratingLocation(false);
      }
    }
  };

  // Manejar el submit del formulario
  const onSubmit = (data: GeoDataFormValues) => {
    onSave(data);
  };

  // Manejar la subida de archivo GeoJSON
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGeoJsonFile(file);
    try {
      const text = await file.text();
      const geoJson = JSON.parse(text);
      
      // Verificar que sea un GeoJSON válido con un polígono
      if (geoJson.type === 'Feature' && geoJson.geometry.type === 'Polygon') {
        onSave({ 
          geometria: geoJson.geometry 
        });
      } else if (geoJson.type === 'Polygon') {
        onSave({ 
          geometria: {
            type: 'Polygon',
            coordinates: geoJson.coordinates
          } 
        });
      } else {
        alert('El archivo debe contener un polígono GeoJSON válido.');
      }
    } catch (error) {
      console.error('Error al procesar el archivo GeoJSON:', error);
      alert('Error al procesar el archivo. Comprueba que es un GeoJSON válido.');
    }
  };

  return (
    <TabsContent value="geographic" className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Información Geográfica y Catastral</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center mb-2">
                  <MapPin className="mr-2 h-5 w-5" />
                  Datos Catastrales
                </h3>
                <Separator className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provincia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <FormControl>
                          <Input placeholder="Provincia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Municipio</FormLabel>
                        <FormControl>
                          <Input placeholder="Municipio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="poligono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Polígono</FormLabel>
                        <FormControl>
                          <Input placeholder="Polígono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parcela"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcela</FormLabel>
                        <FormControl>
                          <Input placeholder="Parcela" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recinto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recinto</FormLabel>
                        <FormControl>
                          <Input placeholder="Recinto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenciaCatastral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencia Catastral</FormLabel>
                        <FormControl>
                          <Input placeholder="Referencia Catastral" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={openSigpacViewer}
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir en SIGPAC
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium flex items-center mt-6 mb-2">
                  <Link className="mr-2 h-5 w-5" />
                  Coordenadas Geográficas
                </h3>
                <Separator className="mb-4" />

                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleManualGeocode}
                    disabled={isGeneratingLocation || !form.getValues('latitud') || !form.getValues('longitud')}
                    className="flex items-center"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {isGeneratingLocation ? 'Obteniendo ubicación...' : 'Obtener provincia y municipio'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Usa las coordenadas ingresadas para obtener automáticamente la provincia y municipio
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="latitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ej. 39.862833" 
                            step="any"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ej. -4.028396" 
                            step="any"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="altitud"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altitud (m)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ej. 650" 
                            step="any"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium flex items-center mt-6 mb-2">
                  <Upload className="mr-2 h-5 w-5" />
                  Subir Geometría
                </h3>
                <Separator className="mb-4" />

                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sube un archivo GeoJSON que contenga la geometría de la parcela. 
                    Puedes exportarlo desde SIGPAC o dibujarlo en herramientas como GeoJSON.io.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleFileUpload}
                    className="max-w-md"
                  />
                  <div className="text-sm text-gray-500">
                    {geoJsonFile && geoJsonFile.name}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}