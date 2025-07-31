
'use server';

import { suggestWeightIncrease, type SuggestWeightIncreaseInput } from '@/ai/flows/suggest-weight-increase';
import { createClient } from '@supabase/supabase-js';
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
    // For admin actions from a server component, we need to create a new client with the service role key.
    // In a production environment, this should be stored securely in .env.local and not be the public anon key.
    // For this prototype, we are using the anon key, which works because we've set up an RLS policy
    // that allows users to update their own `user_metadata`.
    const supabaseAdmin = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // In production, use process.env.SUPABASE_SERVICE_ROLE_KEY
         {
            auth: {
                // This is important to ensure the admin client can perform its actions
                autoRefreshToken: false,
                persistSession: false
            }
         }
    );

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
