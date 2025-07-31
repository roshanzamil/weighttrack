
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

async function fetchUserDetails(supabase: any, userIds: string[]) {
    if (userIds.length === 0) return new Map();
    
    const { data: usersData, error: usersError } = await supabase.rpc('get_user_details_by_ids', {
        user_ids: userIds,
    });
    
    if (usersError) {
        console.error('Error fetching user details via RPC:', usersError.message);
        return new Map();
    }
    
    const userDetailsMap = new Map();
    if (usersData) {
        usersData.forEach((u: any) => {
            userDetailsMap.set(u.id, {
                full_name: u.full_name,
                email: u.email,
            });
        });
    }
    return userDetailsMap;
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

    const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('trainer_id', user.id);
    
    if (invitationsError) {
        console.error('Error fetching clients:', invitationsError.message);
        return { success: false, error: invitationsError.message, data: [] };
    }

    const clientIds = invitations
        .filter(inv => inv.status === 'accepted' && inv.client_id)
        .map(inv => inv.client_id!);

    const clientDetailsMap = await fetchUserDetails(supabase, clientIds);
    
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

    const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select(`*`)
        .eq('client_email', user.email)
        .eq('status', 'pending');

    if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError.message);
        return { success: false, error: invitationsError.message, data: [] };
    }

    if (!invitations || invitations.length === 0) {
        return { success: true, data: [] };
    }

    const trainerIds = invitations.map(inv => inv.trainer_id);
    const trainerDetailsMap = await fetchUserDetails(supabase, trainerIds);

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
        .eq('client_email', user.email); 

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

    const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('trainer_id')
        .eq('client_id', user.id)
        .eq('status', 'accepted')
        .limit(1)
        .single();
    
    if (invitationError) {
        return { success: true, data: null };
    }
    
    if (!invitation) {
        return { success: true, data: null };
    }
    
    const trainerDetailsMap = await fetchUserDetails(supabase, [invitation.trainer_id]);
    const trainer = trainerDetailsMap.get(invitation.trainer_id);

    if (!trainer) {
        return { success: false, error: 'Error fetching trainer details.', data: null };
    }

    return { success: true, data: trainer };
}
