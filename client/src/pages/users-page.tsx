import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, UserRole, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ConfirmationDialog from "@/components/common/confirmation-dialog";

import AppHeader from "@/components/layout/app-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ConnectionStatus from "@/components/common/connection-status";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { Loader2, Plus, Search, UserCog, Shield, Calendar, UserX } from "lucide-react";

// Extended schema for form validation with password confirmation
const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, { message: "Confirme su contraseña" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { isOffline } = useOffline();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Check if current user is admin
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<UserFormValues, 'confirmPassword'>) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el usuario: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: UserRole.WORKER,
    },
  });

  // Handle form submission
  const onSubmit = (data: UserFormValues) => {
    // Remove confirmPassword as it's not part of the API schema
    const { confirmPassword, ...userData } = data;
    createMutation.mutate(userData);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    form.reset();
    setOpenDialog(false);
  };

  // Filter users based on search term
  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get role badge color and icon
  const getRoleBadge = (role: string) => {
    switch(role) {
      case UserRole.ADMIN:
        return {
          color: "bg-red-100 text-red-800",
          icon: <Shield className="h-4 w-4 mr-1" />
        };
      case UserRole.MANAGER:
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <UserCog className="h-4 w-4 mr-1" />
        };
      case UserRole.WORKER:
        return {
          color: "bg-green-100 text-green-800",
          icon: <Calendar className="h-4 w-4 mr-1" />
        };
      case UserRole.VIEWER:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <UserX className="h-4 w-4 mr-1" />
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: null
        };
    }
  };

  // Format role name
  const formatRoleName = (role: string) => {
    switch(role) {
      case UserRole.ADMIN:
        return "Administrador";
      case UserRole.MANAGER:
        return "Gestor";
      case UserRole.WORKER:
        return "Trabajador";
      case UserRole.VIEWER:
        return "Visualizador";
      default:
        return role;
    }
  };

  // Format date
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Show offline status */}
      {isOffline && <ConnectionStatus />}
      
      {/* Top AppBar */}
      <AppHeader user={currentUser} />

      <div className="flex flex-grow h-full overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNavigation activePath="/users" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Buscar usuarios..." 
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isAdmin && (
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        Añadir nuevo usuario
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del usuario" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de usuario</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de usuario para login" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rol</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un rol" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                                  <SelectItem value={UserRole.MANAGER}>Gestor</SelectItem>
                                  <SelectItem value={UserRole.WORKER}>Trabajador</SelectItem>
                                  <SelectItem value={UserRole.VIEWER}>Visualizador</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Contraseña" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar contraseña</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirmar contraseña" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button variant="outline" type="button" onClick={handleDialogClose}>
                            Cancelar
                          </Button>
                          <Button 
                            type="submit"
                            disabled={createMutation.isPending}
                          >
                            {createMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>Crear usuario</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Listado de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última conexión</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-sm text-gray-500">
                            No hay usuarios que coincidan con la búsqueda
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-lg font-medium text-gray-600">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role).color}`}>
                                {getRoleBadge(user.role).icon}
                                {formatRoleName(user.role)}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.lastLogin)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activePath="/users" />
    </div>
  );
}
