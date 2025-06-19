import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, TaskStatus, TaskPriority, insertTaskSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
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
import { Loader2, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

// Extended schema for form validation
const taskFormSchema = insertTaskSchema.extend({
  dueDate: z.date({
    required_error: "Por favor seleccione una fecha",
  }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function CalendarPage() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      console.log("Calendar - Sending task data:", data);
      const res = await apiRequest("POST", "/api/tasks", data);
      console.log("Calendar - Response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Calendar - API error:", errorText);
        throw new Error(errorText);
      }
      const result = await res.json();
      console.log("Calendar - Created task:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Calendar - Task creation successful");
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tarea añadida",
        description: "La tarea ha sido añadida al calendario",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Calendar - Task creation error:", error);
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
    console.log("Calendar - onSubmit called with data:", data);
    console.log("Calendar - editingTask:", editingTask);
    
    if (editingTask) {
      console.log("Calendar - Updating existing task");
      updateMutation.mutate({ 
        ...data, 
        id: editingTask.id,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy || null,
        dueDate: data.dueDate || null,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority
      });
    } else {
      console.log("Calendar - Creating new task");
      createMutation.mutate({
        ...data,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy || null,
        dueDate: data.dueDate || null,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority
      });
    }
  };

  // Handle edit button click
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || "",
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      assignedTo: task.assignedTo || user?.id,
      createdBy: task.createdBy || user?.id,
    });
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setEditingTask(null);
    form.reset();
    setOpenDialog(false);
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  // Get week days
  const weekDays = eachDayOfInterval({
    start: currentWeek,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
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

  return (
    <div className="flex flex-col h-screen">
      {/* Show offline status */}
      {isOffline && <ConnectionStatus />}
      
      {/* Top AppBar */}
      <AppHeader user={user} />

      <div className="flex flex-grow h-full overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNavigation activePath="/calendar" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarIcon className="mr-2 h-6 w-6" />
              Calendario de Actividades
            </h1>
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              onChange={field.onChange}
                              value={field.value || ''}
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
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
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
                          console.log("Frontend - Calendar direct button click");
                          const formData = form.getValues();
                          console.log("Frontend - Calendar form data:", formData);
                          console.log("Frontend - Calendar editingTask:", editingTask);
                          
                          if (editingTask) {
                            console.log("Frontend - Starting calendar task update");
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
                            console.log("Frontend - Calendar update data:", updateData);
                            updateMutation.mutate(updateData);
                          } else {
                            console.log("Frontend - Starting calendar task create");
                            const createData = {
                              ...formData,
                              description: formData.description || null,
                              assignedTo: formData.assignedTo || null,
                              createdBy: formData.createdBy || null,
                              dueDate: formData.dueDate || null,
                              status: formData.status as TaskStatus,
                              priority: formData.priority as TaskPriority
                            };
                            createMutation.mutate(createData);
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
              {/* Vista de calendario */}
              <Card>
                <CardHeader className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold">
                      {format(currentWeek, "MMMM yyyy", { locale: es })}
                    </h2>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-6">
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, i) => (
                      <div key={i} className="border rounded-md overflow-hidden h-auto min-h-[200px] flex flex-col">
                        <div className={`px-2 py-2 text-center ${isSameDay(day, new Date()) ? "bg-primary text-white" : "bg-gray-100"}`}>
                          <p className="text-xs font-medium">
                            {format(day, "EEEE", { locale: es })}
                          </p>
                          <p className="text-lg font-bold">
                            {format(day, "d", { locale: es })}
                          </p>
                        </div>
                        <div className="p-1 flex-grow">
                          {getTasksForDate(day).length === 0 ? (
                            <p className="text-center text-gray-400 text-xs py-4">No hay tareas</p>
                          ) : (
                            <div className="space-y-1">
                              {getTasksForDate(day).map((task) => (
                                <div 
                                  key={task.id} 
                                  className={`p-2 text-xs rounded cursor-pointer hover:opacity-80 ${getPriorityColor(task.priority)}`}
                                  onClick={() => handleEdit(task)}
                                >
                                  <p className="font-medium truncate">{task.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Próximas Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks && tasks.filter(task => 
                      task.dueDate && new Date(task.dueDate) >= new Date() && task.status !== TaskStatus.COMPLETED
                    ).sort((a, b) => 
                      new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
                    ).slice(0, 5).map(task => (
                      <div 
                        key={task.id} 
                        className="p-3 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleEdit(task)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description && task.description.substring(0, 60)}{task.description && task.description.length > 60 ? '...' : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority === TaskPriority.LOW ? "Baja" : 
                               task.priority === TaskPriority.MEDIUM ? "Media" : 
                               task.priority === TaskPriority.HIGH ? "Alta" : "Urgente"}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {task.dueDate && format(new Date(task.dueDate), "d MMM yyyy", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!tasks || tasks.filter(task => 
                      task.dueDate && new Date(task.dueDate) >= new Date() && task.status !== TaskStatus.COMPLETED
                    ).length === 0) && (
                      <p className="text-center text-gray-500 py-4">No hay tareas pendientes próximas</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activePath="/calendar" />
    </div>
  );
}
