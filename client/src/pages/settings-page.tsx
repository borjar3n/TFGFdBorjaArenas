import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Building2, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Download,
  Trash2,
  Edit,
  Save,
  X
} from "lucide-react";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    lowStock: boolean;
    taskReminders: boolean;
    weatherAlerts: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    language: 'es' | 'en';
    timezone: string;
    dateFormat: string;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", username: "" });

  // Get current user data
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get user companies
  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      taskReminders: true,
      weatherAlerts: false,
    },
    display: {
      theme: 'system',
      language: 'es',
      timezone: 'Europe/Madrid',
      dateFormat: 'dd/MM/yyyy',
    },
    privacy: {
      shareData: false,
      analytics: true,
      marketing: false,
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/user/${(user as any)?.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Perfil actualizado correctamente" });
      setEditingProfile(false);
    },
    onError: () => {
      toast({ title: "Error al actualizar perfil", variant: "destructive" });
    },
  });

  const handleProfileEdit = () => {
    if (user) {
      setProfileData({ name: (user as any).name, username: (user as any).username });
      setEditingProfile(true);
    }
  };

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSettingChange = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    
    // Simular guardado automático
    toast({ title: "Configuración guardada" });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona tu perfil, preferencias y configuración de la cuenta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Pantalla
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacidad
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Datos
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Gestiona tu información de perfil y configuración de cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg">
                      {(user as any)?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{(user as any)?.name}</h3>
                    <p className="text-sm text-muted-foreground">@{(user as any)?.username}</p>
                    <Badge variant={(user as any)?.role === 'super_admin' ? 'default' : 'secondary'}>
                      {(user as any)?.role === 'super_admin' ? 'Super Admin' : 
                       (user as any)?.role === 'company_admin' ? 'Admin Empresa' :
                       (user as any)?.role === 'worker' ? 'Trabajador' : 'Visualizador'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {editingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Nombre de usuario</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleProfileSave} disabled={updateProfileMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setEditingProfile(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre completo</Label>
                        <p className="text-sm font-medium">{(user as any)?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Nombre de usuario</Label>
                        <p className="text-sm font-medium">@{(user as any)?.username || 'N/A'}</p>
                      </div>
                    </div>
                    <Button onClick={handleProfileEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar perfil
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empresas Asociadas</CardTitle>
                <CardDescription>
                  Explotaciones agrícolas a las que tienes acceso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(companies as any)?.map((company: any) => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">{company.description}</p>
                        </div>
                      </div>
                      {company.id === (user as any)?.currentCompanyId && (
                        <Badge>Activa</Badge>
                      )}
                    </div>
                  )) || <p className="text-muted-foreground">No hay empresas disponibles</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificación</CardTitle>
              <CardDescription>
                Configura cómo y cuándo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Canales de Notificación</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones por email</Label>
                      <p className="text-sm text-muted-foreground">Recibe actualizaciones importantes por correo</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones push</Label>
                      <p className="text-sm text-muted-foreground">Notificaciones en tiempo real en el navegador</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Tipos de Notificación</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas de stock bajo</Label>
                      <p className="text-sm text-muted-foreground">Cuando el inventario esté por debajo del mínimo</p>
                    </div>
                    <Switch
                      checked={settings.notifications.lowStock}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'lowStock', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Recordatorios de tareas</Label>
                      <p className="text-sm text-muted-foreground">Notificaciones sobre tareas asignadas y vencimientos</p>
                    </div>
                    <Switch
                      checked={settings.notifications.taskReminders}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'taskReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas meteorológicas</Label>
                      <p className="text-sm text-muted-foreground">Avisos sobre condiciones climáticas adversas</p>
                    </div>
                    <Switch
                      checked={settings.notifications.weatherAlerts}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'weatherAlerts', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pantalla */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Pantalla</CardTitle>
              <CardDescription>
                Personaliza la apariencia y el formato de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="theme">Tema</Label>
                  <select
                    id="theme"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings.display.theme}
                    onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <select
                    id="language"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings.display.language}
                    onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <select
                    id="timezone"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings.display.timezone}
                    onChange={(e) => handleSettingChange('display', 'timezone', e.target.value)}
                  >
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                    <option value="America/New_York">Nueva York (GMT-5)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Formato de fecha</Label>
                  <select
                    id="dateFormat"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={settings.display.dateFormat}
                    onChange={(e) => handleSettingChange('display', 'dateFormat', e.target.value)}
                  >
                    <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                    <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                    <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacidad */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Privacidad</CardTitle>
              <CardDescription>
                Controla cómo se utilizan tus datos y tu privacidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compartir datos para mejoras</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite compartir datos anonimizados para mejorar la plataforma
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.shareData}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'shareData', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Análisis de uso</Label>
                    <p className="text-sm text-muted-foreground">
                      Recopilar estadísticas de uso para análisis internos
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'analytics', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Comunicaciones de marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir información sobre nuevas funcionalidades y ofertas
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.marketing}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'marketing', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-red-600">Zona de Peligro</h4>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-red-700">Eliminar cuenta</Label>
                      <p className="text-sm text-red-600">
                        Esta acción no se puede deshacer. Se eliminarán todos tus datos.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datos */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Datos</CardTitle>
              <CardDescription>
                Exporta, importa y gestiona tus datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Exportación de Datos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Exportar todo</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Descarga todos tus datos en formato JSON
                    </p>
                    <Button size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar JSON
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Backup de seguridad</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Crea una copia de seguridad completa
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Crear Backup
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Estadísticas de Uso</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">142</div>
                    <div className="text-sm text-muted-foreground">Tareas creadas</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">28</div>
                    <div className="text-sm text-muted-foreground">Parcelas registradas</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">89</div>
                    <div className="text-sm text-muted-foreground">Elementos de inventario</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Limpieza de Datos</h4>
                <div className="space-y-3">
                  <Button variant="outline" size="sm">
                    Eliminar tareas completadas antiguas
                  </Button>
                  <Button variant="outline" size="sm">
                    Limpiar cache de mapas
                  </Button>
                  <Button variant="outline" size="sm">
                    Optimizar base de datos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}