import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Profile form schema
const profileFormSchema = z.object({
  fullName: z.string().min(3, "Ad Soyad en az 3 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  profileImage: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string().min(6, "Şifre onayı en az 6 karakter olmalıdır"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      profileImage: user?.profileImage || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data);
      toast({
        title: "Profil Güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Profil güncellenirken bir hata oluştu: ${error.message}`,
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/password`, data);
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Şifre Değiştirildi",
        description: "Şifreniz başarıyla değiştirildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Şifre değiştirilirken bir hata oluştu: ${error.message}`,
      });
    }
  });

  // Handle profile form submission
  function onSubmitProfile(values: ProfileFormValues) {
    updateProfileMutation.mutate(values);
  }

  // Handle password form submission
  function onSubmitPassword(values: PasswordFormValues) {
    const { currentPassword, newPassword } = values;
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Hesap Ayarları</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Profil bilgilerinizi ve uygulama ayarlarınızı yönetin.</p>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="password">Şifre</TabsTrigger>
          <TabsTrigger value="appearance">Görünüm</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                Kişisel bilgilerinizi güncelleyin. Bu bilgiler danışanlarınız tarafından görülebilir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-2/3 space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input placeholder="Ad Soyad" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="eposta@ornek.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="profileImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profil Resmi URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/profile.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Resim URL'si girin veya Cloudinary entegrasyonu için ayarları yapılandırın.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="w-full md:w-1/3 flex flex-col items-center justify-start">
                      <div className="relative">
                        <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                          {profileForm.watch("profileImage") ? (
                            <img 
                              src={profileForm.watch("profileImage")} 
                              alt="Profil resmi önizleme" 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/150";
                              }}
                            />
                          ) : user?.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt="Mevcut profil resmi" 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/150";
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <i className="fas fa-user text-gray-400 text-4xl"></i>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute bottom-0 right-0"
                          onClick={() => {
                            /* Cloudinary veya resim yükleme işlevi burada olacak */
                            toast({
                              title: "Resim Yükleme",
                              description: "Bu özellik şu anda geliştirme aşamasındadır.",
                            });
                          }}
                        >
                          <i className="fas fa-camera mr-2"></i>
                          Değiştir
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                      </>
                    ) : (
                      "Profili Kaydet"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mevcut Şifre</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yeni Şifre</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre Tekrar</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                      </>
                    ) : (
                      "Şifreyi Değiştir"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Görünüm Ayarları</CardTitle>
              <CardDescription>
                Uygulama teması ve görünüm tercihlerinizi özelleştirin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Tema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-6 w-6 bg-white dark:bg-gray-900 rounded-full border"></div>
                      <div>
                        <p className="font-medium">Açık</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Varsayılan açık tema</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-6 w-6 bg-gray-900 dark:bg-gray-700 rounded-full border"></div>
                      <div>
                        <p className="font-medium">Koyu</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Varsayılan koyu tema</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-6 w-6 rounded-full border overflow-hidden">
                        <div className="h-full w-1/2 bg-white dark:bg-gray-300 float-left"></div>
                        <div className="h-full w-1/2 bg-gray-900 dark:bg-gray-700 float-right"></div>
                      </div>
                      <div>
                        <p className="font-medium">Sistem</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sistem ayarları ile eşleşir</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Renk Şeması</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-2 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-8 w-8 bg-green-500 rounded-full mb-2"></div>
                      <p className="text-sm font-medium">Yeşil</p>
                    </div>
                    
                    <div className="border rounded-lg p-2 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-8 w-8 bg-blue-500 rounded-full mb-2"></div>
                      <p className="text-sm font-medium">Mavi</p>
                    </div>
                    
                    <div className="border rounded-lg p-2 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-8 w-8 bg-purple-500 rounded-full mb-2"></div>
                      <p className="text-sm font-medium">Mor</p>
                    </div>
                    
                    <div className="border rounded-lg p-2 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="h-8 w-8 bg-amber-500 rounded-full mb-2"></div>
                      <p className="text-sm font-medium">Amber</p>
                    </div>
                  </div>
                </div>
                
                <Button>Ayarları Kaydet</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                Hangi bildirimler için uyarı almak istediğinizi belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">E-posta Bildirimleri</h3>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Randevu Hatırlatmaları</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Yaklaşan randevularınız için hatırlatma e-postaları.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Diyet Planı Güncellemeleri</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Diyet planlarında yapılan değişiklikler için bildirimler.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Danışan Mesajları</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Danışanlarınızdan gelen mesajlar için bildirimler.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium">Pazarlama E-postaları</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Özel teklifler, güncellemeler ve haberler.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sistem Bildirimleri</h3>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Tarayıcı Bildirimleri</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Masaüstü bildirimleri.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium">Ses Bildirimleri</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bildirimler için ses efektleri.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <Button>Ayarları Kaydet</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
