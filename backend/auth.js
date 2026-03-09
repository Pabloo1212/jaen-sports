/**
 * JaénSports — Auth Module (Supabase Version)
 * Real login/register with Supabase Auth & Database
 */
const JaenAuth = (() => {
    let currentUser = null;

    // Load session on startup (y tras redirect de Google OAuth)
    async function initSession() {
        if (!window.supabase) return;
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session && session.user) {
            await fetchUserProfile(session.user.id, session.user.user_metadata);
            if (typeof window.updateHeaderAuth === 'function') window.updateHeaderAuth();
        }
    }

    // Auth state listener
    if (window.supabase) {
        window.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session && session.user) {
                    await fetchUserProfile(session.user.id, session.user.user_metadata);
                    if (typeof window.updateHeaderAuth === 'function') window.updateHeaderAuth();
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                if (typeof window.updateHeaderAuth === 'function') window.updateHeaderAuth();
            }
        });
        initSession();
    }

    async function fetchUserProfile(userId, userMetadata = null) {
        if (!window.supabase) return;
        const { data, error } = await window.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            currentUser = data;
            return;
        }
        // Perfil no existe (ej. primer login con Google): crear/actualizar desde auth
        if (userMetadata) {
            const name = userMetadata.full_name || userMetadata.name || (userMetadata.email || '').split('@')[0] || 'Usuario';
            const email = userMetadata.email || '';
            const avatar = userMetadata.avatar_url || null;
            const { error: upsertErr } = await window.supabase.from('users').upsert({
                id: userId,
                name,
                email,
                avatar
            }, { onConflict: 'id' });
            if (!upsertErr) {
                const { data: inserted } = await window.supabase.from('users').select('*').eq('id', userId).single();
                if (inserted) currentUser = inserted;
            }
        }
    }

    return {
        isLoggedIn() { return currentUser !== null; },

        getCurrentUser() { return currentUser; },

        getUserName() { return currentUser ? currentUser.name : null; },

        async login(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                await fetchUserProfile(data.user.id);
                return { success: true, user: currentUser };
            } catch (error) {
                console.error("Login error:", error);
                let msg = 'Error de inicio de sesión';
                if (error.message.includes('Invalid login credentials')) msg = 'Correo o contraseña incorrectos';
                return { success: false, error: msg };
            }
        },

        async register(name, email, password) {
            try {
                // 1. Sign up built-in Auth
                const { data, error } = await window.supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                if (!data.user) throw new Error('No user returned');

                // 2. Insert into our public.users profile table
                const { error: profileError } = await window.supabase
                    .from('users')
                    .insert([{
                        id: data.user.id,
                        name: name,
                        email: email
                    }]);

                if (profileError) throw profileError;

                await fetchUserProfile(data.user.id);
                return { success: true, user: currentUser };
            } catch (error) {
                console.error("Register error:", error);
                let msg = 'Error en el registro';
                if (error.message.includes('already registered')) msg = 'Este correo ya está registrado';
                return { success: false, error: msg };
            }
        },

        async logout() {
            await window.supabase.auth.signOut();
            currentUser = null;
            window.location.href = 'index.html';
        },

        async updateProfile(updates) {
            if (!this.isLoggedIn()) return null;
            try {
                const { data, error } = await window.supabase
                    .from('users')
                    .update(updates)
                    .eq('id', currentUser.id)
                    .select()
                    .single();

                if (error) throw error;
                currentUser = data;
                return currentUser;
            } catch (error) {
                console.error("Update profile error:", error);
                return null;
            }
        },

        requireLogin() {
            if (this.isLoggedIn()) return true;
            if (typeof openAuthModal === 'function') openAuthModal();
            return false;
        }
    };
})();
