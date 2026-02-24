import { supabase } from '@/lib/supabase/client'
import { User, Role, UserInvite } from '@/types'

export const usersService = {
    // --- USERS ---

    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('nome')

        if (error) throw error

        return (data || []).map((u: any) => ({
            id: u.id,
            name: u.nome,
            email: u.email,
            role: (u.role as Role) || 'sub_user',
            companyName: u.cnpj ? 'Aparecida Cortez Lopes - Construção' : null,
            cnpj: u.cnpj,
            phone: u.telefone,
            permissions: u.permissions || {
                dashboard: false,
                financeiro: false,
                colaboradores: false,
                obras: false,
                veiculos: false,
                alojamento: false,
                configuracoes: false,
            },
        }))
    },

    async getByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single()

        if (error) return null

        const u = data as any
        return {
            id: u.id,
            name: u.nome,
            email: u.email,
            role: (u.role as Role) || 'sub_user',
            cnpj: u.cnpj,
            phone: u.telefone,
            permissions: u.permissions || {},
        }
    },

    async getById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null

        const u = data as any
        return {
            id: u.id,
            name: u.nome,
            email: u.email,
            role: (u.role as Role) || 'sub_user',
            cnpj: u.cnpj,
            phone: u.telefone,
            permissions: u.permissions || {},
        }
    },

    async isUserActivated(email: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)

        if (error) return false
        return (count || 0) > 0
    },

    async update(id: string, updates: Partial<User>) {
        const dbUpdates: any = {}
        if (updates.name) dbUpdates.nome = updates.name
        if (updates.email) dbUpdates.email = updates.email
        if (updates.role) dbUpdates.role = updates.role
        if (updates.cnpj) dbUpdates.cnpj = updates.cnpj
        if (updates.phone) dbUpdates.phone = updates.phone
        if (updates.permissions) dbUpdates.permissions = updates.permissions

        const { error } = await supabase
            .from('usuarios')
            .update(dbUpdates)
            .eq('id', id)

        if (error) throw error
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // --- INVITES ---

    async getInvites(): Promise<UserInvite[]> {
        const { data, error } = await supabase
            .from('user_invites')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return (data || []) as unknown as UserInvite[]
    },

    async createInvite(invite: UserInvite) {
        // 1. Delete existing invite for the same email to avoid duplicates
        await this.deleteInvite(invite.email)

        // 2. Insert new invite
        const { error } = await supabase.from('user_invites').insert({
            email: invite.email,
            name: invite.name,
            role: invite.role,
            permissions: invite.permissions as any,
        })

        if (error) throw error
    },

    async deleteInvite(email: string) {
        const { error } = await supabase
            .from('user_invites')
            .delete()
            .eq('email', email)

        if (error) throw error
    },

    async checkInvite(email: string): Promise<UserInvite | null> {
        // Call the security definer function to bypass RLS for public/anon
        const { data, error } = await supabase.rpc('check_invite', {
            check_email: email,
        })

        if (error) throw error
        return (data as unknown) as UserInvite | null
    },

    async completeFirstAccess(id: string, email: string, invite: UserInvite) {
        // 1. Insert into public.usuarios
        const { error: insertError } = await supabase.from('usuarios').insert({
            id: id, // Link to auth.users id
            email: email,
            nome: invite.name,
            role: invite.role,
            permissions: invite.permissions as any,
            status: 'ativo',
        })

        if (insertError) throw insertError

        // 2. Delete invite
        await this.deleteInvite(email)
    },
}
