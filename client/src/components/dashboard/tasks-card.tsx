import { useState } from "react";
import { useLocation } from "wouter";
import { Task, TaskStatus, TaskPriority } from "@shared/schema";
import { Calendar, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isTomorrow, isYesterday, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface TasksCardProps {
  tasks: Task[];
  isLoading: boolean;
}

export default function TasksCard({ tasks, isLoading }: TasksCardProps) {
  const [, navigate] = useLocation();
  
  // Get the top 3 priority tasks
  const priorityTasks = [...tasks]
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = {
        [TaskPriority.URGENT]: 0,
        [TaskPriority.HIGH]: 1,
        [TaskPriority.MEDIUM]: 2,
        [TaskPriority.LOW]: 3,
      };
      
      const priorityDiff = priorityOrder[a.priority as TaskPriority] - priorityOrder[b.priority as TaskPriority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date if available
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // If no due date, keep original order
      return 0;
    })
    .slice(0, 3);
  
  // Format relative date
  const formatRelativeDate = (date: string | Date | undefined) => {
    if (!date) return '';
    
    const taskDate = new Date(date);
    
    if (isToday(taskDate)) {
      return 'Hoy';
    } else if (isYesterday(taskDate)) {
      return 'Ayer';
    } else if (isTomorrow(taskDate)) {
      return 'Mañana';
    } else {
      return format(taskDate, 'd MMM', { locale: es });
    }
  };
  
  // Get task icon based on status and priority
  const getTaskIcon = (task: Task) => {
    if (task.priority === TaskPriority.URGENT || task.priority === TaskPriority.HIGH) {
      return <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />;
    } else if (task.status === TaskStatus.DELAYED) {
      return <AlertCircle className="text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />;
    } else {
      return <Calendar className="text-gray-400 mr-3 flex-shrink-0 mt-0.5" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Tareas pendientes</h3>
        <button 
          onClick={() => navigate('/calendar')}
          className="text-primary text-sm font-medium hover:underline focus:outline-none"
        >
          Ver todas
        </button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start p-2">
              <Skeleton className="h-6 w-6 rounded-full mr-3" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <ul className="space-y-3 mb-4">
            {priorityTasks.length === 0 ? (
              <li className="text-center py-8 text-gray-500">
                No hay tareas pendientes
              </li>
            ) : (
              priorityTasks.map((task) => (
                <li key={task.id} className="flex items-start p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => navigate('/calendar')}>
                  {getTaskIcon(task)}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 ml-2">
                        {task.dueDate ? formatRelativeDate(task.dueDate) : ''}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {task.description || `${task.status === TaskStatus.PENDING ? 'Pendiente' : 
                                          task.status === TaskStatus.IN_PROGRESS ? 'En progreso' : 
                                          task.status === TaskStatus.DELAYED ? 'Retrasada' : 
                                          task.status === TaskStatus.COMPLETED ? 'Completada' : 'Cancelada'}`}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Añadir tarea
          </Button>
        </>
      )}
    </div>
  );
}
