import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const IncompleteProfileBanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.profileComplete) return null;

  return (
    <div
      style={{
        background: '#2563EB',
        color: '#FFFFFF',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 50,
        width: '100%',
      }}
    >
      {/* Shimmer via CSS animation */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
          animation: 'shimmer-banner 3s linear infinite',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
        <AlertCircle size={15} />
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Seu perfil está incompleto! Complete agora e ganhe um cupom de FRETE GRÁTIS.
        </span>
      </div>

      <button
        onClick={() => navigate('/minha-conta?s=menu')}
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#FFFFFF',
          color: '#1E3A5F',
          padding: '5px 14px',
          borderRadius: 9999,
          fontSize: 9,
          fontWeight: 900,
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        COMPLETAR <ArrowRight size={11} />
      </button>
    </div>
  );
};
