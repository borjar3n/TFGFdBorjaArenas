import { useState, useEffect } from 'react';
import { Field } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Loader2, ShieldAlert, Globe } from 'lucide-react';

interface SigpacViewerProps {
  field?: Field | null;
  height?: string;
  width?: string;
  className?: string;
}

export default function SigpacViewer({
  field,
  height = '600px',
  width = '100%',
  className = ''
}: SigpacViewerProps) {
  const [loading, setLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  
  // Construir URL SIGPAC completa basada en datos de la parcela
  const getSigpacUrl = () => {
    // URL base del visor de SIGPAC
    let baseUrl = "https://sigpac.mapama.gob.es/fega/visor/";
    
    // Si no hay campo seleccionado, devolvemos solo la URL base
    if (!field) return baseUrl;
    
    // Intenta construir URL con parámetros basados en datos disponibles
    let url = baseUrl;
    
    // Si tenemos datos catastrales específicos
    if (field.provincia && field.municipio && field.poligono && field.parcela) {
      // NOTA: Los parámetros exactos pueden variar según la API de SIGPAC
      url += `?provincia=${encodeURIComponent(field.provincia)}&municipio=${encodeURIComponent(field.municipio)}&poligono=${encodeURIComponent(String(field.poligono))}&parcela=${encodeURIComponent(String(field.parcela))}`;
      if (field.recinto) {
        url += `&recinto=${encodeURIComponent(String(field.recinto))}`;
      }
    } 
    // Si tenemos coordenadas 
    else if (field.latitud && field.longitud) {
      url += `?lat=${field.latitud}&lng=${field.longitud}&zoom=18`;
    }
    // Si tenemos referencia catastral
    else if (field.referenciaCatastral) {
      url += `?refcat=${encodeURIComponent(field.referenciaCatastral)}`;
    }
    
    return url;
  };

  useEffect(() => {
    // Actualizar la URL cuando cambia el campo seleccionado
    setIframeUrl(getSigpacUrl());
    setIframeError(false);
    setLoading(true);
  }, [field]);

  // Abrir SIGPAC en una nueva ventana
  const openInNewWindow = () => {
    const url = getSigpacUrl();
    window.open(url, '_blank');
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4 flex flex-row justify-between items-center">
        <CardTitle className="text-xl flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          {field ? `SIGPAC: ${field.name}` : 'Visor SIGPAC'}
        </CardTitle>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={openInNewWindow} 
          className="flex items-center"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir en SIGPAC
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription className="flex flex-col gap-4">
            <div>
              <p className="font-medium mb-2">El visor SIGPAC no permite ser integrado directamente en otras aplicaciones mediante iframe.</p>
              <p>Esto se debe a medidas de seguridad implementadas por el sitio oficial de SIGPAC (X-Frame-Options y Content-Security-Policy).</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="font-medium">Información de la parcela seleccionada:</p>
              
              {field ? (
                <div className="text-sm">
                  <p><strong>Nombre:</strong> {field.name}</p>
                  <p><strong>Área:</strong> {field.area} m²</p>
                  {field.provincia && field.municipio && (
                    <>
                      <p><strong>Provincia:</strong> {field.provincia}</p>
                      <p><strong>Municipio:</strong> {field.municipio}</p>
                      {field.poligono && <p><strong>Polígono:</strong> {field.poligono}</p>}
                      {field.parcela && <p><strong>Parcela:</strong> {field.parcela}</p>}
                      {field.recinto && <p><strong>Recinto:</strong> {field.recinto}</p>}
                    </>
                  )}
                  {field.latitud && field.longitud && (
                    <>
                      <p><strong>Coordenadas:</strong> {field.latitud}, {field.longitud}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm">No hay parcela seleccionada.</p>
              )}
            </div>
            
            <div>
              <Button 
                onClick={openInNewWindow} 
                className="w-full flex items-center justify-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir esta parcela en SIGPAC
              </Button>
              <p className="text-xs text-center mt-2">Se abrirá en una nueva ventana</p>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="bg-gray-100 rounded-lg p-6 text-center" style={{ height: height, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <ShieldAlert className="h-16 w-16 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">El visor SIGPAC no puede ser integrado</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Debido a restricciones de seguridad del sitio oficial, no es posible incrustar el visor SIGPAC directamente en esta aplicación.
          </p>
          
          <div className="flex gap-4">
            <Button variant="outline" size="lg" onClick={openInNewWindow}>
              <Globe className="mr-2 h-5 w-5" />
              Abrir SIGPAC
            </Button>
            
            <a 
              href="https://sigpac.mapama.gob.es/fega/visor/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 h-10 text-sm font-medium text-white"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Ir a SIGPAC oficial
            </a>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            SIGPAC (Sistema de Información Geográfica de Parcelas Agrícolas) es la herramienta oficial para la gestión de ayudas PAC.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}