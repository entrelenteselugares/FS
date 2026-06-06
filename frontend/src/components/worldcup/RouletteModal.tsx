import React, { useState, useEffect } from 'react';
import { API as api } from '../../lib/api';
import { X } from 'lucide-react';

interface Prize {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
}

interface RouletteModalProps {
  onClose: () => void;
  onSpinComplete: (prize: Prize) => void;
}

export const RouletteModal: React.FC<RouletteModalProps> = ({ onClose, onSpinComplete }) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Fetch available prizes
    api.get('/worldcup/roulette/status')
      .then(res => {
        if (res.data.prizes) {
          setPrizes(res.data.prizes);
        }
      })
      .catch(err => console.error("Error fetching prizes", err));
  }, []);

  const spin = async () => {
    if (spinning || wonPrize || prizes.length === 0) return;

    try {
      setSpinning(true);
      
      // Simulate spinning UI instantly while we wait for backend
      const randomExtraSpins = 360 * 5; // 5 full rotations
      
      const res = await api.post('/worldcup/roulette/spin');
      const prize = res.data.prize;
      
      // Calculate where to land based on the prize won
      const prizeIndex = prizes.findIndex(p => p.id === prize.id);
      const segmentAngle = 360 / Math.max(prizes.length, 1);
      const targetRotation = randomExtraSpins + (360 - (prizeIndex * segmentAngle));

      setRotation(targetRotation);

      // Wait for the animation to finish
      setTimeout(() => {
        setSpinning(false);
        setWonPrize(prize);
      }, 4000);

    } catch (err: unknown) {
      console.error("Spin error", err);
      setSpinning(false);
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || "Erro ao girar a roleta.");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
        borderRadius: 24, padding: 32, maxWidth: 400, width: '90%',
        textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative', overflow: 'hidden'
      }}>
        
        {/* Close Button if already won or not spinning */}
        {!spinning && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer'
          }}>
            <X size={24} />
          </button>
        )}

        <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px 0' }}>
          Roleta da Sorte 🎰
        </h2>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 32 }}>
          Gire para ganhar prêmios da Copa!
        </p>

        {/* The Wheel */}
        <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto 32px' }}>
          {/* Pointer */}
          <div style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
            borderTop: '25px solid #ef4444', zIndex: 10
          }}></div>

          {/* Wheel Body */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #374151',
            overflow: 'hidden', position: 'relative',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            background: '#1f2937'
          }}>
            {prizes.map((prize, i) => {
              const angle = 360 / prizes.length;
              const rotationAngle = angle * i;
              return (
                <div key={prize.id} style={{
                  position: 'absolute', top: 0, left: '50%', transformOrigin: 'bottom center',
                  width: 100, height: '50%', marginLeft: -50,
                  transform: `rotate(${rotationAngle}deg)`,
                  background: i % 2 === 0 ? '#374151' : '#4b5563',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  paddingTop: 16, clipPath: 'polygon(0 0, 100% 0, 50% 100%)'
                }}>
                  <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold', transform: 'rotate(90deg)', marginTop: 20 }}>
                    {prize.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {wonPrize ? (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ color: '#10b981', fontSize: 20, marginBottom: 8 }}>Parabéns!</h3>
            <p style={{ color: 'white', marginBottom: 24 }}>Você ganhou: <strong>{wonPrize.name}</strong></p>
            <button 
              onClick={() => { onSpinComplete(wonPrize); onClose(); }}
              style={{
                width: '100%', padding: '14px 24px', background: '#3b82f6', color: 'white',
                border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Resgatar e Continuar
            </button>
          </div>
        ) : (
          <button 
            onClick={spin}
            disabled={spinning || prizes.length === 0}
            style={{
              width: '100%', padding: '16px 24px', 
              background: spinning || prizes.length === 0 ? '#4b5563' : 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)', 
              color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16,
              cursor: spinning || prizes.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: spinning || prizes.length === 0 ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}
          >
            {spinning ? 'Girando...' : prizes.length === 0 ? 'Sem prêmios no momento' : 'GIRAR AGORA'}
          </button>
        )}
      </div>
    </div>
  );
};
