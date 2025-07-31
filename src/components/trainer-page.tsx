
"use client"

import { Bot, UserPlus, Sparkles, Building, Users, Send, Clock, UserCheck } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useEffect, useState } from "react"
import { updateUserRole } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"
import { Input } from "./ui/input"
import { getClientsForTrainer, sendInvitation } from "@/app/invitations/actions"
import type { Invitation } from "@/lib/types"
import { Badge } from "./ui/badge"


function ClientManagement({ user }: { user: User }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Invitation[]>([]);
    const { toast } = useToast();

    const fetchClients = async () => {
        const result = await getClientsForTrainer();
        if (result.success) {
            setClients(result.data as Invitation[]);
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    }

    useEffect(() => {
        fetchClients();
    }, []);

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
            fetchClients(); // Refresh client list
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const pendingClients = clients.filter(c => c.status === 'pending');
    const activeClients = clients.filter(c => c.status === 'accepted');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Invite a New Client</CardTitle>
                    <CardDescription>Enter the email of the user you want to invite.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input 
                        type="email" 
                        placeholder="client@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                    <Button onClick={handleSendInvitation} disabled={loading}>
                        <Send className="mr-2"/>
                        {loading ? 'Sending...' : 'Send Invite'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock /> Pending Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingClients.length > 0 ? (
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
                    {activeClients.length > 0 ? (
                         <ul className="space-y-2">
                           {activeClients.map(client => (
                               <li key={client.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                   <span>{client.client_details?.full_name || client.client_email}</span>
                                   <Badge variant="default" className="bg-green-600">Accepted</Badge>
                               </li>
                           ))}
                        </ul>
                    ) : <p className="text-muted-foreground text-sm">No active clients yet.</p>}
                </CardContent>
            </Card>

        </div>
    )
}


interface TrainerPageProps {
    user: User;
    onRoleChange: () => void;
}

export function TrainerPage({ user, onRoleChange }: TrainerPageProps) {
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
                )}
            </main>
        </div>
    )
}
