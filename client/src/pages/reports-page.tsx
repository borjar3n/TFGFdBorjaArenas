import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Home
} from "lucide-react";
import { formatDistanceToNow, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assignedTo: number | null;
}

interface InventoryTransaction {
  id: number;
  type: string;
  quantity: number;
  date: string;
  inventoryId: number;
}

interface Inventory {
  id: number;
  name: string;
  type: string;
  quantity: number;
  minQuantity: number | null;
}

export default function ReportsPage() {
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory'],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ['/api/inventory-transactions'],
  });

  // Calcular estadísticas de tareas
  const taskStats = tasks ? {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => {
      try {
        return t.status !== 'completed' && 
               t.dueDate && 
               isAfter(new Date(), parseISO(t.dueDate));
      } catch {
        return false;
      }
    }).length
  } : null;

  // Calcular tiempo promedio de completado
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
  const avgCompletionTime = completedTasks.length > 0 
    ? completedTasks.reduce((acc, task) => {
        try {
          if (!task.createdAt) return acc;
          const created = parseISO(task.createdAt);
          const today = new Date();
          return acc + differenceInDays(today, created);
        } catch {
          return acc;
        }
      }, 0) / completedTasks.length 
    : 0;

  // Calcular estadísticas de inventario
  const inventoryStats = inventory ? {
    total: inventory.length,
    lowStock: inventory.filter(item => 
      item.minQuantity && item.quantity <= item.minQuantity
    ).length,
    outOfStock: inventory.filter(item => item.quantity === 0).length
  } : null;

  // Calcular frecuencia de reposición
  const recentTransactions = transactions?.filter(t => {
    try {
      return t.type === 'add' && 
             t.date && 
             differenceInDays(new Date(), parseISO(t.date)) <= 30;
    } catch {
      return false;
    }
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (tasksLoading || inventoryLoading || transactionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Rendimiento</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Rendimiento</h1>
          <p className="text-muted-foreground">
            Análisis del rendimiento operativo, cumplimiento de tareas y gestión de inventario
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </Link>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {taskStats?.total || 0} tareas totales
            </p>
            {taskStats && taskStats.total > 0 && (
              <Progress 
                value={(taskStats.completed / taskStats.total) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">
              requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgCompletionTime)}d</div>
            <p className="text-xs text-muted-foreground">
              para completar tareas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inventoryStats?.lowStock || 0}</div>
            <p className="text-xs text-muted-foreground">
              productos necesitan reposición
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estado de Tareas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estado de Tareas
            </CardTitle>
            <CardDescription>
              Distribución actual del estado de las tareas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskStats && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Completadas</span>
                  </div>
                  <span className="font-semibold">{taskStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>En Progreso</span>
                  </div>
                  <span className="font-semibold">{taskStats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Pendientes</span>
                  </div>
                  <span className="font-semibold">{taskStats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Atrasadas</span>
                  </div>
                  <span className="font-semibold">{taskStats.overdue}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actividad de Inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actividad de Inventario
            </CardTitle>
            <CardDescription>
              Movimientos recientes de inventario (últimos 30 días)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Reposiciones este mes</span>
              <span className="font-semibold">{recentTransactions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Productos sin stock</span>
              <span className="font-semibold text-red-600">{inventoryStats?.outOfStock || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total de productos</span>
              <span className="font-semibold">{inventoryStats?.total || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tareas Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas Recientes</CardTitle>
          <CardDescription>
            Estado y progreso de las tareas más recientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks?.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status === 'completed' ? 'Completada' :
                       task.status === 'in_progress' ? 'En Progreso' :
                       task.status === 'pending' ? 'Pendiente' : task.status}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority === 'high' ? 'Alta' :
                       task.priority === 'medium' ? 'Media' :
                       task.priority === 'low' ? 'Baja' : task.priority}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  {task.dueDate && (
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {(() => {
                        try {
                          return formatDistanceToNow(parseISO(task.dueDate), { 
                            addSuffix: true, 
                            locale: es 
                          });
                        } catch {
                          return 'Fecha inválida';
                        }
                      })()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      try {
                        if (!task.createdAt) return 'Sin fecha';
                        return `Creada ${formatDistanceToNow(parseISO(task.createdAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}`;
                      } catch {
                        return 'Fecha inválida';
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}