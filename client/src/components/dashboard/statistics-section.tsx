import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BarChart, PieChart, FileDown, TrendingUp, DollarSign, Droplets, Scale } from "lucide-react";
import { ProductionRecord, EconomicRecord, EnvironmentalRecord } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function StatisticsSection() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch agricultural data
  const { data: productionRecords = [], isLoading: isLoadingProduction } = useQuery<ProductionRecord[]>({
    queryKey: ['/api/production-records'],
  });

  const { data: economicRecords = [], isLoading: isLoadingEconomic } = useQuery<EconomicRecord[]>({
    queryKey: ['/api/economic-records'],
  });

  const { data: environmentalRecords = [], isLoading: isLoadingEnvironmental } = useQuery<EnvironmentalRecord[]>({
    queryKey: ['/api/environmental-records'],
  });

  const isLoading = isLoadingProduction || isLoadingEconomic || isLoadingEnvironmental;

  // Calculate metrics from real data filtered by current company
  const calculateMetrics = () => {
    if (!user?.currentCompanyId) {
      return {
        totalProduction: 0,
        totalCosts: 0,
        profit: 0,
        profitMargin: 0,
        avgWaterUsage: 0,
        recordsCount: {
          production: 0,
          economic: 0,
          environmental: 0
        }
      };
    }

    // Filter records by current company
    const filteredProductionRecords = productionRecords.filter(record => record.companyId === user.currentCompanyId);
    const filteredEconomicRecords = economicRecords.filter(record => record.companyId === user.currentCompanyId);
    const filteredEnvironmentalRecords = environmentalRecords.filter(record => record.companyId === user.currentCompanyId);

    const totalProduction = filteredProductionRecords.reduce((sum, record) => sum + (record.quantityHarvested || 0), 0);
    const totalRevenue = filteredProductionRecords.reduce((sum, record) => 
      sum + ((record.quantityHarvested || 0) * (record.pricePerUnit || 0)), 0
    );
    const totalCosts = filteredEconomicRecords
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + (record.amount || 0), 0);
    const profit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const avgWaterUsage = filteredEnvironmentalRecords.length > 0 
      ? filteredEnvironmentalRecords.reduce((sum, record) => sum + (record.waterUsage || 0), 0) / filteredEnvironmentalRecords.length
      : 0;
    
    return {
      totalProduction,
      totalCosts,
      profit,
      profitMargin,
      avgWaterUsage,
      recordsCount: {
        production: filteredProductionRecords.length,
        economic: filteredEconomicRecords.length,
        environmental: filteredEnvironmentalRecords.length
      }
    };
  };

  const metrics = calculateMetrics();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Análisis Agrícola</h3>
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="h-48 bg-gray-100 rounded-md animate-pulse"></div>
          <div className="h-48 bg-gray-100 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-md">
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Análisis Agrícola</h3>
        <button 
          onClick={() => navigate('/analytics')}
          className="text-primary text-sm font-medium hover:underline focus:outline-none"
        >
          Ver análisis completo
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Análisis de Producción</h4>
          <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 rounded-md p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-800">{metrics.totalProduction.toFixed(1)} kg</span>
            </div>
            <p className="text-sm text-green-700 mb-2">Producción total registrada</p>
            <div className="text-xs text-green-600">
              {metrics.recordsCount.production} registros de producción
            </div>
            <button 
              onClick={() => navigate('/analytics')}
              className="mt-3 text-xs text-green-700 hover:text-green-800 underline text-left"
            >
              Ver análisis detallado →
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Análisis Económico</h4>
          <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-md p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-800">€{metrics.profit.toFixed(0)}</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">Beneficio neto</p>
            <div className="text-xs text-blue-600 space-y-1">
              <div>Costos: €{metrics.totalCosts.toFixed(0)}</div>
              <div>Margen: {metrics.profitMargin.toFixed(1)}%</div>
            </div>
            <button 
              onClick={() => navigate('/analytics')}
              className="mt-3 text-xs text-blue-700 hover:text-blue-800 underline text-left"
            >
              Ver análisis detallado →
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-md border border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-green-600 font-medium">Producción total</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-800">{metrics.totalProduction.toFixed(1)} kg</p>
          <div className="flex items-center text-xs mt-1">
            <span className="text-green-600">{metrics.recordsCount.production} registros</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-md border border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-600 font-medium">Costos totales</p>
            <DollarSign className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-800">€{metrics.totalCosts.toFixed(0)}</p>
          <div className="flex items-center text-xs mt-1">
            <span className="text-red-600">{metrics.recordsCount.economic} registros</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-600 font-medium">Beneficio neto</p>
            <Scale className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-800">€{metrics.profit.toFixed(0)}</p>
          <div className="flex items-center text-xs mt-1">
            <span className="text-blue-600">Margen: {metrics.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-3 rounded-md border border-cyan-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cyan-600 font-medium">Uso de agua promedio</p>
            <Droplets className="h-4 w-4 text-cyan-600" />
          </div>
          <p className="text-xl font-bold text-cyan-800">{metrics.avgWaterUsage.toFixed(1)} L</p>
          <div className="flex items-center text-xs mt-1">
            <span className="text-cyan-600">{metrics.recordsCount.environmental} registros</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between">
        <Button 
          variant="outline"
          onClick={() => window.open('/api/export/fields/excel', '_blank')}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.open('/api/export/fields/pdf', '_blank')}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Generar PDF
        </Button>
      </div>
    </div>
  );
}
