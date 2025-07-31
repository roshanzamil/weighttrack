
"use client"

import { Bot } from "lucide-react"

export function TrainerPage() {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Bot /> AI Trainer</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                <div className="text-center text-muted-foreground py-12">
                    <p>AI Trainer page coming soon!</p>
                </div>
            </main>
        </div>
    )
}
