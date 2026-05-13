import { Bell, Check, X, BellOff, ArrowRight } from "lucide-react";
import { useNotifications, type AppNotification } from "../../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPortal } from "react-dom";

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isOpen, 
    loading, 
    setIsOpen, 
    toggleFeed, 
    markAsRead, 
    markAllAsRead,
    user
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    
    // Roteamento baseado no refType e Role
    if (notif.refType === 'event' && notif.refId) {
      if (user?.role === 'ADMIN') {
        const isQuote = notif.type.includes('QUOTE');
        const target = isQuote ? `/admin/quotes?id=${notif.refId}` : `/admin/events`;
        navigate(target);
      } else {
        navigate(`/e/${notif.refId}`);
      }
    } else if (notif.refType === 'order' && notif.refId) {
      if (user?.role === 'ADMIN') {
        navigate(`/admin/orders`);
      } else {
        navigate(`/cliente/area`);
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button 
        onClick={toggleFeed}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Feed (Centered Modal) */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[70vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Alertas & Notificações</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Central de Comunicação</p>
              </div>
              <div className="flex gap-4">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-tactical hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Marcar lidas
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                   <div className="w-8 h-8 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 opacity-20">
                    <BellOff size={40} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 italic">Tudo limpo por aqui</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase max-w-[200px]">Nenhuma nova notificação tática no momento.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group relative p-6 rounded-[24px] border transition-all cursor-pointer overflow-hidden ${
                        !notif.read 
                          ? 'bg-brand-tactical/5 border-brand-tactical/20' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {!notif.read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <p className={`text-[12px] font-black uppercase italic tracking-tight ${!notif.read ? 'text-brand-tactical' : 'text-zinc-300'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[9px] font-black text-zinc-600 uppercase">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-zinc-500 leading-relaxed uppercase tracking-wider line-clamp-2">
                            {notif.body}
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-zinc-600 group-hover:text-brand-tactical group-hover:bg-brand-tactical/10 transition-all self-center">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors italic"
              >
                — FECHAR CENTRAL —
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
