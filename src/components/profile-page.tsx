
"use client"

import type { User } from "@supabase/supabase-js"
import { Button } from "./ui/button"
import { LogOut, User as UserIcon, Undo2, Check, X, Mail, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react";
import { removeTrainerRole, updateUserRole } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface ProfilePageProps {
    user: User;
    onSignOut: () => void;
    onRoleChange: () => void;
}

export function ProfilePage({ user, onSignOut, onRoleChange }: ProfilePageProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const isTrainer = user.user_metadata?.role === 'trainer';

    const handleBecomeTrainer = async () => {
        setLoading(true);
        const result = await updateUserRole(user.id, 'trainer');
        
        if (result.success) {
             toast({
                title: "Congratulations!",
                description: "You are now a trainer. You can start managing your clients.",
            });
            onRoleChange();
        } else {
            toast({
                title: "Update Failed",
                description: result.error || "Could not update your role. Please try again later.",
                variant: 'destructive',
            })
        }
        setLoading(false);
    }

    const handleRemoveTrainer = async () => {
        setLoading(true);
        const result = await removeTrainerRole();
        if (result.success) {
            toast({
                title: "Account Updated",
                description: "You are now a standard user.",
            });
            onRoleChange();
        } else {
             toast({
                title: "Update Failed",
                description: result.error || "Could not update your role. Please try again later.",
                variant: 'destructive',
            })
        }
        setLoading(false);
    }

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold flex items-center gap-2"><UserIcon /> Profile</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account</CardTitle>
                                <CardDescription>Manage your account settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm">
                                    <p className="text-muted-foreground">Signed in as</p>
                                    <p className="font-semibold">{user.email}</p>
                                </div>
                                <Button variant="outline" className="w-full" onClick={onSignOut}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="preferences" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Type</CardTitle>
                                <CardDescription>Change your account type.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isTrainer ? (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-4">You are currently a trainer. You can manage your clients from the "Trainer" tab.</p>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" disabled={loading}>
                                                    <Undo2 className="mr-2"/>
                                                    Revert to Standard Account
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action will remove your trainer status. You will lose access to the trainer dashboard and client management features. You can become a trainer again at any time.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleRemoveTrainer} disabled={loading}>
                                                    {loading ? 'Reverting...' : 'Yes, revert my account'}
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ) : (
                                    <div>
                                         <p className="text-sm text-muted-foreground mb-4">Upgrade to a trainer account to coach clients, create workout plans, and more.</p>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button disabled={loading}>
                                                    <Sparkles className="mr-2"/>
                                                    Become a Trainer
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Become a Trainer?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will upgrade your account to a trainer account, allowing you to manage clients and access trainer features. Are you sure you want to proceed?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleBecomeTrainer} disabled={loading}>
                                                        {loading ? 'Upgrading...' : 'Yes, Become a Trainer'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
