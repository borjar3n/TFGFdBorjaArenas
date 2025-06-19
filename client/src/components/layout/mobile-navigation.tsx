import { useLocation, Link } from "wouter";
import { 
  Home, 
  Calendar, 
  Package, 
  Grid, 
  MoreHorizontal 
} from "lucide-react";

interface MobileNavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

const MobileNavItem = ({ href, icon, children, isActive }: MobileNavItemProps) => (
  <Link href={href}>
    <div className={`flex flex-col items-center justify-center cursor-pointer ${
      isActive ? "text-primary" : "text-gray-500 hover:text-primary"
    }`}>
      {icon}
      <span className="text-xs mt-1">{children}</span>
    </div>
  </Link>
);

interface MobileNavigationProps {
  activePath: string;
}

export default function MobileNavigation({ activePath }: MobileNavigationProps) {
  const [location] = useLocation();
  
  // Check if a path is active (exact match or starts with)
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };
  
  return (
    <nav className="lg:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="grid grid-cols-5 h-16">
        <MobileNavItem href="/" icon={<Home size={20} />} isActive={isActive('/')}>
          Inicio
        </MobileNavItem>
        <MobileNavItem href="/calendar" icon={<Calendar size={20} />} isActive={isActive('/calendar')}>
          Calendario
        </MobileNavItem>
        <MobileNavItem href="/inventory" icon={<Package size={20} />} isActive={isActive('/inventory')}>
          Inventario
        </MobileNavItem>
        <MobileNavItem href="/fields" icon={<Grid size={20} />} isActive={isActive('/fields')}>
          Parcelas
        </MobileNavItem>
        <div className="relative group">
          <MobileNavItem href="#" icon={<MoreHorizontal size={20} />} isActive={false}>
            Más
          </MobileNavItem>
          <div className="hidden group-hover:block absolute bottom-16 right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <Link href="/analytics">
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Análisis Agrícola</div>
            </Link>
            <Link href="/reports">
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Estadísticas</div>
            </Link>
            <Link href="/users">
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Usuarios</div>
            </Link>
            <Link href="/settings">
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Ajustes</div>
            </Link>
            <Link href="/help">
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Ayuda</div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
