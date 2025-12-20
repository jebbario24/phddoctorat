import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

const getAuthSchema = (t: any) => z.object({
    email: z.string().email(t.invalidEmail),
    password: z.string().min(6, t.passwordMinLength),
});

const getRegisterSchema = (t: any) => getAuthSchema(t).extend({
    firstName: z.string().min(1, t.firstNameRequired),
    lastName: z.string().min(1, t.lastNameRequired),
});

export default function Auth() {
    const { t } = useTranslation();
    const [, setLocation] = useLocation();
    const { loginMutation, registerMutation, user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");

    if (user) {
        setLocation("/");
        return null;
    }

    const loginForm = useForm<z.infer<ReturnType<typeof getAuthSchema>>>({
        resolver: zodResolver(getAuthSchema(t)),
        defaultValues: { email: "", password: "" },
    });

    const registerForm = useForm<z.infer<ReturnType<typeof getRegisterSchema>>>({
        resolver: zodResolver(getRegisterSchema(t)),
        defaultValues: { email: "", password: "", firstName: "", lastName: "" },
    });

    const onLogin = async (data: z.infer<ReturnType<typeof getAuthSchema>>) => {
        try {
            await loginMutation.mutateAsync(data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t.loginFailed,
                description: error.message || t.loginFailedDesc,
            });
        }
    };

    const onRegister = async (data: z.infer<ReturnType<typeof getRegisterSchema>>) => {
        try {
            await registerMutation.mutateAsync(data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t.registrationFailed,
                description: error.message || t.registrationFailedDesc,
            });
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Thesard</span>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "login" | "register")}
                className="w-full max-w-md"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">{t.loginTab}</TabsTrigger>
                    <TabsTrigger value="register">{t.registerTab}</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.welcomeBack}</CardTitle>
                            <CardDescription>
                                {t.loginDesc}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                    <FormField
                                        control={loginForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.authEmail}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t.emailPlaceholder} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={loginForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.authPassword}</FormLabel>
                                                <FormControl>
                                                    <Input type="password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={loginMutation.isPending}
                                    >
                                        {loginMutation.isPending ? t.loggingIn : t.loginBtn}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="register">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.createAccount}</CardTitle>
                            <CardDescription>
                                {t.registerDesc}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...registerForm}>
                                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={registerForm.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t.authFirstName}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t.firstNamePlaceholder} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={registerForm.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t.authLastName}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t.lastNamePlaceholder} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={registerForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.authEmail}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t.emailPlaceholder} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registerForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t.authPassword}</FormLabel>
                                                <FormControl>
                                                    <Input type="password" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={registerMutation.isPending}
                                    >
                                        {registerMutation.isPending ? t.configuringAccount : t.createAccountBtn}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
