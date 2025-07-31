
"use client"

import type { User } from "@supabase/supabase-js"
import { Button } from "./ui/button"
import { LogOut, User as UserIcon, Undo2, Check, X, Mail } from "lucide-react"
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
import { useEffect, useState, useCallback } from "react";
import { removeTrainerRole } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { getPendingInvitationsForClient, updateInvitationStatus } from "@/app/invitations/actions";
import type { Invitation } from "@/lib/types";

function InvitationManager({onAction}) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        const result = await getPendingInvitationsForClient();
        if (result.success) {
            setInvitations(result.data as Invitation[]);
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
        const result = await updateInvitationStatus(id, status);
        if (result.success) {
            toast({title: `Invitation ${status}!`});
            fetchInvitations(); // Refresh list
            onAction(); // To refresh any other dependent data
        } else {
            toast({title: 'Error', description: result.error, variant: 'destructive'});
        }
    }
    
    if (loading) return <p>Loading invitations...</p>;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Respond to coaching invitations from trainers.</CardDescription>
            </CardHeader>
            <CardContent>
                {invitations.length > 0 ? (
                    <ul className="space-y-3">
                        {invitations.map(invite => (
                            <li key={invite.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-md bg-secondary">
                                <div>
                                    <p className="font-semibold">{invite.trainer_details?.full_name || 'A trainer'}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/>{invite.trainer_details?.email}</p>
                                </div>
                                <div className="flex gap-2 mt-2 sm:mt-0">
                                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(invite.id, 'rejected')}><X className="w-4 h-4"/></Button>
                                    <Button size="sm" onClick={() => handleUpdateStatus(invite.id, 'accepted')}><Check className="w-4 h-4"/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">You have no pending invitations.</p>
                )}
            </CardContent>
        </Card>
    )

}


interface ProfilePageProps {
    user: User;
    onSignOut: () => void;
    onRoleChange: () => void;
}

export function ProfilePage({ user, onSignOut, onRoleChange }: ProfilePageProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const isTrainer = user.user_metadata?.role === 'trainer';

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
                                ) : (
                                    <p className="text-sm text-muted-foreground">You are currently a standard user. Go to the "Trainer" tab to become a trainer.</p>
                                )}
                            </CardContent>
                        </Card>
                        <InvitationManager onAction={onRoleChange}/>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
