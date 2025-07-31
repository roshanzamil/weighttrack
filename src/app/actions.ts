
'use server';

import { suggestWeightIncrease, type SuggestWeightIncreaseInput } from '@/ai/flows/suggest-weight-increase';
import { supabase } from '@/lib/supabaseClient';

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
    // This server action is called by an authenticated user.
    // The RLS policy we created allows authenticated users to update their own `user_metadata`.
    // Therefore, we can use the standard `supabase.auth.updateUser` method, which acts
    // on behalf of the currently logged-in user.
    const { data, error } = await supabase.auth.updateUser({
        data: { role: role }
    });

    if (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: 'Failed to update user role.' };
    }

    return { success: true, data: data.user };
}
