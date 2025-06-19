import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Company } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CompanySelector() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user's companies
  const companiesQuery = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Mutation to switch company
  const switchCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await apiRequest("PUT", "/api/user/current-company", { companyId });
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      // Invalidate all data to reload with new company context
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/field-activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-transactions"] });
      
      toast({
        title: "Empresa cambiada",
        description: "Los datos se han actualizado para la nueva empresa",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cambiar empresa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user || !companiesQuery.data || companiesQuery.data.length <= 1) {
    return null;
  }

  const currentCompany = companiesQuery.data.find(c => c.id === user.currentCompanyId);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-gray-50">
      <Building2 className="h-4 w-4 text-gray-600" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Empresa:</span>
        <Select
          value={user.currentCompanyId?.toString() || ""}
          onValueChange={(value) => {
            const companyId = parseInt(value);
            if (companyId !== user.currentCompanyId) {
              switchCompanyMutation.mutate(companyId);
            }
          }}
          disabled={switchCompanyMutation.isPending}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{currentCompany?.name || "Seleccionar empresa"}</span>
                {switchCompanyMutation.isPending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {companiesQuery.data.map((company) => (
              <SelectItem key={company.id} value={company.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{company.name}</span>
                  {company.id === user.currentCompanyId && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {currentCompany && (
        <Badge variant="secondary" className="text-xs">
          Activa
        </Badge>
      )}
    </div>
  );
}