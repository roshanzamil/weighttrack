
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

    // Step 2: Get IDs of accepted clients
    const clientIds = invitations
        .filter(inv => inv.status === 'accepted' && inv.client_id)
        .map(inv => inv.client_id!);

    let clientDetailsMap = new Map();

    // Step 3: Fetch user details for accepted clients if any exist
    if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase.auth.admin.listUsers({
            // There's no direct `in` filter, so we fetch and filter manually.
            // This is a limitation, but listUsers is often cached and fast.
        });
        
        if (clientsError) {
             console.error('Error fetching client details:', clientsError.message);
             // Continue without details
        } else {
            clientsData.users.forEach(u => {
                if (clientIds.includes(u.id)) {
                    clientDetailsMap.set(u.id, {
                        full_name: u.user_metadata?.full_name,
                        email: u.email,
                    });
                }
            });
        }
    }
    
    // Step 4: Combine the data
    const clients = invitations.map(inv => ({
        ...inv,
        client_details: inv.client_id ? clientDetailsMap.get(inv.client_id) : null,
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
    const { data: trainersData, error: trainersError } = await supabase.auth.admin.listUsers();
    
    if (trainersError) {
        console.error('Error fetching trainer details:', trainersError.message);
        // Continue without details
    } else {
         trainersData.users.forEach(u => {
            if (trainerIds.includes(u.id)) {
                trainerDetailsMap.set(u.id, {
                    full_name: u.user_metadata?.full_name,
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
