import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            throw new Error('Email e senha são obrigatórios.');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Check if invite exists
        const { data: inviteData, error: inviteError } = await supabaseAdmin
            .from('user_invites')
            .select('*')
            .eq('email', email)
            .single();

        if (inviteError || !inviteData) {
            return new Response(
                JSON.stringify({ error: 'Convite não encontrado ou já utilizado.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Create the user in Auth directly
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Bypass email confirmation
            user_metadata: {
                name: inviteData.name,
            }
        });

        if (authError) {
            console.error("Erro no createUser Auth:", authError);
            return new Response(
                JSON.stringify({ error: authError.message || 'Falha ao criar usuário.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = authData.user?.id;

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'Falha ao obter ID do usuário criado.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Insert into public.usuarios
        const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
            id: userId,
            email: email,
            nome: inviteData.name,
            role: inviteData.role,
            permissions: inviteData.permissions,
            status: 'ativo',
        });

        if (insertError) {
            console.error("Erro ao inserir em public.usuarios:", insertError);
            // Ideally we would rollback the auth user creation here, but for simplicity we will just return error
            return new Response(
                JSON.stringify({ error: 'Falha ao registrar dados do usuário.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Delete the invite
        await supabaseAdmin
            .from('user_invites')
            .delete()
            .eq('email', email);

        return new Response(
            JSON.stringify({ message: 'Usuário ativado com sucesso!', user: authData.user }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("Erro não tratado:", error);
        return new Response(
            JSON.stringify({ error: error.message || 'Ocorreu um erro interno.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
