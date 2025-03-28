import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Appointment, Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatDate";

// Appointment form schema
const appointmentFormSchema = z.object({
  clientId: z.coerce.number({
    required_error: "Danışan seçimi zorunludur",
  }),
  date: z.string({
    required_error: "Tarih zorunludur",
  }),
  time: z.string({
    required_error: "Saat zorunludur",
  }),
  duration: z.coerce.number().min(15, "Süre en az 15 dakika olmalıdır"),
  type: z.enum(["online", "in-person"], {
    required_error: "Görüşme tipi zorunludur",
  }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentView, setCurrentView] = useState<"upcoming" | "past">("upcoming");
  
  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Randevu verisi alınamadı');
      return response.json() as Promise<Appointment[]>;
    }
  });
  
  // Fetch clients for the select dropdown
  const { data: clients } = useQuery({
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
  
  // Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setShowAddDialog(false);
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla oluşturuldu",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Randevu oluşturulurken bir hata oluştu: ${error.message}`,
      });
    }
  });
  
  // Filter appointments based on current view
  const filteredAppointments = React.useMemo(() => {
    if (!appointments) return [];
    
    const now = new Date();
    
    if (currentView === "upcoming") {
      return appointments
        .filter(appointment => new Date(appointment.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      return appointments
        .filter(appointment => new Date(appointment.date) < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [appointments, currentView]);
  
  // Group appointments by date
  const groupedAppointments = React.useMemo(() => {
    const groups: { [key: string]: Appointment[] } = {};
    
    filteredAppointments.forEach(appointment => {
      const dateKey = new Date(appointment.date).toLocaleDateString('tr-TR');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(appointment);
    });
    
    return groups;
  }, [filteredAppointments]);
  
  // Appointment form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      duration: 60,
      type: "in-person",
      notes: "",
    },
  });
  
  // Form submission
  function onSubmit(values: AppointmentFormValues) {
    // Combine date and time for the API
    const dateTimeStr = `${values.date}T${values.time}:00`;
    const dateTime = new Date(dateTimeStr);
    
    const appointmentData = {
      clientId: values.clientId,
      date: dateTime.toISOString(),
      duration: values.duration,
      type: values.type,
      notes: values.notes,
      status: "scheduled"
    };
    
    addAppointmentMutation.mutate(appointmentData);
  }
  
  // Get client by ID
  const getClientById = (clientId: number) => {
    if (!clients) return null;
    return clients.find(client => client.id === clientId);
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Randevular</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tüm danışan randevularınızı yönetin.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                currentView === "upcoming"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setCurrentView("upcoming")}
            >
              <i className="fas fa-calendar-day mr-2"></i> Yaklaşan
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                currentView === "past"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setCurrentView("past")}
            >
              <i className="fas fa-history mr-2"></i> Geçmiş
            </button>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Yeni Randevu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
                <DialogDescription>
                  Danışan için yeni bir randevu oluşturun.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danışan*</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Danışan Seçin</option>
                            {clients?.map(client => (
                              <option key={client.id} value={client.id}>{client.fullName}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarih*</FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saat*</FormLabel>
                          <FormControl>
                            <input
                              type="time"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Süre (dakika)*</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="15">15 dakika</option>
                              <option value="30">30 dakika</option>
                              <option value="45">45 dakika</option>
                              <option value="60">60 dakika</option>
                              <option value="90">90 dakika</option>
                              <option value="120">120 dakika</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Randevu Tipi*</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="in-person">Yüz yüze</option>
                              <option value="online">Online</option>
                            </select>
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
                            placeholder="Randevu ile ilgili notlar..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addAppointmentMutation.isPending}>
                      {addAppointmentMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                        </>
                      ) : (
                        "Randevu Oluştur"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <i className="fas fa-spinner fa-spin text-primary text-2xl mr-2"></i>
          <span>Randevular yükleniyor...</span>
        </div>
      ) : (
        <>
          {Object.keys(groupedAppointments).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <i className="fas fa-calendar-times text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {currentView === "upcoming" 
                  ? "Yaklaşan randevunuz bulunmuyor" 
                  : "Geçmiş randevunuz bulunmuyor"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {currentView === "upcoming"
                  ? "Yeni bir randevu oluşturmak için 'Yeni Randevu' butonuna tıklayın."
                  : "Randevularınız tamamlandıkça burada görünecektir."}
              </p>
              
              {currentView === "upcoming" && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Yeni Randevu Oluştur
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
                <div key={date}>
                  <div className="flex items-center mb-4">
                    <div className="bg-primary bg-opacity-10 dark:bg-opacity-20 p-2 rounded-lg mr-3">
                      <i className="fas fa-calendar-day text-primary text-xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {date}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayAppointments.map((appointment) => {
                      const client = getClientById(appointment.clientId);
                      const appointmentDate = new Date(appointment.date);
                      const timeString = appointmentDate.toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      });
                      
                      const endTime = new Date(appointmentDate.getTime() + appointment.duration * 60000);
                      const endTimeString = endTime.toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      });
                      
                      return (
                        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                                  {client?.profileImage ? (
                                    <img 
                                      src={client.profileImage} 
                                      alt={`${client.fullName} profil resmi`} 
                                      className="h-12 w-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <i className="fas fa-user text-gray-500 dark:text-gray-400"></i>
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-base">{client?.fullName || "Danışan"}</CardTitle>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {timeString} - {endTimeString}
                                  </div>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                appointment.type === 'online' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {appointment.type === 'online' ? 'Online' : 'Yüz yüze'}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <i className="fas fa-sticky-note text-gray-400 mr-2"></i>
                                {appointment.notes}
                              </p>
                            )}
                            
                            <div className="mt-4 flex gap-2">
                              {appointment.type === 'online' && (
                                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                                  <i className="fas fa-video mr-2"></i> Görüşmeye Başla
                                </Button>
                              )}
                              
                              <Button size="sm" variant="outline">
                                <i className="fas fa-edit mr-2"></i> Düzenle
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
