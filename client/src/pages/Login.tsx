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

const loginSchema = z.object({
  username: z.string().min(1, {
    message: "Kullanıcı adı gerekli",
  }),
  password: z.string().min(1, {
    message: "Şifre gerekli",
  }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const [isLoading, setIsLoading] = React.useState(false);
  
  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      await login(values.username, values.password);
    } catch (error) {
      console.error("Login error:", error);
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
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Dietçim</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Diyetisyen Müşteri Takip Uygulaması
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <i className="fas fa-spinner fa-spin mr-2"></i> Giriş Yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            Hesabınız yok mu?{" "}
            <Link href="/register">
              <a className="font-medium text-primary hover:text-primary-dark dark:text-primary-light hover:underline">
                Kayıt ol
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
