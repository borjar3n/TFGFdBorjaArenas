import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, TrendingUp, DollarSign, Droplets, BarChart3, Calculator, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Field, ProductionRecord, EconomicRecord, EnvironmentalRecord } from '@/../../shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

// Schemas para los formularios
const productionEstimateSchema = z.object({
  fieldId: z.number(),
  crop: z.string().min(1, 'El cultivo es requerido'),
  season: z.string().min(1, 'La temporada es requerida'),
  quantityHarvested: z.number().min(0, 'La cantidad debe ser positiva'),
  quality: z.string().optional(),
  pricePerUnit: z.number().min(0, 'El precio debe ser positivo').optional(),
  harvestDate: z.string().optional(),
  notes: z.string().optional(),
});

const costEstimateSchema = z.object({
  fieldId: z.number().optional(),
  type: z.literal('expense'),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().min(0, 'El monto debe ser positivo'),
  date: z.string(),
  season: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

const waterEfficiencySchema = z.object({
  fieldId: z.number(),
  recordDate: z.string(),
  waterUsage: z.number().min(0, 'El uso de agua debe ser positivo'),
  soilMoisture: z.number().min(0).max(100, 'La humedad debe estar entre 0 y 100').optional(),
  ambientTemperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),
  rainfall: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type ProductionEstimateForm = z.infer<typeof productionEstimateSchema>;
type CostEstimateForm = z.infer<typeof costEstimateSchema>;
type WaterEfficiencyForm = z.infer<typeof waterEfficiencySchema>;

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('production');
  const [formKey, setFormKey] = useState(0); // Para forzar re-render de formularios

  // Queries
  const { data: fields = [] } = useQuery<Field[]>({
    queryKey: ['/api/fields'],
  });

  const { data: productionRecords = [] } = useQuery<ProductionRecord[]>({
    queryKey: ['/api/production-records'],
  });

  const { data: economicRecords = [] } = useQuery<EconomicRecord[]>({
    queryKey: ['/api/economic-records'],
  });

  const { data: environmentalRecords = [] } = useQuery<EnvironmentalRecord[]>({
    queryKey: ['/api/environmental-records'],
  });

  // Forms
  const productionForm = useForm<ProductionEstimateForm>({
    resolver: zodResolver(productionEstimateSchema),
    defaultValues: {
      quality: 'standard',
      season: `${new Date().getFullYear()}-${new Date().getMonth() < 6 ? 'primavera' : 'otoño'}`,
    },
  });

  const costForm = useForm<CostEstimateForm>({
    resolver: zodResolver(costEstimateSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      season: `${new Date().getFullYear()}-${new Date().getMonth() < 6 ? 'primavera' : 'otoño'}`,
    },
  });

  const waterForm = useForm<WaterEfficiencyForm>({
    resolver: zodResolver(waterEfficiencySchema),
    defaultValues: {
      recordDate: new Date().toISOString().split('T')[0],
    },
  });

  // Mutations
  const createProductionMutation = useMutation({
    mutationFn: (data: ProductionEstimateForm) => {
      console.log('Production data being sent:', data);
      return apiRequest('POST', '/api/production-records', {
        ...data,
        harvestDate: data.harvestDate ? new Date(data.harvestDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast({ title: 'Registro de producción creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/production-records'] });
      
      // Forzar reseteo completo del formulario
      productionForm.reset();
      setFormKey(prev => prev + 1); // Fuerza re-render completo
    },
    onError: (error) => {
      console.error('Error creating production record:', error);
      toast({ title: 'Error al crear el registro de producción', variant: 'destructive' });
    },
  });

  const createCostMutation = useMutation({
    mutationFn: (data: CostEstimateForm) => {
      console.log('Cost data being sent:', data);
      return apiRequest('POST', '/api/economic-records', {
        ...data,
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: 'Registro de costo creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/economic-records'] });
      costForm.reset();
      setFormKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Error creating cost record:', error);
      toast({ title: 'Error al crear el registro de costo', variant: 'destructive' });
    },
  });

  const createWaterMutation = useMutation({
    mutationFn: (data: WaterEfficiencyForm) => {
      console.log('Water data being sent:', data);
      return apiRequest('POST', '/api/environmental-records', {
        ...data,
        recordDate: new Date(data.recordDate).toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: 'Registro de eficiencia hídrica creado exitosamente' });
      queryClient.invalidateQueries({ queryKey: ['/api/environmental-records'] });
      waterForm.reset();
      setFormKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Error creating water record:', error);
      toast({ title: 'Error al crear el registro de eficiencia hídrica', variant: 'destructive' });
    },
  });

  // Calculations filtered by current company
  const calculateMetrics = () => {
    if (!user?.currentCompanyId) {
      return {
        totalProduction: 0,
        totalCosts: 0,
        totalRevenue: 0,
        profit: 0,
        profitMargin: 0,
        totalWaterUsage: 0,
        waterEfficiency: 0,
      };
    }

    // Filter records by current company
    const filteredProductionRecords = productionRecords.filter(record => record.companyId === user.currentCompanyId);
    const filteredEconomicRecords = economicRecords.filter(record => record.companyId === user.currentCompanyId);
    const filteredEnvironmentalRecords = environmentalRecords.filter(record => record.companyId === user.currentCompanyId);

    const totalProduction = filteredProductionRecords.reduce((sum, record) => 
      sum + (record.quantityHarvested || 0), 0);
    
    const totalCosts = filteredEconomicRecords
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const totalRevenue = filteredProductionRecords.reduce((sum, record) => 
      sum + ((record.quantityHarvested || 0) * (record.pricePerUnit || 0)), 0);
    
    const totalWaterUsage = filteredEnvironmentalRecords.reduce((sum, record) => 
      sum + (record.waterUsage || 0), 0);
    
    const waterEfficiency = totalProduction > 0 && totalWaterUsage > 0 
      ? totalWaterUsage / totalProduction 
      : 0;

    return {
      totalProduction,
      totalCosts,
      totalRevenue,
      profit: totalRevenue - totalCosts,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0,
      totalWaterUsage,
      waterEfficiency,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análisis Agrícola</h1>
          <p className="text-muted-foreground">
            Gestiona datos de producción, costos y eficiencia hídrica
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </Link>
      </div>

      {/* Métricas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producción Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProduction.toFixed(1)} t</div>
            <p className="text-xs text-muted-foreground">
              {user?.currentCompanyId ? productionRecords.filter(r => r.companyId === user.currentCompanyId).length : 0} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics.totalCosts.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Ganancia: €{metrics.profit.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen de Ganancia</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Ingresos: €{metrics.totalRevenue.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia Hídrica</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.waterEfficiency.toFixed(1)} L/kg</div>
            <p className="text-xs text-muted-foreground">
              Total agua: {metrics.totalWaterUsage.toFixed(0)} L
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production">Producción Estimada</TabsTrigger>
          <TabsTrigger value="costs">Costos Estimados</TabsTrigger>
          <TabsTrigger value="water">Eficiencia Hídrica</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario de producción */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nueva Estimación de Producción
                </CardTitle>
                <CardDescription>
                  Registra datos de producción para análisis futuro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form key={`production-${formKey}`} onSubmit={productionForm.handleSubmit((data) => createProductionMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="fieldId">Parcela</Label>
                    <Select onValueChange={(value) => productionForm.setValue('fieldId', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una parcela" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id.toString()}>
                            {field.name} ({field.area} ha)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="crop">Cultivo</Label>
                      <Input {...productionForm.register('crop')} placeholder="Ej: Trigo, Maíz" />
                    </div>
                    <div>
                      <Label htmlFor="season">Temporada</Label>
                      <Input {...productionForm.register('season')} placeholder="2024-primavera" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantityHarvested">Cantidad (toneladas)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...productionForm.register('quantityHarvested', { valueAsNumber: true })}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pricePerUnit">Precio por tonelada (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...productionForm.register('pricePerUnit', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quality">Calidad</Label>
                      <Select onValueChange={(value) => productionForm.setValue('quality', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona calidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="standard">Estándar</SelectItem>
                          <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="harvestDate">Fecha de cosecha</Label>
                      <Input type="date" {...productionForm.register('harvestDate')} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea {...productionForm.register('notes')} placeholder="Observaciones adicionales..." />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createProductionMutation.isPending}
                    className="w-full"
                  >
                    {createProductionMutation.isPending ? 'Guardando...' : 'Guardar Registro'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de registros de producción */}
            <Card>
              <CardHeader>
                <CardTitle>Registros de Producción</CardTitle>
                <CardDescription>{productionRecords.length} registros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {productionRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{record.crop}</h4>
                          <p className="text-sm text-muted-foreground">{record.season}</p>
                        </div>
                        <Badge variant={record.quality === 'premium' ? 'default' : 'secondary'}>
                          {record.quality}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between">
                          <span>Cantidad:</span>
                          <span className="font-medium">{record.quantityHarvested} t</span>
                        </div>
                        {record.pricePerUnit && (
                          <div className="flex justify-between">
                            <span>Ingresos:</span>
                            <span className="font-medium">€{((record.quantityHarvested || 0) * record.pricePerUnit).toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario de costos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Nuevo Registro de Costo
                </CardTitle>
                <CardDescription>
                  Registra gastos para análisis económico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form key={`costs-${formKey}`} onSubmit={costForm.handleSubmit((data) => createCostMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="fieldId">Parcela (opcional)</Label>
                    <Select onValueChange={(value) => costForm.setValue('fieldId', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una parcela" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Gasto general</SelectItem>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id.toString()}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <Select onValueChange={(value) => costForm.setValue('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semillas">Semillas</SelectItem>
                          <SelectItem value="fertilizantes">Fertilizantes</SelectItem>
                          <SelectItem value="pesticidas">Pesticidas</SelectItem>
                          <SelectItem value="mano_obra">Mano de obra</SelectItem>
                          <SelectItem value="combustible">Combustible</SelectItem>
                          <SelectItem value="maquinaria">Maquinaria</SelectItem>
                          <SelectItem value="transporte">Transporte</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Monto (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...costForm.register('amount', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input {...costForm.register('description')} placeholder="Describe el gasto..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Fecha</Label>
                      <Input type="date" {...costForm.register('date')} />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Proveedor</Label>
                      <Input {...costForm.register('supplier')} placeholder="Nombre del proveedor" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea {...costForm.register('notes')} placeholder="Información adicional..." />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createCostMutation.isPending}
                    className="w-full"
                  >
                    {createCostMutation.isPending ? 'Guardando...' : 'Guardar Costo'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de registros de costos */}
            <Card>
              <CardHeader>
                <CardTitle>Registros de Costos</CardTitle>
                <CardDescription>{economicRecords.filter(r => r.type === 'expense').length} gastos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {economicRecords
                    .filter(record => record.type === 'expense')
                    .map((record) => (
                    <div key={record.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{record.description}</h4>
                          <p className="text-sm text-muted-foreground">{record.category}</p>
                        </div>
                        <span className="font-bold text-red-600">€{record.amount.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Fecha:</span>
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        {record.supplier && (
                          <div className="flex justify-between">
                            <span>Proveedor:</span>
                            <span>{record.supplier}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="water" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario de eficiencia hídrica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Nuevo Registro de Agua
                </CardTitle>
                <CardDescription>
                  Registra el uso de agua y condiciones ambientales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form key={`water-${formKey}`} onSubmit={waterForm.handleSubmit((data) => createWaterMutation.mutate(data))} className="space-y-4">
                  <div>
                    <Label htmlFor="fieldId">Parcela</Label>
                    <Select onValueChange={(value) => waterForm.setValue('fieldId', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una parcela" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id.toString()}>
                            {field.name} ({field.area} ha)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recordDate">Fecha</Label>
                      <Input type="date" {...waterForm.register('recordDate')} />
                    </div>
                    <div>
                      <Label htmlFor="waterUsage">Agua usada (litros)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...waterForm.register('waterUsage', { valueAsNumber: true })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="soilMoisture">Humedad del suelo (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...waterForm.register('soilMoisture', { valueAsNumber: true })}
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ambientTemperature">Temperatura (°C)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...waterForm.register('ambientTemperature', { valueAsNumber: true })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="humidity">Humedad ambiental (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...waterForm.register('humidity', { valueAsNumber: true })}
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rainfall">Lluvia (mm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        {...waterForm.register('rainfall', { valueAsNumber: true })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea {...waterForm.register('notes')} placeholder="Condiciones, método de riego, observaciones..." />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createWaterMutation.isPending}
                    className="w-full"
                  >
                    {createWaterMutation.isPending ? 'Guardando...' : 'Guardar Registro'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de registros de eficiencia hídrica */}
            <Card>
              <CardHeader>
                <CardTitle>Registros de Eficiencia Hídrica</CardTitle>
                <CardDescription>{environmentalRecords.length} mediciones registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {environmentalRecords.map((record) => {
                    const field = fields.find(f => f.id === record.fieldId);
                    return (
                      <div key={record.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{field?.name || 'Parcela desconocida'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.recordDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="font-bold text-blue-600">
                            {record.waterUsage?.toFixed(0) || 0} L
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            {record.soilMoisture && (
                              <div className="flex justify-between">
                                <span>Humedad suelo:</span>
                                <span>{record.soilMoisture}%</span>
                              </div>
                            )}
                            {record.ambientTemperature && (
                              <div className="flex justify-between">
                                <span>Temperatura:</span>
                                <span>{record.ambientTemperature}°C</span>
                              </div>
                            )}
                            {record.rainfall && (
                              <div className="flex justify-between">
                                <span>Lluvia:</span>
                                <span>{record.rainfall} mm</span>
                              </div>
                            )}
                            {record.humidity && (
                              <div className="flex justify-between">
                                <span>Humedad amb.:</span>
                                <span>{record.humidity}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}