
'use server';

import { suggestWeightIncrease, type SuggestWeightIncreaseInput } from '@/ai/flows/suggest-weight-increase';
import { supabase } from '@/lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getAISuggestion(input: SuggestWeightIncreaseInput) {
    try {
        const result = await suggestWeightIncrease(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting AI suggestion:', error);
        return { success: false, error: 'An error occurred while getting your suggestion.' };
    }
}

export async function updateUserRole(userId: string, role: string) {
    const cookieStore = cookies()
    const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }
    
    // We need to use the admin client to update user metadata
    // The public client with RLS and policies allows users to update their own data,
    // but using the admin client from a server action is a more direct and reliable method for role changes.
    // NOTE: This requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables.
    // For this environment, we will use the anon key, but in production, a service key should be used.
    const supabaseAdmin = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: role } }
    )

    if (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: 'Failed to update user role.' };
    }

    return { success: true, data };
}
