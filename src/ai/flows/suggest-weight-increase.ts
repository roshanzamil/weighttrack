'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting incremental increases in weight or reps
 * based on the user's past workout performance, to facilitate progressive overload in a safe manner.
 *
 * - suggestWeightIncrease - The main function to call to get weight increase suggestions.
 * - SuggestWeightIncreaseInput - The input type for the suggestWeightIncrease function.
 * - SuggestWeightIncreaseOutput - The output type for the suggestWeightIncrease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWeightIncreaseInputSchema = z.object({
  exerciseName: z.string().describe('The name of the exercise.'),
  previousWeight: z.number().describe('The weight used in the previous workout (in kg).'),
  previousReps: z.number().describe('The number of repetitions performed in the previous workout.'),
  personalBestWeight: z.number().describe('The user\'s personal best weight for this exercise (in kg).'),
});
export type SuggestWeightIncreaseInput = z.infer<typeof SuggestWeightIncreaseInputSchema>;

const SuggestWeightIncreaseOutputSchema = z.object({
  suggestedWeightIncrease: z
    .number()
    .describe('The suggested weight increase (in kg) for the next workout.'),
  suggestedRepsIncrease: z
    .number()
    .describe('The suggested reps increase for the next workout.'),
  reasoning: z.string().describe('The AI\'s reasoning for the suggested increase.'),
});
export type SuggestWeightIncreaseOutput = z.infer<typeof SuggestWeightIncreaseOutputSchema>;

export async function suggestWeightIncrease(
  input: SuggestWeightIncreaseInput
): Promise<SuggestWeightIncreaseOutput> {
  return suggestWeightIncreaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWeightIncreasePrompt',
  input: {schema: SuggestWeightIncreaseInputSchema},
  output: {schema: SuggestWeightIncreaseOutputSchema},
  prompt: `You are a personal fitness assistant helping users to safely and effectively apply progressive overload.

  Based on the user's previous workout performance and personal best, suggest an incremental increase in weight (in kg) or reps for their next workout.
  Always prioritize safety and suggest conservative increases, especially if the user is approaching their personal best.

  Exercise: {{{exerciseName}}}
  Previous weight: {{{previousWeight}}} kg
  Previous reps: {{{previousReps}}}
  Personal best weight: {{{personalBestWeight}}} kg

  Consider these factors:
  - The user's previous performance (weight and reps).
  - How close the user is to their personal best.
  - The importance of safe, incremental increases.

  Reason your suggestion step by step, and then output a JSON object containing the suggestedWeightIncrease, suggestedRepsIncrease and reasoning.
  `,
});

const suggestWeightIncreaseFlow = ai.defineFlow(
  {
    name: 'suggestWeightIncreaseFlow',
    inputSchema: SuggestWeightIncreaseInputSchema,
    outputSchema: SuggestWeightIncreaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
