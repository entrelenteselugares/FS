"use client";

import { useState } from "react";
import { loginAction, registroAction } from "@/lib/actions/auth.actions";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // As actions esperam (prevState, formData). Passamos um objeto vazio como prevState.
    const res = isLogin 
      ? await loginAction({} as any, formData) 
      : await registroAction({} as any, formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
    // O redirecionamento é tratado dentro das Server Actions via redirect()
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-[420px] bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-[#4f46e5] rounded-full"></div>
          <h1 className="text-2xl font-bold tracking-tight">Foto Segundo</h1>
        </div>
        <p className="text-sm text-[#666] mb-8">Gestão de mídia para eventos</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] p-1 rounded-xl mb-7">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 py-2 text-sm rounded-lg transition ${isLogin ? 'bg-[#1a1a1a] text-white shadow' : 'text-[#555]'}`}
          >
            Entrar
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 py-2 text-sm rounded-lg transition ${!isLogin ? 'bg-[#1a1a1a] text-white shadow' : 'text-[#555]'}`}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-500 text-xs">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1">Nome completo</label>
              <input 
                name="nome" 
                type="text" 
                required 
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#4f46e5] transition-colors" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-[#888] mb-1">WhatsApp</label>
            <input 
              name="whatsapp" 
              type="tel" 
              placeholder="(11) 99999-9999" 
              required 
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#4f46e5] transition-colors" 
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1">Senha</label>
            <input 
              name="senha" 
              type="password" 
              required 
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#4f46e5] transition-colors" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium py-3 rounded-xl transition-all active:scale-95 mt-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Processando..." : (isLogin ? "Entrar" : "Criar minha conta")}
          </button>
        </form>
      </div>
      <p className="mt-8 text-[10px] text-[#444] text-center uppercase tracking-widest">
        Foto Segundo v1.0 · Next.js 16 + Supabase + Mercado Pago
      </p>
    </div>
  );
}
