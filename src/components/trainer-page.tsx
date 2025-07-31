
"use client"

import { Bot, UserPlus, Sparkles, Building, Users } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useState } from "react"
import { updateUserRole } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

interface TrainerPageProps {
    user: User;
    onRoleChange: () => void;
}

export function TrainerPage({ user, onRoleChange }: TrainerPageProps) {
    const [loading, setLoading] = useState(false);
    // Optimistic UI state
    const [isOptimisticTrainer, setIsOptimisticTrainer] = useState(user.user_metadata?.role === 'trainer');
    const { toast } = useToast();

    const handleBecomeTrainer = async () => {
        setLoading(true);
        // Optimistically update the UI
        setIsOptimisticTrainer(true);

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
                description: "Could not update your role in the database. Please try again later.",
                variant: 'destructive',
            })
            // Revert the optimistic update on failure
            setIsOptimisticTrainer(false);
        }
        setLoading(false);
    }
    
    const isTrainer = user.user_metadata?.role === 'trainer' || isOptimisticTrainer;

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {isTrainer ? <Building /> : <UserPlus />}
                    {isTrainer ? 'Trainer Dashboard' : 'Trainer'}
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">

                {isTrainer ? (
                     <div className="text-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full border-2 border-primary/30 w-fit mb-4">
                            <Users className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Manage Your Clients</h2>
                        <p className="text-muted-foreground mt-2">This is where you'll see your client list, assign workout plans, and track their progress.</p>
                        <Button className="mt-6" size="lg">Add New Client</Button>
                     </div>
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
