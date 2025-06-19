import { CalendarDays, Clock } from "lucide-react";

interface WelcomeCardProps {
  username: string;
  lastUpdate: string;
}

export default function WelcomeCard({ username, lastUpdate }: WelcomeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Bienvenido, {username}
          </h2>
          <div className="flex items-center text-gray-600 mt-1">
            <CalendarDays className="h-4 w-4 mr-1" />
            <span>Última actualización: {lastUpdate}</span>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center text-white">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
