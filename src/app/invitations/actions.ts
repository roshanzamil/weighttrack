
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function sendInvitation(clientEmail: string) {
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

    const { data, error } = await supabase
        .from('invitations')
        .select(`
            *,
            client_details:users(
                raw_user_meta_data
            )
        `)
        .eq('trainer_id', user.id);
    
    if (error) {
        console.error('Error fetching clients:', error.message);
        return { success: false, error: error.message, data: [] };
    }

    const clients = data.map(d => ({
        ...d,
        client_details: {
            full_name: d.client_details?.raw_user_meta_data?.full_name,
            email: d.client_details?.raw_user_meta_data?.email,
        }
    }))

    return { success: true, data: clients };
}

export async function getPendingInvitationsForClient() {
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
        return { success: false, error: 'User not authenticated.', data: [] };
    }

    const { data, error } = await supabase
        .from('invitations')
        .select(`
            *,
            trainer_details:users(
                raw_user_meta_data
            )
        `)
        .eq('client_email', user.email)
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching invitations:', error.message);
        return { success: false, error: error.message, data: [] };
    }

    const invitations = data.map(d => ({
        ...d,
        trainer_details: {
            full_name: d.trainer_details?.raw_user_meta_data?.full_name,
            email: d.trainer_details?.raw_user_meta_data?.email,
        }
    }))

    return { success: true, data: invitations };
}


export async function updateInvitationStatus(invitationId: string, status: 'accepted' | 'rejected') {
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
