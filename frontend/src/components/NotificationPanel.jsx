import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/api';

// Type → icon/color mapping
const TYPE_META = {
  retard:    { icon: 'warning',      iconColor: 'text-rose-500',   bg: 'bg-rose-950/20',   border: 'border-rose-900/40' },
  evenement: { icon: 'event_repeat', iconColor: 'text-indigo-400', bg: 'bg-indigo-950/20', border: 'border-indigo-900/40' },
  mouvement: { icon: 'swap_horiz',   iconColor: 'text-amber-400',  bg: 'bg-amber-950/20',  border: 'border-amber-900/40' },
  systeme:   { icon: 'check_circle', iconColor: 'text-emerald-400',bg: 'bg-emerald-950/20',border: 'border-emerald-900/40' },
  membre:    { icon: 'person_add',   iconColor: 'text-sky-400',    bg: 'bg-sky-950/20',    border: 'border-sky-900/40' },
};

const getTypeMeta = (type) => TYPE_META[type] || TYPE_META.systeme;

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
};

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const queryClient = useQueryClient();

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll().then(r => r.data),
    refetchInterval: 30000,   // poll every 30s
    refetchIntervalInBackground: true,
  });

  const notifications = Array.isArray(data) ? data : (data?.results || []);
  const unreadCount   = notifications.filter(n => !n.is_read).length;

  // ─── Mutations ────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: invalidate,
  });

  const dismiss = useMutation({
    mutationFn: (id) => notificationService.dismiss(id),
    onSuccess: invalidate,
  });

  const clearAll = useMutation({
    mutationFn: () => notificationService.clearAll(),
    onSuccess: invalidate,
  });

  // ─── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleNotifClick = (notif) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    setIsOpen(false);
  };

  const handleDismiss = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    dismiss.mutate(id);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
        aria-label="Notifications"
      >
        <span className={`material-symbols-outlined transition-colors ${isOpen ? 'text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-[200] animate-in fade-in slide-in-from-top-2 duration-150 font-mono">

          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">notifications</span>
              <span className="text-[10px] font-black tracking-widest text-slate-700 dark:text-slate-200 uppercase">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-[9px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-600 animate-spin text-2xl block mb-2">
                  progress_activity
                </span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-4xl block mb-2">notifications_off</span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = getTypeMeta(notif.type);
                return (
                  <Link
                    key={notif.id}
                    to={notif.link || '/dashboard'}
                    onClick={() => handleNotifClick(notif)}
                    className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 relative group ${
                      !notif.is_read ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                    }`}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    )}

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border}`}>
                      <span className={`material-symbols-outlined text-sm ${meta.iconColor}`}>{meta.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold uppercase tracking-wide truncate ${!notif.is_read ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      disabled={dismiss.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400 hover:text-rose-500 cursor-pointer mt-0.5 disabled:opacity-30"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {!isLoading && notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-center">
              <button
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
              >
                {clearAll.isPending ? 'Suppression...' : 'Effacer toutes les notifications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
