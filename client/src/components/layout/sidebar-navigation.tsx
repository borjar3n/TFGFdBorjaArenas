import { useLocation, Link } from "wouter";
import { 
  Home, 
  Calendar, 
  Layers, 
  Grid, 
  BarChart2, 
  Users, 
  Settings, 
  HelpCircle, 
  Package,
  Building2,
  Cloud,
  TrendingUp
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

const NavItem = ({ href, icon, children, isActive }: NavItemProps) => (
  <Link href={href} className={`flex items-center px-3 py-2 rounded-md group ${
    isActive 
      ? "text-primary bg-green-50" 
      : "text-gray-700 hover:bg-gray-100"
  }`}>
    <span className={`mr-3 ${isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"}`}>
      {icon}
    </span>
    <span className="font-medium">{children}</span>
  </Link>
);

interface SidebarNavigationProps {
  activePath: string;
}

export default function SidebarNavigation({ activePath }: SidebarNavigationProps) {
  const [location] = useLocation();
  
  // Check if a path is active (exact match or starts with)
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };
  
  return (
    <aside className="hidden lg:block w-64 bg-white shadow-md overflow-y-auto">
      <nav className="px-2 py-4">
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Principal</p>
          <NavItem href="/" icon={<Home size={20} />} isActive={isActive('/')}>
            Inicio
          </NavItem>
          <NavItem href="/calendar" icon={<Calendar size={20} />} isActive={isActive('/calendar')}>
            Calendario
          </NavItem>
          <NavItem href="/tasks" icon={<Layers size={20} />} isActive={isActive('/tasks')}>
            Tareas
          </NavItem>
        </div>
        
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Gestión</p>
          <NavItem href="/inventory" icon={<Package size={20} />} isActive={isActive('/inventory')}>
            Inventario
          </NavItem>
          <NavItem href="/fields" icon={<Grid size={20} />} isActive={isActive('/fields')}>
            Parcelas
          </NavItem>
        </div>
        
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Análisis</p>
          <NavItem href="/weather" icon={<Cloud size={20} />} isActive={isActive('/weather')}>
            Clima
          </NavItem>
          <NavItem href="/analytics" icon={<TrendingUp size={20} />} isActive={isActive('/analytics')}>
            Análisis Agrícola
          </NavItem>
          <NavItem href="/reports" icon={<BarChart2 size={20} />} isActive={isActive('/reports')}>
            Estadísticas
          </NavItem>
        </div>
        
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">Sistema</p>
          <NavItem href="/companies" icon={<Building2 size={20} />} isActive={isActive('/companies')}>
            Explotaciones
          </NavItem>
          <NavItem href="/users" icon={<Users size={20} />} isActive={isActive('/users')}>
            Usuarios
          </NavItem>
          <NavItem href="/settings" icon={<Settings size={20} />} isActive={isActive('/settings')}>
            Ajustes
          </NavItem>
          <NavItem href="/help" icon={<HelpCircle size={20} />} isActive={isActive('/help')}>
            Ayuda
          </NavItem>
        </div>
      </nav>
    </aside>
  );
}
