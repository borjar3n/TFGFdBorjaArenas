import { useOffline } from "@/hooks/use-offline";
import { WifiOff } from "lucide-react";

export default function ConnectionStatus() {
  const { isOffline } = useOffline();
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <div className="bg-red-500 text-white text-center py-1 text-sm animate-pulse">
      <WifiOff className="inline-block h-4 w-4 text-sm align-text-bottom mr-1" />
      Modo sin conexión - Los cambios se guardarán cuando recuperes la conexión
    </div>
  );
}
