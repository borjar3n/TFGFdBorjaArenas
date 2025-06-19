import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Users, 
  MapPin, 
  Package, 
  CheckSquare, 
  BarChart3, 
  FileText, 
  Settings,
  Mail,
  Phone,
  Globe
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
        <p className="text-muted-foreground">
          Encuentra respuestas a las preguntas más frecuentes sobre el sistema de gestión agrícola
        </p>
      </div>

      {/* Guía de inicio rápido */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Guía de Inicio Rápido
          </CardTitle>
          <CardDescription>
            Primeros pasos para usar la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">1</Badge>
                <span>Configura tu perfil y empresa</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">2</Badge>
                <span>Registra tus parcelas y campos</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">3</Badge>
                <span>Añade inventario inicial</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">4</Badge>
                <span>Crea tareas y planifica actividades</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">5</Badge>
                <span>Registra datos de producción</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">6</Badge>
                <span>Analiza tus resultados</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preguntas frecuentes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
          <CardDescription>
            Respuestas a las consultas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="company">
              <AccordionTrigger className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gestión de Empresas
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">¿Cómo crear una nueva empresa?</h4>
                  <p className="text-sm text-muted-foreground">
                    Ve a la sección Empresas y haz clic en "Nueva Empresa". Completa los datos básicos 
                    como nombre, descripción y dirección.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">¿Cómo invitar usuarios a mi empresa?</h4>
                  <p className="text-sm text-muted-foreground">
                    En la gestión de empresas, genera códigos de invitación con los permisos específicos 
                    que quieras otorgar. Comparte el código con los usuarios que quieras invitar.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fields">
              <AccordionTrigger className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Gestión de Parcelas
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">¿Cómo registrar una parcela?</h4>
                  <p className="text-sm text-muted-foreground">
                    Usa la referencia catastral española para registrar automáticamente los datos 
                    oficiales de la parcela, incluyendo coordenadas y superficie.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">¿Qué información puedo registrar por parcela?</h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes registrar el tipo de cultivo, superficie, estado, coordenadas geográficas 
                    y notas adicionales sobre cada parcela.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="inventory">
              <AccordionTrigger className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Control de Inventario
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">¿Qué tipos de inventario puedo gestionar?</h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes gestionar semillas, fertilizantes, pesticidas y equipamiento agrícola. 
                    Cada tipo tiene campos específicos para su gestión.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">¿Cómo configurar alertas de stock bajo?</h4>
                  <p className="text-sm text-muted-foreground">
                    Al crear un elemento de inventario, establece la cantidad mínima. El sistema 
                    te alertará cuando el stock esté por debajo de este nivel.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tasks">
              <AccordionTrigger className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Gestión de Tareas
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">¿Cómo asignar tareas a otros usuarios?</h4>
                  <p className="text-sm text-muted-foreground">
                    Al crear una tarea, selecciona el usuario responsable en el campo "Asignado a". 
                    Solo verás usuarios de tu empresa actual.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">¿Cómo hacer seguimiento del progreso?</h4>
                  <p className="text-sm text-muted-foreground">
                    Las tareas tienen estados (pendiente, en progreso, completada, retrasada, cancelada) 
                    y niveles de prioridad para organizar el trabajo.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="analytics">
              <AccordionTrigger className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Análisis y Reportes
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">¿Qué datos puedo analizar?</h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes analizar datos de producción, económicos, ambientales y operacionales. 
                    Cada tipo incluye métricas específicas para el análisis agrícola.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">¿Cómo exportar reportes?</h4>
                  <p className="text-sm text-muted-foreground">
                    La mayoría de secciones incluyen botones de exportación a PDF y Excel para 
                    generar reportes profesionales de tus datos.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Módulos del sistema */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Módulos del Sistema</CardTitle>
          <CardDescription>
            Descripción de las funcionalidades principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Gestión de Empresas</h4>
                  <p className="text-sm text-muted-foreground">
                    Administra múltiples explotaciones agrícolas con permisos granulares y códigos de invitación.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Registro de Parcelas</h4>
                  <p className="text-sm text-muted-foreground">
                    Integración con datos catastrales españoles y visualización geográfica de las parcelas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Control de Inventario</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestión completa de semillas, fertilizantes, pesticidas y equipamiento con alertas de stock.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Planificación de Tareas</h4>
                  <p className="text-sm text-muted-foreground">
                    Sistema completo de tareas con asignación, prioridades y seguimiento de estado.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Análisis Agrícola</h4>
                  <p className="text-sm text-muted-foreground">
                    Registro y análisis de datos de producción, económicos, ambientales y operacionales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Reportes y Exportación</h4>
                  <p className="text-sm text-muted-foreground">
                    Generación automática de reportes en PDF y Excel para análisis y documentación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soporte técnico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Soporte Técnico
          </CardTitle>
          <CardDescription>
            ¿Necesitas ayuda adicional? Contacta con nuestro equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-sm text-muted-foreground">soporte@agrimanager.es</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Teléfono</div>
                <div className="text-sm text-muted-foreground">+34 900 123 456</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Web</div>
                <div className="text-sm text-muted-foreground">www.agrimanager.es</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Horario de Atención</h4>
            <p className="text-sm text-muted-foreground">
              Lunes a Viernes: 9:00 - 18:00<br/>
              Sábados: 10:00 - 14:00<br/>
              Domingos y festivos: Cerrado
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}