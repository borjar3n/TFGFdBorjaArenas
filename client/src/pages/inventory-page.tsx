import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Inventory, InventoryType, insertInventorySchema } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/hooks/use-offline";

import AppHeader from "@/components/layout/app-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ConnectionStatus from "@/components/common/connection-status";
import CompanySelector from "@/components/layout/company-selector";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Search, FileDown, Trash2, Edit } from "lucide-react";

// Extended schema for form validation
const inventoryFormSchema = insertInventorySchema.extend({
  quantity: z.coerce.number().min(0, { message: "La cantidad no puede ser negativa" }),
  minQuantity: z.coerce.number().min(0, { message: "La cantidad mínima no puede ser negativa" }),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function InventoryPage() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);

  // Fetch inventory
  const { data: inventory, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      const res = await apiRequest("POST", "/api/inventory", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Elemento añadido",
        description: "El elemento ha sido añadido al inventario",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo añadir el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Inventory) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/inventory/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Elemento actualizado",
        description: "El elemento ha sido actualizado correctamente",
      });
      setOpenDialog(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Elemento eliminado",
        description: "El elemento ha sido eliminado del inventario",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding/editing inventory items
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      type: InventoryType.FERTILIZER,
      quantity: 0,
      unit: "kg",
      minQuantity: 0,
      notes: "",
      companyId: user?.currentCompanyId || undefined,
    },
  });

  // Handle form submission
  const onSubmit = (data: InventoryFormValues) => {
    console.log("Frontend - Inventory onSubmit called with data:", data);
    console.log("Frontend - editingItem:", editingItem);
    console.log("Frontend - Form is valid:", form.formState.isValid);
    console.log("Frontend - Form errors:", form.formState.errors);
    
    if (editingItem) {
      console.log("Frontend - Updating existing inventory item with ID:", editingItem.id);
      const updateData = { 
        ...data, 
        id: editingItem.id,
        type: data.type as InventoryType,
        notes: data.notes || null,
        minQuantity: data.minQuantity || 0
      };
      console.log("Frontend - Inventory update data being sent:", updateData);
      updateMutation.mutate(updateData);
    } else {
      console.log("Frontend - Creating new inventory item");
      const createData = {
        ...data,
        type: data.type as InventoryType,
        notes: data.notes || null,
        minQuantity: data.minQuantity || 0
      };
      console.log("Frontend - Inventory create data being sent:", createData);
      createMutation.mutate(createData);
    }
  };

  // Handle edit button click
  const handleEdit = (item: Inventory) => {
    console.log("Frontend - handleEdit called for inventory item:", item);
    setEditingItem(item);
    const resetData = {
      name: item.name,
      type: item.type as InventoryType,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.minQuantity || 0,
      notes: item.notes || "",
    };
    console.log("Frontend - Inventory form reset data:", resetData);
    form.reset(resetData);
    setOpenDialog(true);
    console.log("Frontend - Inventory dialog should be open, editingItem:", item);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setEditingItem(null);
    form.reset();
    setOpenDialog(false);
  };

  // Filter inventory items based on search term
  const filteredInventory = inventory?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group inventory items by type
  const groupedInventory = filteredInventory.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, Inventory[]>);

  // Calculate stock status for progress bar
  const getStockStatusColor = (item: Inventory) => {
    const ratio = item.quantity / (item.minQuantity || 1);
    if (ratio < 1) return "bg-red-500"; // Below minimum
    if (ratio < 1.5) return "bg-yellow-500"; // Low stock
    return "bg-green-500"; // Good stock
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
        <SidebarNavigation activePath="/inventory" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Inventario</h1>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Buscar inventario..." 
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <a 
                href="/api/export/inventory/excel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 h-10 text-sm font-medium text-white"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Excel
              </a>
              <a 
                href="/api/export/inventory/pdf" 
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
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Editar elemento" : "Añadir elemento al inventario"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del producto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={InventoryType.SEED}>Semillas</SelectItem>
                                  <SelectItem value={InventoryType.FERTILIZER}>Fertilizantes</SelectItem>
                                  <SelectItem value={InventoryType.PESTICIDE}>Pesticidas</SelectItem>
                                  <SelectItem value={InventoryType.EQUIPMENT}>Equipamiento</SelectItem>
                                  <SelectItem value={InventoryType.OTHER}>Otros</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cantidad</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="any" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unidad</FormLabel>
                                <FormControl>
                                  <Input placeholder="kg, l, unid..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="minQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad mínima</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="any" {...field} />
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
                              <Input 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" type="button" onClick={handleDialogClose}>
                          Cancelar
                        </Button>
                        <Button 
                          type="button"
                          disabled={createMutation.isPending || updateMutation.isPending}
                          onClick={() => {
                            console.log("Frontend - Inventory direct button click");
                            const formData = form.getValues();
                            console.log("Frontend - Form data:", formData);
                            console.log("Frontend - EditingItem:", editingItem);
                            
                            if (editingItem) {
                              console.log("Frontend - Starting inventory update");
                              const updateData = {
                                ...formData,
                                id: editingItem.id,
                                notes: formData.notes || null,
                                type: formData.type as InventoryType,
                                minQuantity: formData.minQuantity || null
                              };
                              console.log("Frontend - Inventory update data:", updateData);
                              updateMutation.mutate(updateData);
                            } else {
                              console.log("Frontend - Starting inventory create");
                              const createData = {
                                ...formData,
                                notes: formData.notes || null
                              };
                              createMutation.mutate(createData);
                            }
                          }}
                        >
                          {(createMutation.isPending || updateMutation.isPending) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {editingItem ? "Actualizando..." : "Guardando..."}
                            </>
                          ) : (
                            <>{editingItem ? "Actualizar" : "Guardar"}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value={InventoryType.SEED}>Semillas</TabsTrigger>
                <TabsTrigger value={InventoryType.FERTILIZER}>Fertilizantes</TabsTrigger>
                <TabsTrigger value={InventoryType.PESTICIDE}>Pesticidas</TabsTrigger>
                <TabsTrigger value={InventoryType.EQUIPMENT}>Equipamiento</TabsTrigger>
                <TabsTrigger value={InventoryType.OTHER}>Otros</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle>Todos los elementos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredInventory.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay elementos en el inventario</p>
                      ) : (
                        filteredInventory.map((item) => (
                          <div key={item.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-gray-500">Tipo: {item.type}</p>
                                <div className="mt-2">
                                  <div className="flex justify-between text-sm">
                                    <span>{item.quantity} {item.unit}</span>
                                    <span>Mínimo: {item.minQuantity} {item.unit}</span>
                                  </div>
                                  <Progress 
                                    value={(item.quantity / (item.minQuantity || 1)) * 100} 
                                    max={200}
                                    className="h-2 mt-1"
                                    indicatorClassName={getStockStatusColor(item)}
                                  />
                                </div>
                                {item.notes && (
                                  <p className="text-sm mt-2">{item.notes}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    console.log("Frontend - Inventory edit button clicked for item:", item.id);
                                    handleEdit(item);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(item.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {Object.values(InventoryType).map(type => (
                <TabsContent key={type} value={type}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{type === InventoryType.SEED ? "Semillas" : 
                                  type === InventoryType.FERTILIZER ? "Fertilizantes" :
                                  type === InventoryType.PESTICIDE ? "Pesticidas" :
                                  type === InventoryType.EQUIPMENT ? "Equipamiento" : "Otros"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {!groupedInventory[type] || groupedInventory[type]?.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No hay elementos en esta categoría</p>
                        ) : (
                          groupedInventory[type]?.map((item) => (
                            <div key={item.id} className="p-4 border rounded-lg bg-white">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{item.name}</h3>
                                  <div className="mt-2">
                                    <div className="flex justify-between text-sm">
                                      <span>{item.quantity} {item.unit}</span>
                                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                                    </div>
                                    <Progress 
                                      value={(item.quantity / (item.minQuantity || 1)) * 100} 
                                      max={200}
                                      className="h-2 mt-1"
                                      indicatorClassName={getStockStatusColor(item)}
                                    />
                                  </div>
                                  {item.notes && (
                                    <p className="text-sm mt-2">{item.notes}</p>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      console.log("Frontend - Inventory tab edit button clicked for item:", item.id);
                                      handleEdit(item);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activePath="/inventory" />
    </div>
  );
}
