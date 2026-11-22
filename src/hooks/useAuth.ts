import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getCurrentOwnerId } from '../lib/businessFetch';

type UserRole = 'super_admin' | 'customer' | null;
const normalizeRole = (role: string | undefined): UserRole => role === 'super_admin' ? 'super_admin' : 'customer';

interface AuthState {
  authInitialized: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  userRole: UserRole;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUserRole: () => Promise<void>;
  isSuperAdmin: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => {
      const fetchUserRole = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            set({ userRole: null, userId: null, userEmail: null });
            return;
          }

          console.log('Fetching role for user ID:', user.id);

          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          console.log('fetchUserRole - User data:', userData);
          console.log('fetchUserRole - Error:', error);

          if (error) {
            console.error('Error fetching user role:', error);
            set({ userRole: 'customer', userId: user.id, userEmail: user.email });
            return;
          }

          set({
            userRole: normalizeRole(userData?.role),
            userId: user.id,
            userEmail: user.email
          });
        } catch (error) {
          console.error('Error in fetchUserRole:', error);
          set({ userRole: null, userId: null, userEmail: null });
        }
      };

      supabase.auth.onAuthStateChange((_event, session) => {
        const isAuth = !!session;
        set({ isAuthenticated: isAuth });
        if (isAuth) {
          fetchUserRole().finally(() => set({ authInitialized: true }));
        } else {
          set({ authInitialized: true, userRole: null, userId: null, userEmail: null });
        }
      });

      return {
        authInitialized: false,
        isAuthenticated: false,
        userId: null,
        userRole: null,
        userEmail: null,

        login: async (email: string, password: string) => {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            if (data.user) {
              console.log('User ID:', data.user.id);

              const { data: userData, error: roleError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

              console.log('User data from DB:', userData);
              console.log('Role error:', roleError);

              set({
                authInitialized: true,
                isAuthenticated: true,
                userId: data.user.id,
                userEmail: data.user.email,
                userRole: normalizeRole(userData?.role)
              });
            }

            toast.success('Bem-vindo de volta!');
            return true;
          } catch (error) {
            console.error('Login error:', error);
            toast.error('Email ou senha inválidos');
            set({ isAuthenticated: false, userId: null, userRole: null, userEmail: null });
            set({ authInitialized: true, isAuthenticated: false, userId: null, userRole: null, userEmail: null });
            return false;
          }
        },

        register: async (email: string, password: string) => {
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) throw error;

            if (data.user) {
              // Note: The database trigger automatically creates the user record in public.users
              // We wait briefly to ensure the trigger has completed
              await new Promise(resolve => setTimeout(resolve, 100));

              // Fetch the user role from the database
              const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

              set({
                authInitialized: true,
                isAuthenticated: true,
                userId: data.user.id,
                userEmail: data.user.email,
                userRole: normalizeRole(userData?.role)
              });

              toast.success('Conta criada com sucesso!');
              return true;
            }

            return false;
          } catch (error) {
            console.error('Register error:', error);

            if (error instanceof Error && error.message.includes('already registered')) {
              toast.error('Este email já está registrado');
            } else {
              toast.error('Erro ao criar conta. Tente novamente.');
            }

            return false;
          }
        },

        logout: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            set({
              authInitialized: true,
              isAuthenticated: false,
              userId: null,
              userRole: null,
              userEmail: null
            });

            toast.success('Sessão terminada com sucesso!');
          } catch (error) {
            console.error('Logout error:', error);
            toast.error('Erro ao sair da conta');
          }
        },

        fetchUserRole,

        isSuperAdmin: () => {
          return get().userRole === 'super_admin' && get().userId === getCurrentOwnerId();
        },
      };
    },
    {
      name: 'auth-storage',
      skipHydration: true,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authInitialized: state.authInitialized,
        userId: state.userId,
        userRole: state.userRole,
        userEmail: state.userEmail,
      }),
    }
  )
);
