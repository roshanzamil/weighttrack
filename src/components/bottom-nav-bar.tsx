
"use client";

import { Dumbbell, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavItem = 'workouts' | 'trainer' | 'profile';

interface BottomNavBarProps {
    activeTab: NavItem;
    onTabChange: (tab: NavItem) => void;
}

const navItems = [
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'trainer', label: 'Trainer', icon: Bot },
    { id: 'profile', label: 'Profile', icon: User },
] as const;

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-20">
            <div className="flex justify-around items-center h-full">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                            activeTab === item.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
