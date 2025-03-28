import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Client, Measurement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateBMI, getBMIClassification, estimateBodyFatPercentage } from "@/utils/calculations";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from "recharts";

// Measurement form schema
const measurementFormSchema = z.object({
  clientId: z.coerce.number({
    required_error: "Danışan seçimi zorunludur",
  }),
  weight: z.coerce.number().min(20, "Ağırlık en az 20kg olmalıdır").max(300, "Ağırlık en fazla 300kg olabilir"),
  chest: z.coerce.number().optional(),
  waist: z.coerce.number().optional(),
  hip: z.coerce.number().optional(),
  arm: z.coerce.number().optional(),
  thigh: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

export default function Measurements() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Danışan listesi alınamadı');
      return response.json() as Promise<Client[]>;
    }
  });
  
  // Fetch measurements for selected client
  const { data: measurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ['/api/clients', selectedClientId, 'measurements'],
    queryFn: async () => {
      if (!selectedClientId) return null;
      
      const response = await fetch(`/api/clients/${selectedClientId}/measurements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Ölçüm verisi alınamadı');
      return response.json() as Promise<Measurement[]>;
    },
    enabled: !!selectedClientId
  });
  
  // Add measurement mutation
  const addMeasurementMutation = useMutation({
    mutationFn: async (data: MeasurementFormValues) => {
      const response = await apiRequest("POST", `/api/clients/${data.clientId}/measurements`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', selectedClientId, 'measurements'] });
      setShowAddDialog(false);
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla kaydedildi",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Ölçüm kaydedilirken bir hata oluştu: ${error.message}`,
      });
    }
  });
  
  // Measurement form
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      clientId: selectedClientId || undefined,
    },
  });
  
  // Update form default values when selected client changes
  React.useEffect(() => {
    if (selectedClientId) {
      form.setValue("clientId", selectedClientId);
    }
  }, [selectedClientId, form]);
  
  // Form submission
  function onSubmit(values: MeasurementFormValues) {
    // Calculate body fat percentage if possible
    const selectedClient = clients?.find(c => c.id === values.clientId);
    
    if (selectedClient && selectedClient.height && selectedClient.gender) {
      const height = Number(selectedClient.height);
      const weight = values.weight;
      const bmi = calculateBMI(weight, height);
      
      // Estimate age from birth date or use a default
      let age = 30;
      if (selectedClient.birthDate) {
        const birthDate = new Date(selectedClient.birthDate);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
      }
      
      const bodyFatPercentage = estimateBodyFatPercentage(bmi, age, selectedClient.gender as any);
      
      // Add body fat percentage to submission
      const dataWithBodyFat = {
        ...values,
        bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10
      };
      
      addMeasurementMutation.mutate(dataWithBodyFat);
    } else {
      addMeasurementMutation.mutate(values);
    }
  }
  
  // Get selected client
  const selectedClient = selectedClientId ? clients?.find(c => c.id === selectedClientId) : null;
  
  // Prepare chart data for weight
  const weightChartData = React.useMemo(() => {
    if (!measurements) return [];
    
    return measurements.map(measurement => ({
      date: new Date(measurement.date).toLocaleDateString('tr-TR'),
      weight: Number(measurement.weight)
    })).reverse();
  }, [measurements]);
  
  // Calculate latest measurements and changes
  const latestMeasurements = React.useMemo(() => {
    if (!measurements || measurements.length === 0) return null;
    
    const latest = measurements[0];
    
    // If we have previous measurements, calculate changes
    let changes = null;
    if (measurements.length > 1) {
      const previous = measurements[1];
      
      changes = {
        weight: Number(latest.weight) - Number(previous.weight),
        chest: latest.chest && previous.chest ? Number(latest.chest) - Number(previous.chest) : null,
        waist: latest.waist && previous.waist ? Number(latest.waist) - Number(previous.waist) : null,
        hip: latest.hip && previous.hip ? Number(latest.hip) - Number(previous.hip) : null,
        arm: latest.arm && previous.arm ? Number(latest.arm) - Number(previous.arm) : null,
        thigh: latest.thigh && previous.thigh ? Number(latest.thigh) - Number(previous.thigh) : null,
      };
    }
    
    // Calculate BMI if we have height data
    let bmi = null;
    let bmiClassification = null;
    
    if (selectedClient?.height && latest.weight) {
      bmi = calculateBMI(Number(latest.weight), Number(selectedClient.height));
      bmiClassification = getBMIClassification(bmi);
    }
    
    return {
      latest,
      changes,
      bmi,
      bmiClassification
    };
  }, [measurements, selectedClient]);
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Ölçümler</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Danışanlarınızın vücut ölçümlerini takip edin.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          {selectedClientId && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <i className="fas fa-plus mr-2"></i>
                  Yeni Ölçüm
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Yeni Ölçüm Ekle</DialogTitle>
                  <DialogDescription>
                    {selectedClient?.fullName} için yeni bir ölçüm kaydedin.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <input type="hidden" {...form.register("clientId")} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ağırlık (kg)*</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="chest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Göğüs (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="waist"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bel (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kalça (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="arm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kol (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="thigh"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bacak (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field} 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notlar</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Ölçümler ile ilgili notlar..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={addMeasurementMutation.isPending}>
                        {addMeasurementMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                          </>
                        ) : (
                          "Ölçüm Kaydet"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Client selection sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danışan Seçimi</CardTitle>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="flex justify-center py-4">
                  <i className="fas fa-spinner fa-spin text-primary text-xl"></i>
                </div>
              ) : (
                <>
                  {clients && clients.length > 0 ? (
                    <div className="space-y-2">
                      {clients.map(client => (
                        <button
                          key={client.id}
                          className={`w-full text-left py-2 px-3 rounded-md flex items-center ${
                            selectedClientId === client.id
                              ? "bg-primary text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => setSelectedClientId(client.id)}
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                            {client.profileImage ? (
                              <img 
                                src={client.profileImage} 
                                alt={client.fullName}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <i className={`fas fa-${client.gender === 'female' ? 'female' : 'male'}`}></i>
                            )}
                          </div>
                          <span>{client.fullName}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p>Henüz danışan eklenmemiş.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Measurements display area */}
        <div className="md:col-span-2 lg:col-span-3">
          {selectedClientId ? (
            <>
              {measurementsLoading ? (
                <div className="flex justify-center py-12">
                  <i className="fas fa-spinner fa-spin text-primary text-2xl mr-2"></i>
                  <span>Ölçümler yükleniyor...</span>
                </div>
              ) : (
                <>
                  {!measurements || measurements.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
                      <i className="fas fa-weight text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Henüz ölçüm kaydedilmemiş
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {selectedClient?.fullName} için ilk ölçümü kaydetmek için 'Yeni Ölçüm' butonuna tıklayın.
                      </p>
                      
                      <Button onClick={() => setShowAddDialog(true)}>
                        <i className="fas fa-plus mr-2"></i>
                        Yeni Ölçüm Ekle
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Summary cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {/* Weight card */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
                                Güncel Ağırlık
                              </h3>
                              <div className="bg-primary bg-opacity-10 dark:bg-opacity-20 p-2 rounded-full">
                                <i className="fas fa-weight text-primary"></i>
                              </div>
                            </div>
                            <div className="flex items-end">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {latestMeasurements?.latest.weight} kg
                              </span>
                              
                              {latestMeasurements?.changes?.weight !== null && (
                                <span className={`ml-2 text-sm ${
                                  latestMeasurements.changes.weight < 0 
                                    ? 'text-green-500' 
                                    : latestMeasurements.changes.weight > 0 
                                      ? 'text-red-500' 
                                      : 'text-gray-500'
                                }`}>
                                  {latestMeasurements.changes.weight < 0 ? '↓' : latestMeasurements.changes.weight > 0 ? '↑' : ''}
                                  {' '}
                                  {Math.abs(latestMeasurements.changes.weight).toFixed(1)} kg
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Son ölçüm: {new Date(latestMeasurements.latest.date).toLocaleDateString('tr-TR')}
                            </p>
                          </CardContent>
                        </Card>
                        
                        {/* BMI card */}
                        {latestMeasurements?.bmi && (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
                                  Vücut Kitle İndeksi
                                </h3>
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                  <i className="fas fa-calculator text-blue-600 dark:text-blue-400"></i>
                                </div>
                              </div>
                              <div className="flex items-end">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                  {latestMeasurements.bmi.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {latestMeasurements.bmiClassification}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Body fat card */}
                        {latestMeasurements?.latest.bodyFatPercentage && (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
                                  Vücut Yağ Oranı
                                </h3>
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                                  <i className="fas fa-percentage text-amber-600 dark:text-amber-400"></i>
                                </div>
                              </div>
                              <div className="flex items-end">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                  %{latestMeasurements.latest.bodyFatPercentage}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Tahmini değer
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      {/* Weight chart */}
                      {weightChartData.length > 0 && (
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle className="text-base">Ağırlık Değişimi</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={weightChartData}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis 
                                    domain={['auto', 'auto']}
                                    label={{ value: 'Kilo (kg)', angle: -90, position: 'insideLeft' }} 
                                  />
                                  <Tooltip />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="weight" 
                                    name="Ağırlık (kg)"
                                    stroke="#10b981" 
                                    activeDot={{ r: 8 }} 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Detailed measurements table */}
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Tüm Ölçümler</CardTitle>
                            <Button size="sm" onClick={() => setShowAddDialog(true)}>
                              <i className="fas fa-plus mr-2"></i> Yeni Ölçüm
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead>
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ağırlık</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Göğüs</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bel</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kalça</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kol</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bacak</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yağ %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {measurements.map((measurement, index) => (
                                  <tr key={measurement.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      {new Date(measurement.date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{measurement.weight} kg</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{measurement.chest ? `${measurement.chest} cm` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{measurement.waist ? `${measurement.waist} cm` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{measurement.hip ? `${measurement.hip} cm` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{measurement.arm ? `${measurement.arm} cm` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{measurement.thigh ? `${measurement.thigh} cm` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      {measurement.bodyFatPercentage ? `%${measurement.bodyFatPercentage}` : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <i className="fas fa-user-check text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Lütfen bir danışan seçin
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Ölçümleri görüntülemek için soldaki listeden bir danışan seçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
