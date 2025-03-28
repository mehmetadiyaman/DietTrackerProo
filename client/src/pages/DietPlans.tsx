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
import { DietPlan, Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateMacros } from "@/utils/calculations";

// Meal type
interface Meal {
  name: string;
  foods: {
    name: string;
    amount: string;
    calories?: number;
  }[];
}

// Diet plan form schema
const dietPlanFormSchema = z.object({
  clientId: z.coerce.number({
    required_error: "Danışan seçimi zorunludur",
  }),
  name: z.string().min(3, "Plan adı en az 3 karakter olmalıdır"),
  description: z.string().optional(),
  startDate: z.string({
    required_error: "Başlangıç tarihi zorunludur",
  }),
  endDate: z.string().optional(),
  dailyCalories: z.coerce.number().min(1, "Günlük kalori değeri girilmelidir"),
  macroProtein: z.coerce.number().min(0, "Protein değeri 0 veya daha büyük olmalıdır"),
  macroCarbs: z.coerce.number().min(0, "Karbonhidrat değeri 0 veya daha büyük olmalıdır"),
  macroFat: z.coerce.number().min(0, "Yağ değeri 0 veya daha büyük olmalıdır"),
  meals: z.array(
    z.object({
      name: z.string(),
      foods: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
          calories: z.number().optional(),
        })
      ),
    })
  ),
});

type DietPlanFormValues = z.infer<typeof dietPlanFormSchema>;

