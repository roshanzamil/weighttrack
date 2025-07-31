
"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getPendingInvitationsForClient, updateInvitationStatus } from "@/app/invitations/actions";
import type { Invitation } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Check, Mail, X } from "lucide-react";

export function InvitationManager({onAction}) {
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
    
    if (loading) return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Respond to coaching invitations from trainers.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Loading invitations...</p>
            </CardContent>
        </Card>
    );

    if (invitations.length === 0) {
        return null; // Don't render anything if there are no invitations
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Respond to coaching invitations from trainers.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {invitations.map(invite => (
                        <li key={invite.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-md bg-secondary">
                            <div>
                                <p className="font-semibold">{invite.trainer_details?.full_name || 'A trainer'}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/>{invite.trainer_details?.email}</p>
                            </div>
                            <div className="flex gap-2 mt-2 sm:mt-0">
                                <Button size="icon" variant="outline" onClick={() => handleUpdateStatus(invite.id, 'rejected')}><X className="w-4 h-4"/></Button>
                                <Button size="icon" onClick={() => handleUpdateStatus(invite.id, 'accepted')}><Check className="w-4 h-4"/></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
