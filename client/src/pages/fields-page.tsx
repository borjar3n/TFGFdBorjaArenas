import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Field, FieldStatus, insertFieldSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AppHeader from "@/components/layout/app-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ConnectionStatus from "@/components/common/connection-status";
import CompanySelector from "@/components/layout/company-selector";
import ConfirmationDialog from "@/components/common/confirmation-dialog";
import FieldMap from "@/components/maps/field-map";
import SigpacViewer from "@/components/maps/sigpac-viewer";
import SigpacWMSViewer from "@/components/maps/sigpac-wms-viewer";
import FieldGeographicForm from "@/components/maps/field-geographic-form";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { Loader2, Plus, Search, FileDown, Trash2, Edit, Map, List, MapPin, Globe } from "lucide-react";

// Extended schema for form validation
const fieldFormSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  area: z.coerce.number().min(1, { message: "El área debe ser mayor que 0" }),
  crop: z.string().optional(),
  status: z.string().optional(),
  progress: z.coerce.number().min(0, { message: "El progreso no puede ser negativo" }).max(100, { message: "El progreso no puede ser mayor a 100" }).optional(),
  healthStatus: z.string().optional(),
  notes: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldFormSchema>;

export default function FieldsPage() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);

  // Fetch fields
  const { data: fields, isLoading } = useQuery<Field[]>({
    queryKey: ["/api/fields"],
  });

  // Generate random coordinates within Spain
  const generateSpanishCoordinates = () => {
    // Spain boundaries (approximate)
    const latMin = 36.0; // Southern Spain (Andalusia)
    const latMax = 43.8; // Northern Spain (Asturias/Cantabria)
    const lonMin = -9.3; // Western Spain (Galicia)
    const lonMax = 3.3;  // Eastern Spain (Catalonia)
    
    const lat = latMin + (latMax - latMin) * Math.random();
    const lon = lonMin + (lonMax - lonMin) * Math.random();
    
    return { lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) };
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FieldFormValues) => {
      // Add random coordinates for geocoding
      const coordinates = generateSpanishCoordinates();
      const fieldData = {
        ...data,
        latitud: coordinates.lat,
        longitud: coordinates.lon
      };
      const res = await apiRequest("POST", "/api/fields", fieldData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      toast({
        title: "Parcela añadida",
        description: "La parcela ha sido añadida correctamente",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo añadir la parcela: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Field) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/fields/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      toast({
        title: "Parcela actualizada",
        description: "La parcela ha sido actualizada correctamente",
      });
      setOpenDialog(false);
      setEditingField(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la parcela: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      toast({
        title: "Parcela eliminada",
        description: "La parcela ha sido eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la parcela: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding/editing fields
  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: "",
      area: 0,
      crop: "",
      status: FieldStatus.PREPARATION,
      progress: 0,
      healthStatus: "good",
      notes: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: FieldFormValues) => {
    if (editingField) {
      updateMutation.mutate({ ...editingField, ...data } as Field);
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle edit button click
  const handleEdit = (field: Field) => {
    setEditingField(field);
    form.reset({
      name: field.name,
      area: field.area,
      crop: field.crop || "",
      status: field.status as FieldStatus || FieldStatus.PREPARATION,
      progress: field.progress || 0,
      healthStatus: field.healthStatus || "good",
      notes: field.notes || "",
    });
    setOpenDialog(true);
  };

  // Handle geographic data save
  const handleGeoDataSave = (geoData: Partial<Field>) => {
    if (editingField) {
      updateMutation.mutate({ ...editingField, ...geoData } as Field);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setEditingField(null);
    form.reset();
    setOpenDialog(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (fieldToDelete !== null) {
      deleteMutation.mutate(fieldToDelete);
      setFieldToDelete(null);
    }
    setConfirmDialogOpen(false);
  };

  // Prepare to delete a field
  const prepareDelete = (id: number) => {
    setFieldToDelete(id);
    setConfirmDialogOpen(true);
  };

  // Filter fields based on search term
  const filteredFields = fields?.filter(field => 
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (field.crop && field.crop.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch(status) {
      case FieldStatus.PREPARATION:
        return "bg-blue-100 text-blue-800";
      case FieldStatus.SEEDING:
        return "bg-yellow-100 text-yellow-800";
      case FieldStatus.GROWING:
        return "bg-green-100 text-green-800";
      case FieldStatus.HARVESTING:
        return "bg-orange-100 text-orange-800";
      case FieldStatus.FALLOW:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get readable status
  const getReadableStatus = (status: string) => {
    switch(status) {
      case FieldStatus.PREPARATION:
        return "En preparación";
      case FieldStatus.SEEDING:
        return "Sembrando";
      case FieldStatus.GROWING:
        return "En crecimiento";
      case FieldStatus.HARVESTING:
        return "Cosechando";
      case FieldStatus.FALLOW:
        return "En barbecho";
      default:
        return status;
    }
  };

  // Get health color
  const getHealthColor = (health: string) => {
    switch(health) {
      case "good":
        return "bg-green-100 text-green-800";
      case "attention":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get readable health
  const getReadableHealth = (status: string) => {
    switch(status) {
      case "good":
        return "Saludable";
      case "attention":
        return "Atención";
      case "poor":
        return "Deficiente";
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Show offline status */}
      {isOffline && <ConnectionStatus />}
      
      {/* Top AppBar */}
      <AppHeader user={user} />
      
      {/* Company Selector */}
      <CompanySelector />

      <div className="flex flex-grow h-full overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNavigation activePath="/fields" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Parcelas y Cultivos</h1>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Buscar parcelas..." 
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <a 
                href="/api/export/fields/excel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 h-10 text-sm font-medium text-white"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Excel
              </a>
              <a 
                href="/api/export/fields/pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 h-10 text-sm font-medium text-white"
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </a>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingField ? "Editar parcela" : "Añadir nueva parcela"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Información Básica</TabsTrigger>
                      <TabsTrigger value="geographic">Datos Geográficos</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nombre de la parcela" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="area"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Área (m²)</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" step="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="crop"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cultivo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Tipo de cultivo" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estado</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange}
                                    value={field.value || FieldStatus.PREPARATION}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un estado" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={FieldStatus.PREPARATION}>En preparación</SelectItem>
                                      <SelectItem value={FieldStatus.SEEDING}>Sembrando</SelectItem>
                                      <SelectItem value={FieldStatus.GROWING}>En crecimiento</SelectItem>
                                      <SelectItem value={FieldStatus.HARVESTING}>Cosechando</SelectItem>
                                      <SelectItem value={FieldStatus.FALLOW}>En barbecho</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="healthStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estado de salud</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange}
                                    value={field.value || 'good'}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un estado" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="good">Saludable</SelectItem>
                                      <SelectItem value="attention">Atención</SelectItem>
                                      <SelectItem value="poor">Deficiente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="progress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Progreso (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" max="100" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notas</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Observaciones sobre la parcela" 
                                    className="resize-none" 
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleDialogClose}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit"
                              disabled={createMutation.isPending || updateMutation.isPending}
                            >
                              {(createMutation.isPending || updateMutation.isPending) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {editingField ? "Actualizando..." : "Guardando..."}
                                </>
                              ) : (
                                <>{editingField ? "Actualizar" : "Guardar"}</>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </TabsContent>
                    
                    {editingField && (
                      <FieldGeographicForm 
                        field={editingField}
                        onSave={handleGeoDataSave}
                        isLoading={updateMutation.isPending}
                      />
                    )}
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="list" className="space-y-4">
              <TabsList className="grid w-full md:w-auto grid-cols-2">
                <TabsTrigger value="list" className="flex items-center">
                  <List className="mr-2 h-4 w-4" />
                  Listado
                </TabsTrigger>
                <TabsTrigger value="sigpac" className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  SIGPAC
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Parcelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcela</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultivo</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provincia</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipio</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etapa</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredFields.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-500">
                                No hay parcelas registradas
                              </td>
                            </tr>
                          ) : (
                            filteredFields.map((field) => (
                              <tr key={field.id} className="hover:bg-gray-50">
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                                    <div className="text-sm font-medium text-gray-900">{field.name}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {field.area} m²
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {field.crop || "-"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {field.provincia || "-"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {field.municipio || "-"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{getReadableStatus(field.status || FieldStatus.PREPARATION)}</div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div 
                                      className="bg-primary h-1.5 rounded-full" 
                                      style={{ width: `${field.progress || 0}%` }}
                                    ></div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getHealthColor(field.healthStatus || "good")}`}>
                                    {getReadableHealth(field.healthStatus || "good")}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleEdit(field)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => prepareDelete(field.id)}
                                      disabled={deleteMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sigpac">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      {editingField && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingField(null)}
                          className="mb-2"
                        >
                          <List className="h-4 w-4 mr-2" />
                          Volver a la lista
                        </Button>
                      )}
                    </div>
                    <SigpacWMSViewer 
                      field={editingField}
                      height="600px"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Parcelas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-96 overflow-y-auto">
                          {filteredFields.map((field) => (
                            <div
                              key={field.id}
                              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${editingField?.id === field.id ? 'bg-blue-50' : ''}`}
                              onClick={() => setEditingField(field)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{field.name}</div>
                                  <div className="text-xs text-gray-500">{field.area} m²</div>
                                </div>
                                <div className="text-xs">
                                  <span className={`px-2 py-1 rounded-full ${getStatusColor(field.status || FieldStatus.PREPARATION)}`}>
                                    {getReadableStatus(field.status || FieldStatus.PREPARATION)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation activePath="/fields" />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Eliminar parcela"
        description="¿Estás seguro de que quieres eliminar esta parcela? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}