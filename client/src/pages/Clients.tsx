import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Client, insertClientSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Client form schema
const clientFormSchema = z.object({
  fullName: z.string().min(3, "Ad Soyad en az 3 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır"),
  gender: z.enum(["male", "female"], {
    required_error: "Cinsiyet seçimi zorunludur",
  }),
  birthDate: z.string().optional(),
  height: z.coerce.number().optional(),
  startingWeight: z.coerce.number().optional(),
  targetWeight: z.coerce.number().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"], {
    required_error: "Aktivite seviyesi zorunludur",
  }),
  medicalHistory: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Danışan verisi alınamadı');
      return response.json() as Promise<Client[]>;
    }
  });
  
  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowAddDialog(false);
      toast({
        title: "Başarılı",
        description: "Danışan başarıyla eklendi",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Danışan eklenirken bir hata oluştu: ${error.message}`,
      });
    }
  });
  
  // Client form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      gender: "female",
      activityLevel: "moderate",
      medicalHistory: "",
      dietaryRestrictions: "",
      notes: "",
    },
  });
  
  // Form submission
  function onSubmit(values: ClientFormValues) {
    addClientMutation.mutate(values);
  }
  
  // Filter clients based on search term
  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    
    if (!searchTerm) return clients;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.fullName.toLowerCase().includes(lowerCaseSearchTerm) || 
      client.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.phone.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [clients, searchTerm]);
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Danışanlar</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tüm danışanlarınızı yönetin.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <Input
              type="text"
              placeholder="Danışan ara..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Yeni Danışan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Yeni Danışan Ekle</DialogTitle>
                <DialogDescription>
                  Yeni bir danışan eklemek için aşağıdaki formu doldurun.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Soyad*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ad Soyad" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta*</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ornek@mail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon*</FormLabel>
                          <FormControl>
                            <Input placeholder="05xx xxx xx xx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cinsiyet*</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="female">Kadın</option>
                              <option value="male">Erkek</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doğum Tarihi</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boy (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="170" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="startingWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Başlangıç Kilosu (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="70" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hedef Kilo (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="activityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aktivite Seviyesi*</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="sedentary">Hareketsiz</option>
                              <option value="light">Hafif Aktif</option>
                              <option value="moderate">Orta Aktif</option>
                              <option value="active">Aktif</option>
                              <option value="very_active">Çok Aktif</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tıbbi Geçmiş</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Tıbbi geçmiş, kronik hastalıklar, alerjiler, vb."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dietaryRestrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diyet Kısıtlamaları</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Vejetaryen, vegan, glütensiz, laktoz intoleransı, vb."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notlar</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ek notlar..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addClientMutation.isPending}>
                      {addClientMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                        </>
                      ) : (
                        "Danışan Ekle"
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
          <span>Danışanlar yükleniyor...</span>
        </div>
      ) : (
        <>
          {filteredClients.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <i className="fas fa-users text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? "Arama sonucu bulunamadı" : "Henüz danışan eklemediniz"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? "Farklı bir arama terimi deneyin veya yeni bir danışan ekleyin."
                  : "İlk danışanınızı eklemek için 'Yeni Danışan' butonuna tıklayın."}
              </p>
              
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Yeni Danışan Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <a className="block">
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-primary bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center">
                            {client.profileImage ? (
                              <img 
                                src={client.profileImage} 
                                alt={`${client.fullName} profil resmi`} 
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <i className={`fas fa-${client.gender === 'female' ? 'female' : 'male'} text-primary`}></i>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{client.fullName}</CardTitle>
                            <CardDescription>{client.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500 dark:text-gray-400">Telefon:</div>
                          <div className="text-gray-700 dark:text-gray-300">{client.phone}</div>
                          
                          {client.height && (
                            <>
                              <div className="text-gray-500 dark:text-gray-400">Boy:</div>
                              <div className="text-gray-700 dark:text-gray-300">{client.height} cm</div>
                            </>
                          )}
                          
                          {client.startingWeight && (
                            <>
                              <div className="text-gray-500 dark:text-gray-400">Başlangıç:</div>
                              <div className="text-gray-700 dark:text-gray-300">{client.startingWeight} kg</div>
                            </>
                          )}
                          
                          {client.targetWeight && (
                            <>
                              <div className="text-gray-500 dark:text-gray-400">Hedef:</div>
                              <div className="text-gray-700 dark:text-gray-300">{client.targetWeight} kg</div>
                            </>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="ghost" className="w-full justify-start">
                          <i className="fas fa-eye mr-2"></i> Detayları Görüntüle
                        </Button>
                      </CardFooter>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
