import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, TaskStatus, TaskPriority, insertTaskSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

import AppHeader from "@/components/layout/app-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ConnectionStatus from "@/components/common/connection-status";
import CompanySelector from "@/components/layout/company-selector";
import { Loader2, Plus, Layers } from "lucide-react";

// Extended schema for form validation
const taskFormSchema = insertTaskSchema.extend({
  dueDate: z.union([
    z.date(),
    z.null()
  ]).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TasksPage() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  console.log("Frontend - TasksPage component loaded, user:", user?.id);

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  console.log("Frontend - Tasks data:", tasks);
  console.log("Frontend - Is loading:", isLoading);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      console.log("Frontend - Sending task data:", data);
      const res = await apiRequest("POST", "/api/tasks", data);
      console.log("Frontend - Response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Frontend - API error:", errorText);
        throw new Error(errorText);
      }
      const result = await res.json();
      console.log("Frontend - Created task:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Frontend - Task creation successful");
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarea añadida",
        description: "La tarea ha sido añadida correctamente",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Frontend - Task creation error:", error);
      toast({
        title: "Error",
        description: `No se pudo añadir la tarea: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Task) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/tasks/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada correctamente",
      });
      setOpenDialog(false);
      setEditingTask(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la tarea: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la tarea: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding/editing tasks
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(),
      assignedTo: user?.id || undefined,
      createdBy: user?.id || undefined,
      companyId: user?.currentCompanyId || undefined,
    },
  });

  // Handle form submission
  const onSubmit = (data: TaskFormValues) => {
    console.log("Frontend - onSubmit called with data:", data);
    console.log("Frontend - editingTask:", editingTask);
    console.log("Frontend - Form is valid:", form.formState.isValid);
    console.log("Frontend - Form errors:", form.formState.errors);
    
    if (editingTask) {
      console.log("Frontend - Updating existing task with ID:", editingTask.id);
      const updateData = { 
        ...data, 
        id: editingTask.id,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy || null,
        dueDate: data.dueDate || null,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority
      };
      console.log("Frontend - Update data being sent:", updateData);
      updateMutation.mutate(updateData);
    } else {
      console.log("Frontend - Creating new task");
      const createData = {
        ...data,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy || null,
        dueDate: data.dueDate || null,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority
      };
      console.log("Frontend - Create data being sent:", createData);
      createMutation.mutate(createData);
    }
  };

  // Handle edit button click
  const handleEdit = (task: Task) => {
    console.log("Frontend - handleEdit called for task:", task);
    setEditingTask(task);
    const resetData = {
      title: task.title,
      description: task.description || "",
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      assignedTo: task.assignedTo || user?.id,
      createdBy: task.createdBy || user?.id,
    };
    console.log("Frontend - Form reset data:", resetData);
    form.reset(resetData);
    setOpenDialog(true);
    console.log("Frontend - Dialog should be open, editingTask:", task);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setEditingTask(null);
    form.reset();
    setOpenDialog(false);
  };

  // Get color based on task priority
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case TaskPriority.LOW:
        return "bg-blue-100 text-blue-800";
      case TaskPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case TaskPriority.HIGH:
        return "bg-orange-100 text-orange-800";
      case TaskPriority.URGENT:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter tasks based on selected filters
  const getFilteredTasks = () => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      let matchesStatus = statusFilter === "all" || task.status === statusFilter;
      let matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle priority filter change
  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
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
        <SidebarNavigation activePath="/tasks" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <Layers className="mr-2 h-6 w-6" />
              Gestión de Tareas
            </h1>
            <Button 
              onClick={() => console.log("TEST - Button clicked!")}
              variant="outline"
              size="sm"
            >
              Test Click
            </Button>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? "Editar tarea" : "Añadir nueva tarea"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.log("Frontend - Form validation errors:", errors);
                  })} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título de la tarea" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descripción de la tarea"
                              className="resize-none h-20"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={TaskStatus.PENDING}>Pendiente</SelectItem>
                                <SelectItem value={TaskStatus.IN_PROGRESS}>En progreso</SelectItem>
                                <SelectItem value={TaskStatus.COMPLETED}>Completada</SelectItem>
                                <SelectItem value={TaskStatus.DELAYED}>Retrasada</SelectItem>
                                <SelectItem value={TaskStatus.CANCELLED}>Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione una prioridad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={TaskPriority.LOW}>Baja</SelectItem>
                                <SelectItem value={TaskPriority.MEDIUM}>Media</SelectItem>
                                <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
                                <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha límite</FormLabel>
                          <Calendar
                            mode="single"
                            selected={field.value ? field.value : undefined}
                            onSelect={(date) => field.onChange(date || null)}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            className="rounded-md border"
                          />
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
                          console.log("Frontend - Direct button click triggered");
                          const formData = form.getValues();
                          console.log("Frontend - Current form data:", formData);
                          console.log("Frontend - EditingTask:", editingTask);
                          
                          if (editingTask) {
                            console.log("Frontend - Starting update process");
                            const updateData = {
                              ...formData,
                              id: editingTask.id,
                              description: formData.description || null,
                              assignedTo: formData.assignedTo || null,
                              createdBy: formData.createdBy || null,
                              dueDate: formData.dueDate || null,
                              status: formData.status as TaskStatus,
                              priority: formData.priority as TaskPriority
                            };
                            console.log("Frontend - Direct update call with data:", updateData);
                            updateMutation.mutate(updateData);
                          } else {
                            console.log("Frontend - Starting create process");
                            onSubmit(formData);
                          }
                        }}
                      >
                        {(createMutation.isPending || updateMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingTask ? "Actualizando..." : "Guardando..."}
                          </>
                        ) : (
                          <>{editingTask ? "Actualizar" : "Guardar"}</>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                  {!tasks || tasks.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No hay tareas disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Filtros de tareas */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value={TaskStatus.PENDING}>Pendiente</SelectItem>
                            <SelectItem value={TaskStatus.IN_PROGRESS}>En progreso</SelectItem>
                            <SelectItem value={TaskStatus.COMPLETED}>Completada</SelectItem>
                            <SelectItem value={TaskStatus.DELAYED}>Retrasada</SelectItem>
                            <SelectItem value={TaskStatus.CANCELLED}>Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las prioridades</SelectItem>
                            <SelectItem value={TaskPriority.LOW}>Baja</SelectItem>
                            <SelectItem value={TaskPriority.MEDIUM}>Media</SelectItem>
                            <SelectItem value={TaskPriority.HIGH}>Alta</SelectItem>
                            <SelectItem value={TaskPriority.URGENT}>Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Lista de tareas */}
                      <div className="divide-y">
                        {getFilteredTasks().length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-gray-500">No hay tareas que coincidan con los filtros</p>
                          </div>
                        ) : (
                          getFilteredTasks().map(task => (
                            <div 
                              key={task.id}
                              className="p-4 hover:bg-gray-50 cursor-pointer relative border border-transparent hover:border-gray-200 rounded-lg"
                              style={{ userSelect: 'none' }}
                              onMouseDown={(e) => {
                                console.log("Frontend - Task mousedown:", task.id);
                                e.preventDefault();
                                handleEdit(task);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-block w-3 h-3 rounded-full ${
                                    task.status === TaskStatus.COMPLETED ? 'bg-green-500' :
                                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' :
                                    task.status === TaskStatus.DELAYED ? 'bg-yellow-500' :
                                    task.status === TaskStatus.CANCELLED ? 'bg-gray-500' :
                                    'bg-primary'
                                  }`}></span>
                                  <h3 className="font-medium">{task.title}</h3>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                                  {task.priority === TaskPriority.LOW ? "Baja" : 
                                  task.priority === TaskPriority.MEDIUM ? "Media" : 
                                  task.priority === TaskPriority.HIGH ? "Alta" : "Urgente"}
                                </span>
                              </div>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                              )}
                              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                                <span>
                                  {task.status === TaskStatus.PENDING ? "Pendiente" : 
                                  task.status === TaskStatus.IN_PROGRESS ? "En progreso" : 
                                  task.status === TaskStatus.COMPLETED ? "Completada" : 
                                  task.status === TaskStatus.DELAYED ? "Retrasada" : "Cancelada"}
                                </span>
                                {task.dueDate && (
                                  <span>Fecha límite: {format(new Date(task.dueDate), "d MMM yyyy", { locale: es })}</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-700">
                        {tasks?.filter(t => t.status === TaskStatus.COMPLETED).length || 0}
                      </p>
                      <p className="text-sm text-green-600">Completadas</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-lg font-bold text-yellow-700">
                        {tasks?.filter(t => t.status === TaskStatus.PENDING).length || 0}
                      </p>
                      <p className="text-sm text-yellow-600">Pendientes</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-700">
                        {tasks?.filter(t => t.status === TaskStatus.IN_PROGRESS).length || 0}
                      </p>
                      <p className="text-sm text-blue-600">En progreso</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-700">
                        {tasks?.filter(t => t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH).length || 0}
                      </p>
                      <p className="text-sm text-red-600">Alta prioridad</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activePath="/tasks" />
    </div>
  );
}