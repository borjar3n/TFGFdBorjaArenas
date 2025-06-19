import { useLocation } from "wouter";
import { Field, FieldStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, Plus } from "lucide-react";

interface FieldsTableProps {
  fields: Field[];
  isLoading: boolean;
}

export default function FieldsTable({ fields, isLoading }: FieldsTableProps) {
  const [, navigate] = useLocation();
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
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

  // Get health status badge
  const getHealthStatusBadge = (status: string) => {
    switch(status) {
      case "good":
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Saludable</span>;
      case "attention":
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Atención</span>;
      case "poor":
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Deficiente</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Desconocido</span>;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Parcelas y cultivos</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/fields')}
            className="text-primary text-sm font-medium hover:underline focus:outline-none"
          >
            Ver mapa
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => navigate('/fields')}
            className="text-primary text-sm font-medium hover:underline focus:outline-none"
          >
            Ver cultivos
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcela</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultivo</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etapa</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fields.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                    No hay parcelas registradas
                  </td>
                </tr>
              ) : (
                fields.slice(0, 3).map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        <div className="text-sm font-medium text-gray-900">{field.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{field.crop || "-"}</div>
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
                      {getHealthStatusBadge(field.healthStatus || "good")}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary-dark"
                          onClick={() => navigate('/fields')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => navigate('/fields')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-4 flex justify-center">
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => navigate('/fields')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir parcela
        </Button>
      </div>
    </div>
  );
}
