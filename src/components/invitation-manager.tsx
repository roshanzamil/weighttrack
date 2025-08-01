

"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateInvitationStatus } from "@/app/invitations/actions";
import type { Invitation } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Check, Mail, X } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function InvitationManager({initialLoading, invitations, onAction}) {
    const { toast } = useToast();

    const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
        const result = await updateInvitationStatus(id, status);
        if (result.success) {
            toast({title: `Invitation ${status}!`});
            onAction(); // To refresh any other dependent data
        } else {
            toast({title: 'Error', description: result.error, variant: 'destructive'});
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Respond to coaching invitations from trainers.</CardDescription>
            </CardHeader>
            <CardContent>
                 {initialLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : invitations.length > 0 ? (
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
                ) : (
                     <p className="text-sm text-muted-foreground text-center py-4">You have no pending invitations.</p>
                )}
            </CardContent>
        </Card>
    )
}
