
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

export async function sendInvitation(clientEmail: string) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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

    if (user.email === clientEmail) {
        return { success: false, error: "You cannot send an invitation to yourself." };
    }

    const { error } = await supabase
        .from('invitations')
        .insert({
            trainer_id: user.id,
            client_email: clientEmail,
            status: 'pending'
        });
    
    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            return { success: false, error: 'An invitation has already been sent to this email.' };
        }
        console.error('Error sending invitation:', error.message);
        return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Invitation sent successfully!' };
}

export async function getClientsForTrainer() {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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
        return { success: false, error: 'User not authenticated.', data: [] };
    }

    // Step 1: Fetch all invitations for the trainer
    const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('trainer_id', user.id);
    
    if (invitationsError) {
        console.error('Error fetching clients:', invitationsError.message);
        return { success: false, error: invitationsError.message, data: [] };
    }

    // Step 2: Get emails of accepted clients
    const clientIds = invitations
        .filter(inv => inv.status === 'accepted' && inv.client_id)
        .map(inv => inv.client_id!);

    let clientDetailsMap = new Map();

    // Step 3: Fetch user details for accepted clients if any exist
    if (clientIds.length > 0) {
         const { data: clientsData, error: clientsError } = await supabase
            .from('users', { schema: 'auth' })
            .select('id, raw_user_meta_data, email')
            .in('id', clientIds);
        
        if (clientsError) {
             console.error('Error fetching client details:', clientsError.message);
             // Continue without details
        } else {
            clientsData.forEach((u: any) => {
                clientDetailsMap.set(u.id, {
                    full_name: u.raw_user_meta_data?.full_name,
                    email: u.email,
                });
            });
        }
    }
    
    // Step 4: Combine the data
    const clients = invitations.map(inv => ({
        ...inv,
        client_details: inv.client_id ? clientDetailsMap.get(inv.client_id) : { full_name: null, email: inv.client_email },
    }));


    return { success: true, data: clients };
}

export async function getPendingInvitationsForClient() {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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
        return { success: false, error: 'User not authenticated.', data: [] };
    }

    // Step 1: Fetch pending invitations for the client's email
    const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select(`*`)
        .eq('client_email', user.email)
        .eq('status', 'pending');

    if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError.message);
        return { success: false, error: invitationsError.message, data: [] };
    }

    if (invitations.length === 0) {
        return { success: true, data: [] };
    }

    // Step 2: Get trainer IDs from the invitations
    const trainerIds = invitations.map(inv => inv.trainer_id);

    let trainerDetailsMap = new Map();

    // Step 3: Fetch user details for the trainers
    const { data: trainersData, error: trainersError } = await supabase
        .from('users', { schema: 'auth' })
        .select('id, raw_user_meta_data, email')
        .in('id', trainerIds);

    
    if (trainersError) {
        console.error('Error fetching trainer details:', trainersError.message);
        // Continue without details
    } else {
         trainersData.forEach((u: any) => {
            if (trainerIds.includes(u.id)) {
                trainerDetailsMap.set(u.id, {
                    full_name: u.raw_user_meta_data?.full_name,
                    email: u.email,
                });
            }
        });
    }

    // Step 4: Combine the data
    const combinedInvitations = invitations.map(inv => ({
        ...inv,
        trainer_details: trainerDetailsMap.get(inv.trainer_id),
    }));

    return { success: true, data: combinedInvitations };
}


export async function updateInvitationStatus(invitationId: string, status: 'accepted' | 'rejected') {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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

    const updatePayload: { status: 'accepted' | 'rejected', client_id?: string } = { status };
    if (status === 'accepted') {
        updatePayload.client_id = user.id;
    }

    const { error } = await supabase
        .from('invitations')
        .update(updatePayload)
        .eq('id', invitationId)
        .eq('client_email', user.email); // Ensure user can only update their own invitation

    if (error) {
        console.error('Error updating invitation:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function removeClient(invitationId: string) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
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

    // Security check: ensure the user is the trainer for this invitation before deleting
    const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('trainer_id')
        .eq('id', invitationId)
        .single();
    
    if (fetchError || !invitation) {
        return { success: false, error: 'Invitation not found.' };
    }

    if (invitation.trainer_id !== user.id) {
        return { success: false, error: 'You are not authorized to perform this action.' };
    }

    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

    if (error) {
        console.error('Error removing client:', error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getTrainerForClient() {
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
        return { success: false, error: 'Error: Not authenticated.', data: null };
    }

    // Find the accepted invitation for the current client
    const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('trainer_id')
        .eq('client_id', user.id)
        .eq('status', 'accepted')
        .limit(1)
        .single();
    
    if (invitationError) {
        console.error("DEBUG: Error fetching invitation:", invitationError.message);
        return { success: false, error: `Error fetching invitation: ${invitationError.message}`, data: null };
    }
    
    if (!invitation) {
        // This is not an error, it just means they don't have a trainer.
        return { success: true, data: null };
    }

    // Get the trainer's details
    const { data: trainerData, error: trainerError } = await supabase
        .from('users', { schema: 'auth' })
        .select('raw_user_meta_data, email')
        .eq('id', invitation.trainer_id)
        .single();
        
    if (trainerError) {
        console.error("DEBUG: Error fetching trainer details from auth.users:", trainerError.message);
        return { success: false, error: `Error fetching trainer details: ${trainerError.message}`, data: null };
    }
        
    if (!trainerData) {
        console.error("DEBUG: No trainer data found for ID:", invitation.trainer_id);
        return { success: false, error: "Trainer details not found for the given ID.", data: null };
    }
    
    const trainer = {
        full_name: (trainerData.raw_user_meta_data as any)?.full_name,
        email: trainerData.email,
    };

    return { success: true, data: trainer };
}
