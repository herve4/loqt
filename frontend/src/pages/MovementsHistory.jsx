import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';
import { toast } from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale/fr';

registerLocale('fr', fr);

const CustomDateInput = React.forwardRef(({ value, onClick, placeholder, clearable, onClear }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 text-sm rounded-none text-left text-slate-900 dark:text-slate-100 transition-all hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-0 flex items-center justify-between group cursor-pointer"
  >
    <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
      {value || placeholder}
    </span>
    <div className="flex items-center gap-1.5 ml-2">
      {clearable && value && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="material-symbols-outlined text-[16px] text-slate-400 hover:text-red-500 transition-colors p-0.5 select-none"
        >
          close
        </span>
      )}
      <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-slate-600 dark:group-hover:text-slate-400 select-none">
        calendar_today
      </span>
    </div>
  </button>
));
CustomDateInput.displayName = 'CustomDateInput';

const formatDateToString = (date) => {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const MovementsHistory = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeMouvement, setTypeMouvement] = useState('');
  const [egliseOrigine, setEgliseOrigine] = useState('');
  const [dateGte, setDateGte] = useState('');
  const [dateLte, setDateLte] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch eglises for filter dropdown
  const { data: churchesData } = useQuery({
    queryKey: ['churches-minimal'],
    queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(res => res.data)
  });
  const churches = churchesData?.results || (Array.isArray(churchesData) ? churchesData : []);

  // Fetch movements log
  const { data: movementsData, isLoading, isError, error } = useQuery({
    queryKey: ['movements-history', page, debouncedSearch, typeMouvement, egliseOrigine, dateGte, dateLte],
    queryFn: () => logisticsService.getMovements({
      page,
      search: debouncedSearch || undefined,
      type_mouvement: typeMouvement || undefined,
      eglise_origine: egliseOrigine || undefined,
      date_mouvement__gte: dateGte || undefined,
      date_mouvement__lte: dateLte || undefined,
    }).then(res => res.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000
  });

  // Fetch batch items when a batch is active in drawer
  const { data: batchMovementsData, isLoading: isLoadingBatch } = useQuery({
    queryKey: ['batch-movements', selectedBatchId],
    queryFn: () => logisticsService.getMovements({ batch_id: selectedBatchId, page_size: 100 }).then(res => res.data),
    enabled: !!selectedBatchId
  });
  const batchMovements = batchMovementsData?.results || [];

  const movements = movementsData?.results || [];
  const totalCount = movementsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const handleRowClick = (mvt) => {
    setSelectedMovement(mvt);
    setSelectedBatchId(mvt.batch_id || null);
  };

  const handleCloseDrawer = () => {
    setSelectedBatchId(null);
    setSelectedMovement(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Format type helpers
  const getTypeBadge = (type) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none">
            <span className="size-1 bg-emerald-500 rounded-none"></span>
            ENTRÉE
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 border border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none">
            <span className="size-1 bg-blue-500 rounded-none"></span>
            SORTIE
          </span>
        );
      case 'PRET':
        return (
          <span className="inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none">
            <span className="size-1 bg-amber-500 rounded-none"></span>
            PRÊT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 border border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-none">
            {type}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout title="Historique des Flux">
      {/* Native Print Stylesheet Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px;
          }
          .no-print {
            display: none !important;
          }
        }

        /* react-datepicker Swiss-Minimalist HUD flat overrides */
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          background-color: var(--color-datepicker-bg, #ffffff) !important;
          border: 1px solid var(--color-datepicker-border, #e2e8f0) !important;
          border-radius: 0px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          color: var(--color-datepicker-text, #0f172a) !important;
        }
        .dark .react-datepicker {
          --color-datepicker-bg: #0f172a;
          --color-datepicker-border: #1e293b;
          --color-datepicker-text: #f1f5f9;
        }
        .react-datepicker__header {
          background-color: var(--color-datepicker-header-bg, #f8fafc) !important;
          border-bottom: 1px solid var(--color-datepicker-border, #e2e8f0) !important;
          border-radius: 0px !important;
          padding-top: 8px !important;
        }
        .dark .react-datepicker__header {
          --color-datepicker-header-bg: #020617;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--color-datepicker-text, #0f172a) !important;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: var(--color-datepicker-text, #0f172a) !important;
          width: 2rem !important;
          line-height: 2rem !important;
          border-radius: 0px !important;
        }
        .react-datepicker__day:hover {
          background-color: var(--color-datepicker-hover-bg, #f1f5f9) !important;
          border-radius: 0px !important;
        }
        .dark .react-datepicker__day:hover {
          --color-datepicker-hover-bg: #1e293b;
        }
        .react-datepicker__day--selected {
          background-color: #1745cf !important;
          color: #ffffff !important;
          border-radius: 0px !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: rgba(23, 69, 207, 0.15) !important;
          color: var(--color-datepicker-text, #0f172a) !important;
          border-radius: 0px !important;
        }
        .react-datepicker__day--outside-month {
          color: #94a3b8 !important;
          opacity: 0.4;
        }
        .react-datepicker__navigation-icon::before {
          border-color: var(--color-datepicker-text, #0f172a) !important;
          border-width: 2px 2px 0 0 !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>

      <div className="p-6 space-y-6">
          {/* Top Info Banner / Title section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-sans">HISTORIQUE DES MOUVEMENTS</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                REGISTRE LOGISTIQUE NATIONAL • ENTRÉES, SORTIES & PRÊTS EN TEMPS RÉEL
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-none">
              <span className="size-2 bg-emerald-500 rounded-none inline-block animate-pulse"></span>
              LEDEGER SYNCHRONISÉ ({totalCount} ENREGISTREMENTS)
            </div>
          </div>

          {/* Filters Bar - Swiss-Minimalist Grid (Hidden on print) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4 no-print rounded-none">
            {/* Search & Toggle Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
              {/* Search text (Always Visible) */}
              <div className="flex-1 flex flex-col space-y-1 w-full">
                <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">RECHERCHE</label>
                <div className="relative flex items-center w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-all hover:border-slate-400 dark:hover:border-slate-600 rounded-none">
                  <span className="material-symbols-outlined text-slate-400 ml-2.5 text-lg select-none">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Lot, matériel, notes..."
                    className="w-full bg-transparent py-2 px-3 text-sm border-0 border-transparent focus:ring-0 focus:ring-transparent outline-none focus:outline-none rounded-none text-slate-900 dark:text-slate-100"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="pr-2.5 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle Advanced Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 border font-mono text-xs font-semibold rounded-none transition-all cursor-pointer h-[38px] w-full sm:w-auto ${
                  showFilters
                    ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'
                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {showFilters ? 'tune' : 'filter_list'}
                </span>
                {showFilters ? '[ MASQUER LES FILTRES ]' : '[ FILTRES AVANCÉS ]'}
              </button>
            </div>

            {/* Advanced Filters Grid (Collapsible) */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                {/* Type filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">TYPE DE FLUX</label>
                  <select
                    value={typeMouvement}
                    onChange={(e) => { setTypeMouvement(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 text-sm rounded-none focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-slate-900 dark:text-slate-100 transition-all hover:border-slate-400 dark:hover:border-slate-600 appearance-none cursor-pointer"
                    style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundPosition: "right 8px center", backgroundSize: "16px", backgroundRepeat: "no-repeat" }}
                  >
                    <option value="">Tous les flux</option>
                    <option value="IN">Entrée (IN)</option>
                    <option value="OUT">Sortie (OUT)</option>
                    <option value="PRET">Prêt (PRET)</option>
                  </select>
                </div>

                {/* Church filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">ÉGLISE ORIGINE</label>
                  <select
                    value={egliseOrigine}
                    onChange={(e) => { setEgliseOrigine(e.target.value); setPage(1); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 py-2 px-3 text-sm rounded-none focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-slate-900 dark:text-slate-100 transition-all hover:border-slate-400 dark:hover:border-slate-600 appearance-none cursor-pointer"
                    style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundPosition: "right 8px center", backgroundSize: "16px", backgroundRepeat: "no-repeat" }}
                  >
                    <option value="">Toutes les églises</option>
                    {churches.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Date Min */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">DATE DÉBUT</label>
                  <DatePicker
                    selected={dateGte ? new Date(dateGte + 'T00:00:00') : null}
                    onChange={(date) => { setDateGte(date ? formatDateToString(date) : ''); setPage(1); }}
                    maxDate={dateLte ? new Date(dateLte + 'T00:00:00') : null}
                    placeholderText="jj/mm/aaaa"
                    locale="fr"
                    dateFormat="dd/MM/yyyy"
                    customInput={
                      <CustomDateInput
                        placeholder="jj/mm/aaaa"
                        clearable={true}
                        onClear={() => { setDateGte(''); setPage(1); }}
                      />
                    }
                  />
                </div>

                {/* Date Max */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">DATE FIN</label>
                  <DatePicker
                    selected={dateLte ? new Date(dateLte + 'T00:00:00') : null}
                    onChange={(date) => { setDateLte(date ? formatDateToString(date) : ''); setPage(1); }}
                    minDate={dateGte ? new Date(dateGte + 'T00:00:00') : null}
                    placeholderText="jj/mm/aaaa"
                    locale="fr"
                    dateFormat="dd/MM/yyyy"
                    customInput={
                      <CustomDateInput
                        placeholder="jj/mm/aaaa"
                        clearable={true}
                        onClear={() => { setDateLte(''); setPage(1); }}
                      />
                    }
                  />
                </div>
              </div>
            )}

            {/* Clear filters shortcut */}
            {(typeMouvement || egliseOrigine || dateGte || dateLte || search) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSearch('');
                    setTypeMouvement('');
                    setEgliseOrigine('');
                    setDateGte('');
                    setDateLte('');
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono rounded-none border border-red-500/20 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                  RÉINITIALISER LES FILTRES
                </button>
              </div>
            )}
          </div>

          {/* Ledger Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden no-print">
            {isLoading ? (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">progress_activity</span>
                <p className="text-sm font-mono text-slate-500">CHARGEMENT DES DONNÉES EN COURS...</p>
              </div>
            ) : isError ? (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                <p className="text-sm font-mono text-red-500">ERREUR DE CHARGEMENT API</p>
                <p className="text-xs text-slate-400 max-w-md">{error?.message || 'Erreur inconnue'}</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">drafts</span>
                <p className="text-sm font-mono text-slate-500">AUCUN MOUVEMENT TROUVÉ DANS LE REGISTRE</p>
                <p className="text-xs text-slate-400">Modifiez les filtres de recherche ou saisissez de nouveaux flux.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                      <th className="py-3.5 px-4 font-semibold">DATE & HEURE</th>
                      <th className="py-3.5 px-4 font-semibold">MATÉRIEL</th>
                      <th className="py-3.5 px-4 font-semibold">RÉFÉRENCE LOT</th>
                      <th className="py-3.5 px-4 font-semibold">TYPE</th>
                      <th className="py-3.5 px-4 font-semibold">ORIGINE → DESTINATION</th>
                      <th className="py-3.5 px-4 font-semibold text-right">QTÉ</th>
                      <th className="py-3.5 px-4 font-semibold">OPÉRATEUR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-mono">
                    {movements.map((mvt) => (
                      <tr
                        key={mvt.id}
                        onClick={() => handleRowClick(mvt)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 cursor-pointer transition-colors border-slate-200 dark:border-slate-800 group"
                      >
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(mvt.date_mouvement)}
                        </td>
                        <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center rounded-none group-hover:border-slate-400 dark:group-hover:border-slate-600 transition-colors">
                              <span className="material-symbols-outlined text-slate-400 text-base select-none">construction</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{mvt.materiel_nom}</p>
                              <p className="text-[10px] font-mono text-slate-400 tracking-tight">ID: #{mvt.materiel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-blue-600 dark:text-blue-400 select-all whitespace-nowrap">
                          {mvt.batch_id ? mvt.batch_id.substring(0, 8) + '...' : '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          {getTypeBadge(mvt.type_mouvement)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{mvt.eglise_origine_nom || 'Interne'}</span>
                            <span className="material-symbols-outlined text-slate-400 text-xs select-none">arrow_forward</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{mvt.eglise_destination_nom || 'Non renseignée'}</span>
                          </div>
                          {mvt.evenement_titre && (
                            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Événement: {mvt.evenement_titre}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {mvt.quantite}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {mvt.responsable_nom || 'Système'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !isError && totalCount > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-500">
                <div>
                  Affiche <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(totalCount, (page - 1) * 10 + 1)}</span> à{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(totalCount, page * 10)}</span> sur{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> mouvements
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-mono font-semibold rounded-none cursor-pointer"
                  >
                    [ PRÉCÉDENT ]
                  </button>
                  <div className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">
                    PAGE {page} SUR {totalPages}
                  </div>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-mono font-semibold rounded-none cursor-pointer"
                  >
                    [ SUIVANT ]
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Slide-out Drawer Panel (Side-Drawer) - Hidden on standard page, active on click */}
      {selectedMovement && (
        <>
          {/* Overlay background */}
          <div
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 no-print"
          ></div>

          {/* Drawer Wrapper */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col no-print">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="space-y-1">
                <h3 className="text-sm font-mono tracking-widest text-slate-400 uppercase">DÉTAIL DE LA TRANSACTION</h3>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">LOT: #{selectedBatchId || '-'}</p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                [ FERMER ]
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* General Metadata */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 dark:border-slate-800 p-4 font-mono text-xs bg-slate-50/50 dark:bg-slate-900/30">
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px]">Date du Transit</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedMovement.date_mouvement)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px]">Opérateur Émetteur</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedMovement.responsable_nom || 'Système'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px]">Type de Transit</span>
                  <div className="pt-0.5">{getTypeBadge(selectedMovement.type_mouvement)}</div>
                </div>
                {selectedMovement.evenement_titre && (
                  <div className="space-y-1 col-span-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <span className="text-slate-400 uppercase text-[10px]">Événement Rattaché</span>
                    <p className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-sm">{selectedMovement.evenement_titre}</p>
                  </div>
                )}
              </div>

              {/* Church information */}
              <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">ÉGLISE ÉMETTRICE (ORIGINE)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedMovement.eglise_origine_nom || 'Stock Central / Interne'}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg">home</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">ÉGLISE RÉCEPTRICE (DESTINATION)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedMovement.eglise_destination_nom || 'Non spécifiée'}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg">near_me</span>
                </div>
              </div>

              {/* Batch list of transited items */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  LISTE DES MATÉRIELS DU LOT ({batchMovements.length})
                </h4>
                {isLoadingBatch ? (
                  <div className="p-8 text-center border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-500">
                    Chargement des membres du lot...
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase text-slate-400">
                          <th className="py-2.5 px-3 font-semibold">MATÉRIEL</th>
                          <th className="py-2.5 px-3 font-semibold text-right">QTÉ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {batchMovements.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="py-2.5 px-3">
                              <span className="font-sans font-semibold text-slate-900 dark:text-slate-100 block">{m.materiel_nom}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">ID: #{m.materiel}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              {m.quantite}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Observational notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">OBSERVATIONS & NOTES</span>
                <div className="border border-slate-200 dark:border-slate-800 p-4 font-sans text-xs bg-slate-50 dark:bg-slate-950 rounded-none leading-relaxed text-slate-600 dark:text-slate-300 min-h-24">
                  {selectedMovement.notes || 'Aucun commentaire ou note technique associés à ce lot.'}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-mono text-xs font-semibold rounded-none border border-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                IMPRIMER BORDEREAU
              </button>
              <button
                onClick={handleCloseDrawer}
                className="px-6 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold rounded-none transition-colors cursor-pointer"
              >
                ANNULER
              </button>
            </div>
          </div>

          {/* Printable Layout Target - Rendered in DOM but only visible in `@media print` */}
          <div id="printable-receipt" className="hidden font-mono text-black bg-white w-full max-w-4xl mx-auto space-y-8 p-10">
            {/* Header */}
            <div className="border-4 border-black p-4 text-center space-y-1">
              <h1 className="text-xl font-bold tracking-widest">SOCIÉTÉ DE GESTION LOGISTIQUE SGL-CI</h1>
              <p className="text-[10px] uppercase font-semibold">MINISTÈRE PROTESTANT BAPTISTE DES OEUVRES ET DE LA LOGISTIQUE</p>
              <div className="border-t-2 border-black my-2"></div>
              <h2 className="text-lg font-bold uppercase tracking-wider">BORDEREAU DE TRANSIT LOGISTIQUE</h2>
            </div>

            {/* Metadata layout */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 border border-black p-4 text-xs">
              <div>
                <span className="font-bold text-[9px] uppercase block">RÉFÉRENCE LOT (BATCH ID)</span>
                <span className="font-semibold text-sm">{selectedBatchId || '-'}</span>
              </div>
              <div>
                <span className="font-bold text-[9px] uppercase block">DATE DU TRANSIT</span>
                <span className="font-semibold text-sm">{formatDate(selectedMovement.date_mouvement)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 col-span-2"></div>
              <div>
                <span className="font-bold text-[9px] uppercase block">ÉGLISE ÉMETTRICE (ORIGINE)</span>
                <span className="font-semibold text-sm">{selectedMovement.eglise_origine_nom || 'Stock Central / Interne'}</span>
              </div>
              <div>
                <span className="font-bold text-[9px] uppercase block">ÉGLISE RÉCEPTRICE (DESTINATION)</span>
                <span className="font-semibold text-sm">{selectedMovement.eglise_destination_nom || 'Non spécifiée'}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 col-span-2"></div>
              <div>
                <span className="font-bold text-[9px] uppercase block">TYPE DE TRANSIT</span>
                <span className="font-semibold text-sm">
                  {selectedMovement.type_mouvement === 'IN' ? 'ENTRÉE EN STOCK' :
                   selectedMovement.type_mouvement === 'OUT' ? 'SORTIE DE STOCK' : 'PRÊT LOGISTIQUE'}
                </span>
              </div>
              <div>
                <span className="font-bold text-[9px] uppercase block">OPÉRATEUR DE LOGISTIQUE SGL</span>
                <span className="font-semibold text-sm">{selectedMovement.responsable_nom || 'Officier Logistique SGL'}</span>
              </div>
              {selectedMovement.evenement_titre && (
                <div className="col-span-2 border-t border-slate-300 pt-2">
                  <span className="font-bold text-[9px] uppercase block">RATTACHÉ À L'ÉVÉNEMENT</span>
                  <span className="font-semibold">{selectedMovement.evenement_titre}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider">MATÉRIELS CONCERNÉS PAR LA DÉCHARGE :</h3>
              <table className="w-full text-left border-collapse text-xs border border-black">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-[9px] font-bold uppercase">
                    <th className="py-2 px-3 border-r border-black">RÉF MATÉRIAU</th>
                    <th className="py-2 px-3 border-r border-black">NOM TECHNIQUE DU MATÉRIEL</th>
                    <th className="py-2 px-3 text-right">QUANTITÉ TRANSITÉE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/40">
                  {batchMovements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 border-r border-black font-semibold">#{m.materiel}</td>
                      <td className="py-2.5 px-3 border-r border-black font-sans">{m.materiel_nom}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{m.quantite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Observations */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs uppercase tracking-wider">OBSERVATIONS PARTICULIÈRES :</h3>
              <div className="border border-black p-4 text-xs font-sans min-h-[80px] leading-relaxed">
                {selectedMovement.notes || 'Aucune observation particulière enregistrée pour ce lot.'}
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold uppercase tracking-wider">LE RESPONSABLE D'EXPÉDITION (SGL)</p>
                <div className="border-b border-black w-2/3 mx-auto border-dotted"></div>
                <p className="text-[10px] text-slate-500">Nom & Signature (Délivrance de Stock)</p>
              </div>
              <div className="space-y-12">
                <p className="font-bold uppercase tracking-wider">LE RÉCEPTIONNAIRE DESTINATAIRE</p>
                <div className="border-b border-black w-2/3 mx-auto border-dotted"></div>
                <p className="text-[10px] text-slate-500">Nom & Signature (Acceptation de Décharge)</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] text-slate-400 text-center border-t border-slate-300 pt-4">
              BORDEREAU TECHNIQUE REÇU DE TRANSIT LOGISTIQUE • SGL-CI • DOCUMENT INTERNE OFFICIEL D'INVENTAIRE ET DE CONTRÔLE.
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default MovementsHistory;