export default function DietPlans() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [initialMeals, setInitialMeals] = useState<Meal[]>([
    { name: "Kahvaltı", foods: [{ name: "", amount: "", calories: undefined }] },
    { name: "Öğle Yemeği", foods: [{ name: "", amount: "", calories: undefined }] },
    { name: "Akşam Yemeği", foods: [{ name: "", amount: "", calories: undefined }] },
    { name: "Ara Öğün", foods: [{ name: "", amount: "", calories: undefined }] },
  ]);
  
  // Fetch diet plans
  const { data: dietPlans, isLoading } = useQuery({
    queryKey: ['/api/diet-plans'],
    queryFn: async () => {
      const response = await fetch('/api/diet-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Diyet planları alınamadı');
      return response.json() as Promise<DietPlan[]>;
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
  
  // Add diet plan mutation
  const addDietPlanMutation = useMutation({
    mutationFn: async (data: DietPlanFormValues) => {
      // Make sure clientId is provided as a route parameter
      const response = await apiRequest("POST", `/api/clients/${data.clientId}/diet-plans`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plans'] });
      setShowAddDialog(false);
      toast({
        title: "Başarılı",
        description: "Diyet planı başarıyla eklendi",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Diyet planı eklenirken bir hata oluştu: ${error.message}`,
      });
    }
  });
  
  // Calculate macros based on daily calories
  const calculateMacrosFromCalories = (calories: number) => {
    try {
      const macros = calculateMacros(calories);
      form.setValue("macroProtein", macros.protein);
      form.setValue("macroCarbs", macros.carbs);
      form.setValue("macroFat", macros.fat);
    } catch (error) {
      console.error("Makro hesaplama hatası:", error);
    }
  };
  
  // Diet plan form
  const form = useForm<DietPlanFormValues>({
    resolver: zodResolver(dietPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      dailyCalories: 0,
      macroProtein: 0,
      macroCarbs: 0,
      macroFat: 0,
      meals: initialMeals,
    },
  });
  
  // Watch daily calories to calculate macros
  const dailyCalories = form.watch("dailyCalories");
  
  React.useEffect(() => {
    if (dailyCalories && dailyCalories > 0) {
      calculateMacrosFromCalories(dailyCalories);
    }
  }, [dailyCalories]);
  
  // Form submission
  function onSubmit(values: DietPlanFormValues) {
    addDietPlanMutation.mutate(values);
  }
  
  // Add new food item to a meal
  const addFoodToMeal = (mealIndex: number) => {
    const currentMeals = form.getValues("meals");
    const updatedMeals = [...currentMeals];
    updatedMeals[mealIndex].foods.push({ name: "", amount: "", calories: undefined });
    form.setValue("meals", updatedMeals);
  };
  
  // Remove food item from a meal
  const removeFoodFromMeal = (mealIndex: number, foodIndex: number) => {
    const currentMeals = form.getValues("meals");
    const updatedMeals = [...currentMeals];
    updatedMeals[mealIndex].foods.splice(foodIndex, 1);
    form.setValue("meals", updatedMeals);
  };
  
  // Filter diet plans based on search term
  const filteredDietPlans = React.useMemo(() => {
    if (!dietPlans) return [];
    
    if (!searchTerm) return dietPlans;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return dietPlans.filter(plan => 
      plan.name.toLowerCase().includes(lowerCaseSearchTerm) || 
      (plan.description && plan.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [dietPlans, searchTerm]);
  
  // Get client by ID
  const getClientById = (clientId: number) => {
    if (!clients) return null;
    return clients.find(client => client.id === clientId);
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Diyet Planları</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tüm diyet planlarını yönetin.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <Input
              type="text"
              placeholder="Plan ara..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Yeni Diyet Planı
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Diyet Planı Oluştur</DialogTitle>
                <DialogDescription>
                  Danışan için yeni bir diyet planı oluşturun.
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
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Adı*</FormLabel>
                          <FormControl>
                            <Input placeholder="Örn: Kilo Verme Diyeti" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dailyCalories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Günlük Kalori*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1800" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Başlangıç Tarihi*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bitiş Tarihi</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Diyet planı hakkında açıklama..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <h4 className="font-medium mb-2">Makro Besinler</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="macroProtein"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein (g)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="macroCarbs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Karbonhidrat (g)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="macroFat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yağ (g)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                    <h4 className="font-medium mb-4">Öğünler</h4>
                    
                    {form.getValues("meals").map((meal, mealIndex) => (
                      <div key={mealIndex} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium">{meal.name}</h5>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => addFoodToMeal(mealIndex)}
                          >
                            <i className="fas fa-plus mr-2"></i> Besin Ekle
                          </Button>
                        </div>
                        
                        {meal.foods.map((food, foodIndex) => (
                          <div key={foodIndex} className="grid grid-cols-12 gap-2 mb-2 items-end">
                            <div className="col-span-5">
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.foods.${foodIndex}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={foodIndex > 0 ? "sr-only" : ""}>Besin</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Besin adı" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="col-span-4">
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.foods.${foodIndex}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={foodIndex > 0 ? "sr-only" : ""}>Miktar</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Miktar" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`meals.${mealIndex}.foods.${foodIndex}.calories`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={foodIndex > 0 ? "sr-only" : ""}>Kal</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="Kal" 
                                        {...field} 
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="col-span-1">
                              {meal.foods.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  className="w-full h-10"
                                  onClick={() => removeFoodFromMeal(mealIndex, foodIndex)}
                                >
                                  <i className="fas fa-trash text-red-500"></i>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addDietPlanMutation.isPending}>
                      {addDietPlanMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                        </>
                      ) : (
                        "Diyet Planı Oluştur"
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
          <span>Diyet planları yükleniyor...</span>
        </div>
      ) : (
        <>
          {filteredDietPlans.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <i className="fas fa-utensils text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? "Arama sonucu bulunamadı" : "Henüz diyet planı oluşturmadınız"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? "Farklı bir arama terimi deneyin veya yeni bir diyet planı oluşturun."
                  : "İlk diyet planınızı oluşturmak için 'Yeni Diyet Planı' butonuna tıklayın."}
              </p>
              
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Yeni Diyet Planı Oluştur
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDietPlans.map((plan) => {
                const client = getClientById(plan.clientId);
                
                return (
                  <Link key={plan.id} href={`/diet-plans/${plan.id}`}>
                    <a className="block">
                      <Card className="h-full hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              {client && (
                                <CardDescription>
                                  <span className="flex items-center">
                                    <i className="fas fa-user mr-1"></i> {client.fullName}
                                  </span>
                                </CardDescription>
                              )}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                              {plan.isActive ? 'Aktif' : 'Pasif'}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {plan.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {plan.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500 dark:text-gray-400">Başlangıç:</div>
                            <div className="text-gray-700 dark:text-gray-300">
                              {new Date(plan.startDate).toLocaleDateString('tr-TR')}
                            </div>
                            
                            {plan.endDate && (
                              <>
                                <div className="text-gray-500 dark:text-gray-400">Bitiş:</div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  {new Date(plan.endDate).toLocaleDateString('tr-TR')}
                                </div>
                              </>
                            )}
                            
                            <div className="text-gray-500 dark:text-gray-400">Kalori:</div>
                            <div className="text-gray-700 dark:text-gray-300">
                              {plan.dailyCalories} kcal/gün
                            </div>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-center">
                              <span className="block text-blue-700 dark:text-blue-300 font-medium">{plan.macroProtein}g</span>
                              <span className="text-gray-500 dark:text-gray-400">Protein</span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded text-center">
                              <span className="block text-amber-700 dark:text-amber-300 font-medium">{plan.macroCarbs}g</span>
                              <span className="text-gray-500 dark:text-gray-400">Karb</span>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded text-center">
                              <span className="block text-red-700 dark:text-red-300 font-medium">{plan.macroFat}g</span>
                              <span className="text-gray-500 dark:text-gray-400">Yağ</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button variant="ghost" className="w-full justify-start">
                            <i className="fas fa-eye mr-2"></i> Planı Görüntüle
                          </Button>
                        </CardFooter>
                      </Card>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
