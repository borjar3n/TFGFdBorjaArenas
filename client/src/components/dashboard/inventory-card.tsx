import { useLocation } from "wouter";
import { Inventory } from "@shared/schema";
import { ShoppingCart, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryCardProps {
  inventoryItems: Inventory[];
  isLoading: boolean;
}

export default function InventoryCard({ inventoryItems, isLoading }: InventoryCardProps) {
  const [, navigate] = useLocation();
  
  // Get the first 3 inventory items, prioritizing low stock items
  const sortedItems = [...inventoryItems]
    .sort((a, b) => {
      const aRatio = a.quantity / (a.minQuantity || 1);
      const bRatio = b.quantity / (b.minQuantity || 1);
      return aRatio - bRatio;
    })
    .slice(0, 3);
  
  // Get icon and style based on stock level
  const getStockLevelInfo = (item: Inventory) => {
    const ratio = item.quantity / (item.minQuantity || 1);
    
    if (ratio < 1) {
      return {
        icon: <AlertTriangle className="text-red-500 mr-3" />,
        barColor: "bg-red-500",
        percentage: Math.min(Math.round(ratio * 100), 100)
      };
    } else if (ratio < 1.5) {
      return {
        icon: <AlertCircle className="text-yellow-500 mr-3" />,
        barColor: "bg-yellow-500",
        percentage: Math.min(Math.round(ratio * 100), 100)
      };
    } else {
      return {
        icon: <CheckCircle className="text-green-500 mr-3" />,
        barColor: "bg-green-500",
        percentage: Math.min(Math.round(ratio * 100), 100)
      };
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Inventario</h3>
        <button 
          onClick={() => navigate('/inventory')}
          className="text-primary text-sm font-medium hover:underline focus:outline-none"
        >
          Ver todo
        </button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2">
              <div className="flex items-center">
                <Skeleton className="h-6 w-6 rounded-full mr-3" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-2 w-full mt-2 rounded-full" />
              <Skeleton className="h-4 w-24 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay elementos en el inventario
              </div>
            ) : (
              sortedItems.map((item) => {
                const stockInfo = getStockLevelInfo(item);
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => navigate('/inventory')}
                  >
                    {stockInfo.icon}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`${stockInfo.barColor} h-2 rounded-full`} 
                          style={{ width: `${stockInfo.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Quedan {item.quantity} {item.unit} ({stockInfo.percentage}%)
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/inventory')}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Registrar compra
          </Button>
        </>
      )}
    </div>
  );
}
