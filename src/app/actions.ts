'use server';

import { suggestWeightIncrease, type SuggestWeightIncreaseInput } from '@/ai/flows/suggest-weight-increase';

export async function getAISuggestion(input: SuggestWeightIncreaseInput) {
    try {
        const result = await suggestWeightIncrease(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting AI suggestion:', error);
        return { success: false, error: 'An error occurred while getting your suggestion.' };
    }
}
