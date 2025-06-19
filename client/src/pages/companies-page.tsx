import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Users, Settings, Copy, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { insertCompanySchema, insertInvitationCodeSchema, type Company, type InvitationCode, type InsertCompany, type InsertInvitationCode } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CompaniesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const { data: allInvitationCodes = [] } = useQuery<InvitationCode[]>({
    queryKey: ['/api/invitation-codes'],
  });

  const createCompanyForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
    },
  });

  const editCompanyForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
    },
  });

  const createInviteForm = useForm<InsertInvitationCode>({
    resolver: zodResolver(insertInvitationCodeSchema.omit({ code: true, companyId: true, createdBy: true })),
    defaultValues: {
      role: "worker",
      permissions: {},
      maxUses: 1,
      expiresAt: undefined,
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      const res = await apiRequest("POST", "/api/companies", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({ title: "Explotación creada exitosamente" });
      setIsCreateDialogOpen(false);
      createCompanyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear explotación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCompany }) => {
      const res = await apiRequest("PUT", `/api/companies/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({ title: "Explotación actualizada exitosamente" });
      setIsEditDialogOpen(false);
      setEditingCompany(null);
      editCompanyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar explotación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: Omit<InsertInvitationCode, 'code' | 'companyId' | 'createdBy'>) => {
      const res = await apiRequest("POST", "/api/invitation-codes", {
        ...data,
        companyId: selectedCompanyId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitation-codes'] });
      toast({ title: "Código de invitación creado exitosamente" });
      setIsInviteDialogOpen(false);
      createInviteForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear código de invitación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({ title: "Código copiado al portapapeles" });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Error al copiar código",
        variant: "destructive",
      });
    }
  };

  const onCreateCompany = (data: InsertCompany) => {
    createCompanyMutation.mutate(data);
  };

  const onEditCompany = (data: InsertCompany) => {
    if (editingCompany) {
      editCompanyMutation.mutate({ id: editingCompany.id, data });
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    editCompanyForm.reset({
      name: company.name,
      description: company.description || "",
      address: company.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const onCreateInvite = (data: Omit<InsertInvitationCode, 'code' | 'companyId' | 'createdBy'>) => {
    createInviteMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando explotaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Explotaciones</h1>
            <p className="text-muted-foreground">Administra las explotaciones agrícolas y códigos de acceso</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Explotación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Explotación</DialogTitle>
            </DialogHeader>
            <Form {...createCompanyForm}>
              <form onSubmit={createCompanyForm.handleSubmit(onCreateCompany)} className="space-y-4">
                <FormField
                  control={createCompanyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Explotación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Finca Los Olivos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createCompanyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción de la explotación..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createCompanyForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección completa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCompanyMutation.isPending}>
                    {createCompanyMutation.isPending ? "Creando..." : "Crear Explotación"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{company.name}</span>
                <Badge variant="secondary">ID: {company.id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.description && (
                <p className="text-sm text-muted-foreground">{company.description}</p>
              )}
              {company.address && (
                <p className="text-xs text-muted-foreground">{company.address}</p>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(company)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Dialog open={isInviteDialogOpen && selectedCompanyId === company.id} 
                        onOpenChange={(open) => {
                          setIsInviteDialogOpen(open);
                          if (open) setSelectedCompanyId(company.id);
                        }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      Invitar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Código de Invitación</DialogTitle>
                    </DialogHeader>
                    <Form {...createInviteForm}>
                      <form onSubmit={createInviteForm.handleSubmit(onCreateInvite)} className="space-y-4">
                        <FormField
                          control={createInviteForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rol</FormLabel>
                              <FormControl>
                                <select {...field} className="w-full p-2 border rounded">
                                  <option value="worker">Trabajador</option>
                                  <option value="company_admin">Administrador</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createInviteForm.control}
                          name="maxUses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Máximo de usos</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={createInviteMutation.isPending}>
                            {createInviteMutation.isPending ? "Creando..." : "Crear Código"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Códigos de invitación activos */}
              {allInvitationCodes
                .filter(code => code.isActive && code.companyId === company.id)
                .length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Códigos Activos:</h4>
                  <div className="space-y-2">
                    {allInvitationCodes
                      .filter(code => code.isActive && code.companyId === company.id)
                      .map((code) => (
                        <div key={code.id} className="flex items-center justify-between bg-muted p-2 rounded text-xs">
                          <div>
                            <span className="font-mono">{code.code}</span>
                            <Badge variant="outline" className="ml-2">{code.role}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(code.code)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedCode === code.code ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay explotaciones registradas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera explotación agrícola para comenzar a gestionar tus operaciones.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Explotación
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Explotación</DialogTitle>
          </DialogHeader>
          <Form {...editCompanyForm}>
            <form onSubmit={editCompanyForm.handleSubmit(onEditCompany)} className="space-y-4">
              <FormField
                control={editCompanyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Explotación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Finca Los Olivos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editCompanyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción de la explotación..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editCompanyForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={editCompanyMutation.isPending}
                >
                  {editCompanyMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}