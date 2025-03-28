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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Telegram settings form schema
const telegramSettingsSchema = z.object({
  telegramToken: z.string().min(1, "Telegram Bot Token gereklidir"),
  telegramChatId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Message template form schema
const messageTemplateSchema = z.object({
  name: z.string().min(3, "Şablon adı en az 3 karakter olmalıdır"),
  content: z.string().min(10, "Mesaj içeriği en az 10 karakter olmalıdır"),
});

type TelegramSettingsValues = z.infer<typeof telegramSettingsSchema>;
type MessageTemplateValues = z.infer<typeof messageTemplateSchema>;

// Template data type
interface MessageTemplate {
  id: number;
  name: string;
  content: string;
}

// Message history item type
interface MessageHistoryItem {
  id: number;
  clientName: string;
  clientId: number;
  message: string;
  date: string;
  status: "sent" | "failed" | "pending";
}

export default function TelegramBot() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [allClientsSelected, setAllClientsSelected] = useState(false);

  // Sample templates - would come from API in real implementation
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    { id: 1, name: "Hoş Geldiniz", content: "Merhaba {{AD_SOYAD}}! Dietçim uygulamasına hoş geldiniz. Sizin için kişiselleştirilmiş diyet planınızı oluşturduk. Herhangi bir sorunuz olursa lütfen bize ulaşın." },
    { id: 2, name: "Ölçüm Hatırlatma", content: "Merhaba {{AD_SOYAD}}! Haftalık ölçümlerinizi yapma zamanı geldi. Lütfen ölçümlerinizi yapıp sonuçları bize iletebilir misiniz?" },
    { id: 3, name: "Randevu Hatırlatma", content: "Merhaba {{AD_SOYAD}}! Yarın saat {{SAAT}}'da randevunuz bulunmaktadır. Hatırlatmak isteriz." }
  ]);

  // Sample message history - would come from API in real implementation
  const [messageHistory, setMessageHistory] = useState<MessageHistoryItem[]>([
    { id: 1, clientName: "Zeynep Kaya", clientId: 1, message: "Merhaba Zeynep! Yarın saat 14:30'da randevunuz bulunmaktadır. Hatırlatmak isteriz.", date: "2023-05-15T14:30:00", status: "sent" },
    { id: 2, clientName: "Ahmet Yılmaz", clientId: 2, message: "Merhaba Ahmet! Haftalık ölçümlerinizi yapma zamanı geldi. Lütfen ölçümlerinizi yapıp sonuçları bize iletebilir misiniz?", date: "2023-05-14T10:15:00", status: "sent" },
    { id: 3, clientName: "Ayşe Demir", clientId: 3, message: "Merhaba Ayşe! Dietçim uygulamasına hoş geldiniz. Sizin için kişiselleştirilmiş diyet planınızı oluşturduk. Herhangi bir sorunuz olursa lütfen bize ulaşın.", date: "2023-05-10T09:45:00", status: "failed" }
  ]);

  // Fetch clients from API
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Danışan listesi alınamadı');
      return response.json();
    }
  });

  // Settings form
  const settingsForm = useForm<TelegramSettingsValues>({
    resolver: zodResolver(telegramSettingsSchema),
    defaultValues: {
      telegramToken: user?.telegramToken || "",
      telegramChatId: user?.telegramChatId || "",
      isActive: true,
    },
  });

  // Template form
  const templateForm = useForm<MessageTemplateValues>({
    resolver: zodResolver(messageTemplateSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  // Message form with selected template
  const messageForm = useForm({
    defaultValues: {
      message: selectedTemplate?.content || "",
    },
  });

  // Update template form when selecting a template
  React.useEffect(() => {
    if (selectedTemplate) {
      templateForm.reset({
        name: selectedTemplate.name,
        content: selectedTemplate.content,
      });
    } else {
      templateForm.reset({
        name: "",
        content: "",
      });
    }
  }, [selectedTemplate, templateForm]);

  // Update message form when selecting a template
  React.useEffect(() => {
    if (selectedTemplate) {
      messageForm.setValue("message", selectedTemplate.content);
    } else {
      messageForm.setValue("message", "");
    }
  }, [selectedTemplate, messageForm]);

  // Save Telegram settings mutation
  const saveTelegramSettingsMutation = useMutation({
    mutationFn: async (data: TelegramSettingsValues) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/telegram-settings`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ayarlar Kaydedildi",
        description: "Telegram bot ayarlarınız başarıyla kaydedildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Telegram ayarları kaydedilirken bir hata oluştu: ${error.message}`,
      });
    }
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: MessageTemplateValues) => {
      // This would be an API call in real implementation
      if (selectedTemplate) {
        // Update existing template
        setTemplates(prev => 
          prev.map(t => t.id === selectedTemplate.id ? { ...t, ...data } : t)
        );
        return { ...selectedTemplate, ...data };
      } else {
        // Create new template
        const newTemplate = { id: templates.length + 1, ...data };
        setTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
      }
    },
    onSuccess: (data) => {
      setSelectedTemplate(null);
      templateForm.reset({
        name: "",
        content: "",
      });
      toast({
        title: "Şablon Kaydedildi",
        description: "Mesaj şablonu başarıyla kaydedildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Şablon kaydedilirken bir hata oluştu: ${error.message}`,
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      // This would be an API call in real implementation
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      return { success: true };
    },
    onSuccess: () => {
      setSelectedTemplate(null);
      templateForm.reset({
        name: "",
        content: "",
      });
      toast({
        title: "Şablon Silindi",
        description: "Mesaj şablonu başarıyla silindi.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Şablon silinirken bir hata oluştu: ${error.message}`,
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ clientIds, message }: { clientIds: number[], message: string }) => {
      // This would be an API call in real implementation
      const now = new Date().toISOString();
      
      // Create new message history items
      const newMessages: MessageHistoryItem[] = clientIds.map(clientId => {
        const client = clients.find(c => c.id === clientId);
        return {
          id: messageHistory.length + clientId,
          clientName: client?.fullName || "Bilinmeyen Danışan",
          clientId,
          message,
          date: now,
          status: "sent"
        };
      });
      
      setMessageHistory(prev => [...newMessages, ...prev]);
      return { success: true };
    },
    onSuccess: () => {
      setSelectedClients([]);
      setAllClientsSelected(false);
      setSelectedTemplate(null);
      messageForm.reset({
        message: "",
      });
      toast({
        title: "Mesaj Gönderildi",
        description: "Mesajınız başarıyla gönderildi.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Mesaj gönderilirken bir hata oluştu: ${error.message}`,
      });
    }
  });

  // Handle settings form submission
  function onSubmitSettings(values: TelegramSettingsValues) {
    saveTelegramSettingsMutation.mutate(values);
  }

  // Handle template form submission
  function onSubmitTemplate(values: MessageTemplateValues) {
    saveTemplateMutation.mutate(values);
  }

  // Handle message form submission
  function onSubmitMessage(values: { message: string }) {
    if (selectedClients.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen en az bir danışan seçin.",
      });
      return;
    }

    if (!values.message) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Mesaj içeriği boş olamaz.",
      });
      return;
    }

    sendMessageMutation.mutate({
      clientIds: selectedClients,
      message: values.message
    });
  }

  // Toggle client selection
  const toggleClientSelection = (clientId: number) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Toggle all clients selection
  const toggleAllClients = () => {
    if (allClientsSelected) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients?.map(client => client.id) || []);
    }
    setAllClientsSelected(!allClientsSelected);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Telegram Bot</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Telegram botu ile danışanlarınıza otomatik mesajlar gönderin.
        </p>
      </div>

      <Tabs defaultValue="settings" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Bot Ayarları</TabsTrigger>
          <TabsTrigger value="templates">Mesaj Şablonları</TabsTrigger>
          <TabsTrigger value="messages">Mesaj Gönder</TabsTrigger>
          <TabsTrigger value="history">Mesaj Geçmişi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Bot Ayarları</CardTitle>
              <CardDescription>
                Telegram Bot API entegrasyonu için gerekli ayarları yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="space-y-6">
                  <FormField
                    control={settingsForm.control}
                    name="telegramToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram Bot Token</FormLabel>
                        <FormControl>
                          <Input placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" {...field} />
                        </FormControl>
                        <FormDescription>
                          BotFather'dan aldığınız bot token'ını girin. 
                          <a 
                            href="https://core.telegram.org/bots#creating-a-new-bot" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline ml-1"
                          >
                            Nasıl oluşturulur?
                          </a>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="telegramChatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram Chat ID (İsteğe Bağlı)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} />
                        </FormControl>
                        <FormDescription>
                          Kendinize bildirim almak istiyorsanız kendi Telegram ID'nizi girin.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Telegram Bot Durumu</FormLabel>
                          <FormDescription>
                            Telegram entegrasyonunu etkinleştir veya devre dışı bırak.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      <i className="fas fa-info-circle mr-2"></i>
                      Kullanım Talimatları
                    </h4>
                    <ol className="list-decimal pl-5 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>BotFather'dan bir Telegram botu oluşturun</li>
                      <li>Aldığınız token'ı yukarıdaki alana yapıştırın</li>
                      <li>Danışanlarınızın bot ile iletişime geçmelerini sağlayın</li>
                      <li>"Mesaj Gönder" sekmesinden toplu veya bireysel mesajlar gönderin</li>
                    </ol>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={saveTelegramSettingsMutation.isPending}
                  >
                    {saveTelegramSettingsMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                      </>
                    ) : (
                      "Ayarları Kaydet"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Şablonlar</CardTitle>
                  <CardDescription>
                    Sık kullanılan mesajlar için şablonlar oluşturun.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-full flex flex-col">
                  <div className="space-y-2 flex-grow overflow-auto">
                    {templates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i className="far fa-file-alt text-3xl mb-2"></i>
                        <p>Henüz şablon oluşturulmamış.</p>
                      </div>
                    ) : (
                      templates.map(template => (
                        <div 
                          key={template.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            selectedTemplate?.id === template.id ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {template.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <i className="fas fa-plus mr-2"></i> Yeni Şablon
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedTemplate ? `Şablonu Düzenle: ${selectedTemplate.name}` : "Yeni Şablon Oluştur"}
                  </CardTitle>
                  <CardDescription>
                    Telegram mesajları için şablon oluşturun veya düzenleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-6">
                      <FormField
                        control={templateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Şablon Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="Şablon adı" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mesaj İçeriği</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Mesaj içeriği..." 
                                className="min-h-[200px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Kişiselleştirme için şu değişkenleri kullanabilirsiniz: 
                              <code className="ml-1 text-primary">{'{{AD_SOYAD}}, {{SAAT}}, {{TARİH}}'}</code>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3">
                        <Button 
                          type="submit" 
                          disabled={saveTemplateMutation.isPending}
                        >
                          {saveTemplateMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i> Kaydediliyor...
                            </>
                          ) : (
                            selectedTemplate ? "Şablonu Güncelle" : "Şablonu Kaydet"
                          )}
                        </Button>
                        
                        {selectedTemplate && (
                          <Button 
                            type="button" 
                            variant="destructive"
                            disabled={deleteTemplateMutation.isPending}
                            onClick={() => deleteTemplateMutation.mutate(selectedTemplate.id)}
                          >
                            {deleteTemplateMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i> Siliniyor...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-trash mr-2"></i> Sil
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="messages">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Danışan Seçimi</CardTitle>
                  <CardDescription>
                    Mesaj göndermek istediğiniz danışanları seçin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <div className="flex justify-center py-8">
                      <i className="fas fa-spinner fa-spin text-primary text-xl"></i>
                    </div>
                  ) : clients && clients.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="selectAll"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={allClientsSelected}
                          onChange={toggleAllClients}
                        />
                        <label htmlFor="selectAll" className="text-sm font-medium">
                          Tümünü Seç ({clients.length} danışan)
                        </label>
                      </div>
                      
                      <div className="border-t pt-4 max-h-[400px] overflow-y-auto">
                        {clients.map(client => (
                          <div key={client.id} className="flex items-center space-x-2 py-2">
                            <input
                              type="checkbox"
                              id={`client-${client.id}`}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => toggleClientSelection(client.id)}
                            />
                            <label htmlFor={`client-${client.id}`} className="flex items-center text-sm">
                              <div className="h-8 w-8 mr-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
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
                              {client.fullName}
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-2 text-sm text-gray-500 dark:text-gray-400">
                        {selectedClients.length} danışan seçildi
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <i className="fas fa-users text-3xl mb-2"></i>
                      <p>Henüz danışan eklenmemiş.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Mesaj Gönder</CardTitle>
                  <CardDescription>
                    Seçilen danışanlara Telegram üzerinden mesaj gönderin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={messageForm.handleSubmit(onSubmitMessage)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Şablon Seç</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={selectedTemplate?.id || ""}
                        onChange={(e) => {
                          const templateId = parseInt(e.target.value);
                          const template = templates.find(t => t.id === templateId) || null;
                          setSelectedTemplate(template);
                        }}
                      >
                        <option value="">Şablon seçin...</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Mesaj İçeriği</label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[200px]"
                        placeholder="Mesaj içeriği..."
                        {...messageForm.register("message")}
                      ></textarea>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kişiselleştirme için şu değişkenleri kullanabilirsiniz: 
                        <code className="ml-1 text-primary">{'{{AD_SOYAD}}, {{SAAT}}, {{TARİH}}'}</code>
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Önemli Hatırlatma
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Mesaj göndermek için danışanların Telegram botunuzu başlatmış olması gerekir.
                        Danışanlar botunuzu başlatmadıysa mesajlar iletilemez.
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={sendMessageMutation.isPending || selectedClients.length === 0}
                    >
                      {sendMessageMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i> Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane mr-2"></i>
                          {selectedClients.length 
                            ? `${selectedClients.length} Danışana Mesaj Gönder` 
                            : "Danışan Seçilmedi"}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Mesaj Geçmişi</CardTitle>
              <CardDescription>
                Gönderilen tüm Telegram mesajlarının kaydı.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messageHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <i className="far fa-comment-dots text-5xl mb-3"></i>
                  <p>Henüz gönderilmiş mesaj bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Danışan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mesaj</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {messageHistory.map((message) => (
                        <tr key={message.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(message.date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                                <i className="fas fa-user text-gray-500 dark:text-gray-400"></i>
                              </div>
                              <span className="text-gray-900 dark:text-gray-100">{message.clientName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-sm truncate">
                            {message.message}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {message.status === 'sent' && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <i className="fas fa-check mr-1"></i> Gönderildi
                              </span>
                            )}
                            {message.status === 'failed' && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                <i className="fas fa-times mr-1"></i> Başarısız
                              </span>
                            )}
                            {message.status === 'pending' && (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                <i className="fas fa-clock mr-1"></i> Beklemede
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
