
'use server';

import { suggestWeightIncrease, type SuggestWeightIncreaseInput } from '@/ai/flows/suggest-weight-increase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getAISuggestion(input: SuggestWeightIncreaseInput) {
    try {
        const result = await suggestWeightIncrease(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error getting AI suggestion:', error);
        return { success: false, error: error.message || 'An error occurred while getting your suggestion.' };
    }
}

export async function updateUserRole(userId: string, role: string) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }
    
    // Merge new role with existing metadata to prevent overwriting
    const newMetadata = { 
        ...user.user_metadata,
        role: role 
    };

    const { data, error } = await supabase.auth.updateUser({
        data: newMetadata
    });

    if (error) {
        console.error('Error updating user role:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
