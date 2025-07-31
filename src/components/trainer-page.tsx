
"use client"

import { Bot, UserPlus, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

export function TrainerPage() {

    // In the future, this state will come from your database
    const hasTrainer = false; 

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus /> Trainer</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">

                {hasTrainer ? (
                     <div>
                        {/* This is where the trainer's assigned workouts will go */}
                        <p>Your trainer's workout plan will appear here.</p>
                     </div>
                ) : (
                    <Card className="bg-primary/5 border-primary/20 text-center">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 p-3 rounded-full border-2 border-primary/30 w-fit">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h2 className="text-2xl font-bold">Connect with a Trainer</h2>
                            <p className="text-muted-foreground">
                                Get personalized workout plans, expert guidance, and accountability by connecting with a professional trainer.
                            </p>
                            <Button size="lg">Become a Trainer</Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
