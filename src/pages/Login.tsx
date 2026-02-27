import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';

type FieldErrors = {
  identifier?: string;
  password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]{2,29}$/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const validateIdentifier = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) return 'Informe email ou usuário.';
  if (normalized.includes('@')) {
    if (!EMAIL_REGEX.test(normalized)) return 'Informe um email válido.';
    return null;
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return 'Usuário inválido. Use 3 a 30 caracteres (letras, números, ., _ ou -), iniciando por letra.';
  }
  return null;
};

const validatePassword = (value: string): string | null => {
  if (!value) return 'Informe sua senha.';
  // Removed strict validation to allow login with existing passwords
  return null;
};

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentUser, isInitializing } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loginApiUrl = import.meta.env.VITE_LOGIN_API_URL as string | undefined;

  const passwordRules = useMemo(
    () => ({
      minLength: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: SPECIAL_CHAR_REGEX.test(password),
    }),
    [password]
  );

  // Load saved email on mount if "remember me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const wasRemembered = localStorage.getItem('remember_me') === 'true';

    if (savedEmail && wasRemembered) {
      setIdentifier(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    // Only redirect to dashboard if we have a valid Supabase user AND a loaded DB user
    // This prevents loops when a user has a session but was deleted from the DB
    if (user && currentUser && !isInitializing) {
      navigate('/', { replace: true });
    }
  }, [user, currentUser, isInitializing, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifierError = validateIdentifier(identifier);
    const passwordError = validatePassword(password);

    setFieldErrors({
      identifier: identifierError ?? undefined,
      password: passwordError ?? undefined,
    });

    if (identifierError || passwordError) return;

    const normalizedIdentifier = identifier.trim().toLowerCase();

    setLoading(true);
    setError(null);

    try {


      if (loginApiUrl) {
        const response = await fetch(loginApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: normalizedIdentifier,
            password,
            rememberMe,
          }),
        });

        let responseBody: { message?: string } | null = null;
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          responseBody = await response.json();
        }

        if (!response.ok) {
          setError(responseBody?.message ?? 'Email/usuário ou senha inválidos.');
          return;
        }
      } else {
        if (!normalizedIdentifier.includes('@')) {
          setError(
            'Para login por usuário, configure VITE_LOGIN_API_URL para validar no seu back-end.'
          );
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedIdentifier,
          password,
        });

        if (signInError) {
          setError('Email ou senha inválidos.');
          return;
        }

        // Handle remember me for Supabase login
        if (rememberMe) {
          localStorage.setItem('remembered_email', normalizedIdentifier);
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('remember_me');
        }
      }

      navigate('/', { replace: true });
    } catch {
      setError('Não foi possível concluir o login. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full px-4 py-3.5 bg-slate-900/60 border rounded-lg outline-none text-white placeholder-slate-500 transition-all text-sm';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative font-sans">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] p-4">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white rounded-2xl flex flex-col items-center justify-center mb-4 shadow-lg shadow-black/20 p-2 overflow-hidden"><img src="/logo.png" alt="TOPAZIO Empreendimentos" className="h-[72px] object-contain" /></div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TOPAZIO</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-300 ml-1">
                Email ou usuário
              </label>
              <input
                type="text"
                className={`${inputBase} ${fieldErrors.identifier
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  : 'border-slate-700/80 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  }`}
                placeholder="Digite seu email ou usuário"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
                }}
                onBlur={() => {
                  const err = validateIdentifier(identifier);
                  setFieldErrors((p) => ({ ...p, identifier: err ?? undefined }));
                }}
              />
              {fieldErrors.identifier && (
                <p className="text-xs text-red-300 ml-1">{fieldErrors.identifier}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-300 ml-1">Senha</label>
                <Button
                  variant="link"
                  className="text-white hover:text-white/80 p-0 h-auto font-normal text-sm"
                  onClick={() => navigate('/esqueceu-senha')}
                  type="button"
                >
                  Esqueceu a senha?
                </Button>
              </div>
              <input
                type="password"
                className={`${inputBase} tracking-widest ${fieldErrors.password
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  : 'border-slate-700/80 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  }`}
                placeholder="Informe sua senha"
                value={password}
                onFocus={() => setIsPasswordFocused(true)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                onBlur={() => {
                  setIsPasswordFocused(false);
                  // Removed strict validation on blur to allow any password
                }}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-300 ml-1">{fieldErrors.password}</p>
              )}
              {isPasswordFocused && (
                <div className="grid grid-cols-2 gap-1 text-[11px] ml-1 pt-1">
                  <span className={passwordRules.minLength ? 'text-emerald-300' : 'text-slate-400'}>
                    8+ caracteres
                  </span>
                  <span className={passwordRules.upper ? 'text-emerald-300' : 'text-slate-400'}>
                    Maiúscula
                  </span>
                  <span className={passwordRules.lower ? 'text-emerald-300' : 'text-slate-400'}>
                    Minúscula
                  </span>
                  <span className={passwordRules.number ? 'text-emerald-300' : 'text-slate-400'}>
                    Número
                  </span>
                  <span className={passwordRules.special ? 'text-emerald-300' : 'text-slate-400'}>
                    Especial
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-600 focus:ring-orange-500 focus:ring-offset-slate-800 cursor-pointer accent-orange-500"
              />
              <label
                htmlFor="remember"
                className="text-sm text-slate-300 cursor-pointer select-none hover:text-white transition-colors"
              >
                Lembrar-me
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Acessando...
                  </>
                ) : (
                  'Acessar sistema'
                )}
              </button>



              <div className="text-center pt-2">
                <Button
                  variant="link"
                  className="text-slate-400 hover:text-white p-0 h-auto font-normal text-xs"
                  onClick={() => navigate('/primeiro-acesso')}
                  type="button"
                >
                  Este é seu primeiro acesso? <span className="text-orange-500 font-bold ml-1">Ative sua conta aqui.</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="relative z-10 mt-8 text-center px-4">
        <p className="text-slate-500 text-xs font-medium">
          © 2025 TOPAZIO Empreendimentos. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
