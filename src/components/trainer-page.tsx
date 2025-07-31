
"use client"

import { Bot, UserPlus, Sparkles, Building, Users, Send, Clock, UserCheck, Mail, Check, X, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useCallback, useEffect, useState } from "react"
import { updateUserRole } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"
import { getClientsForTrainer, getTrainerForClient, removeClient, sendInvitation } from "@/app/invitations/actions"
import type { Invitation } from "@/lib/types"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { InvitationManager } from "./invitation-manager"
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

function InviteClientDialog({ onInviteSent }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleSendInvitation = async () => {
        if (!email) {
            toast({ title: "Error", description: "Please enter an email.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const result = await sendInvitation(email);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setEmail('');
            setIsOpen(false);
            onInviteSent(); // Refresh client list
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="rounded-full w-16 h-16 fixed bottom-20 right-6 shadow-lg z-20">
                  <UserPlus className="w-6 h-6"/>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite a New Client</DialogTitle>
                    <DialogDescription>Enter the email of the user you want to coach. They will receive an invitation to accept.</DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email" 
                        placeholder="client@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="col-span-3"
                    />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendInvitation} disabled={loading}>
                        <Send className="mr-2"/>
                        {loading ? 'Sending...' : 'Send Invite'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function ClientManagement({ user }: { user: User }) {
    const [clients, setClients] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchClients = useCallback(async () => {
        setLoading(true);
        const result = await getClientsForTrainer();
        if (result.success) {
            setClients(result.data as Invitation[]);
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }, [toast]);

    const handleRemoveClient = async (invitationId: string) => {
        const result = await removeClient(invitationId);
        if (result.success) {
            toast({title: "Client removed"});
            fetchClients();
        } else {
            toast({title: "Error", description: result.error, variant: "destructive"});
        }
    }


    useEffect(() => {
        fetchClients();
    }, [fetchClients]);


    const pendingClients = clients.filter(c => c.status === 'pending');
    const activeClients = clients.filter(c => c.status === 'accepted');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock /> Pending Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : pendingClients.length > 0 ? (
                        <ul className="space-y-2">
                           {pendingClients.map(client => (
                               <li key={client.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                   <span>{client.client_email}</span>
                                   <Badge variant="outline">Pending</Badge>
                               </li>
                           ))}
                        </ul>
                    ) : <p className="text-muted-foreground text-sm">No pending invitations.</p>}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCheck /> Active Clients</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? <p>Loading...</p> : activeClients.length > 0 ? (
                         <ul className="space-y-3">
                           {activeClients.map(client => (
                               <li key={client.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                                   <div>
                                       <p className="font-semibold">{client.client_details?.full_name || client.client_email}</p>
                                       <p className="text-sm text-muted-foreground">{client.client_details?.email}</p>
                                   </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button size="icon" variant="destructive">
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently remove {client.client_details?.full_name || client.client_email} from your client list. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveClient(client.id)}>
                                                    Remove Client
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </li>
                           ))}
                        </ul>
                    ) : <p className="text-muted-foreground text-sm">No active clients yet.</p>}
                </CardContent>
            </Card>
            
             <InviteClientDialog onInviteSent={fetchClients} />
        </div>
    )
}

function ClientView({ onRoleChange }) {
    const [trainer, setTrainer] = useState<{full_name: string, email: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const {toast} = useToast();

    const fetchTrainer = useCallback(async () => {
        const result = await getTrainerForClient();
        if (result.success) {
            setTrainer(result.data as any);
        } else {
            toast({title: 'Error', description: result.error, variant: 'destructive'});
        }
        setLoading(false);
    }, [toast]);
    
    useEffect(() => {
        fetchTrainer();
    }, [fetchTrainer]);
    
    if (loading) return <p>Loading...</p>;
    
    return (
         <>
            {trainer ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Trainer</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="font-semibold text-lg">{trainer.full_name}</p>
                         <p className="text-sm text-muted-foreground">{trainer.email}</p>
                    </CardContent>
                </Card>
            ) : (
                 <InvitationManager onAction={onRoleChange} />
            )}
        </>
    )

}


interface TrainerPageProps {
    user: User;
    onRoleChange: () => void;
}

export function TrainerPage({ user, onRoleChange }: TrainerPageProps) {
    const [loading, setLoading] = useState(false);
    const [isTrainer, setIsTrainer] = useState(user.user_metadata?.role === 'trainer');
    const { toast } = useToast();

    useEffect(() => {
        setIsTrainer(user.user_metadata?.role === 'trainer');
    }, [user]);
    
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
    
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {isTrainer ? <Building /> : <UserPlus />}
                    {isTrainer ? 'Trainer Dashboard' : 'Become a Trainer'}
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">

                {isTrainer ? (
                     <ClientManagement user={user} />
                ) : (
                    <>
                        <ClientView onRoleChange={onRoleChange} />
                        <Card className="bg-primary/5 border-primary/20 text-center">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 p-3 rounded-full border-2 border-primary/30 w-fit">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <h2 className="text-2xl font-bold">Ready to Coach?</h2>
                                <p className="text-muted-foreground">
                                    Leverage your expertise to guide others on their fitness journey. Create personalized workout plans and manage your clients, all in one place.
                                </p>
                                <Button size="lg" onClick={handleBecomeTrainer} disabled={loading}>
                                    {loading ? 'Becoming a trainer...' : 'Become a Trainer'}
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    )
}
