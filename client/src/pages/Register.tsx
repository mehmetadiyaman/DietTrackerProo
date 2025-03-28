import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Kullanıcı adı en az 3 karakter olmalıdır",
  }),
  password: z.string().min(6, {
    message: "Şifre en az 6 karakter olmalıdır",
  }),
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz",
  }),
  fullName: z.string().min(3, {
    message: "İsim soyisim en az 3 karakter olmalıdır",
  }),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register } = useAuth();
  
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
    },
  });
  
  const [isLoading, setIsLoading] = React.useState(false);
  
  async function onSubmit(values: RegisterValues) {
    setIsLoading(true);
    try {
      await register(values);
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary bg-opacity-20 dark:bg-opacity-20 rounded-lg p-3">
              <i className="fas fa-leaf text-primary text-2xl"></i>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Hesap Oluştur</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Dietçim uygulamasını kullanmaya başlamak için kayıt olun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ad Soyad" 
                        {...field}
                        disabled={isLoading}
                      />
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
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="ornek@mail.com" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="kullaniciadi" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Kayıt Yapılıyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            Zaten hesabınız var mı?{" "}
            <Link href="/login">
              <a className="font-medium text-primary hover:text-primary-dark dark:text-primary-light hover:underline">
                Giriş yap
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
