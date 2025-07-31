
"use client"

import type { User } from "@supabase/supabase-js"
import { Button } from "./ui/button"
import { LogOut, User as UserIcon } from "lucide-react"

interface ProfilePageProps {
    user: User;
    onSignOut: () => void;
}

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-2xl font-bold flex items-center gap-2"><UserIcon /> Profile</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                 <div className="text-center p-8">
                    <p className="text-muted-foreground">Signed in as</p>
                    <p className="font-semibold">{user.email}</p>
                 </div>
                 <Button variant="outline" className="w-full" onClick={onSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </main>
        </div>
    )
}
