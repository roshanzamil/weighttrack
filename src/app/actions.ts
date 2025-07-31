
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
    );

    const { data, error } = await supabaseServer.auth.updateUser({
        data: { role: role }
    });


    if (error) {
        console.error('Error updating user role:', error.message);
        return { success: false, error: 'Failed to update user role.' };
    }

    return { success: true, data: data.user };
}
