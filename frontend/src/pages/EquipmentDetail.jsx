import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { logisticsService } from '../services/api';

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoBlock = ({ label, value }) => (
  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
    <p className="font-medium text-sm mt-0.5 truncate">{value || '—'}</p>
  </div>
);

const MovementTypeBadge = ({ type }) => {
  if (type === 'IN')
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-bold">CHECK-IN</span>;
  if (type === 'OUT')
    return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-xs font-bold">CHECK-OUT</span>;
  return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{type}</span>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('movements');

  const { data: materiel, isLoading } = useQuery({
    queryKey: ['materiel', id],
    queryFn: () => logisticsService.getMaterielById(id).then(r => r.data),
    enabled: !!id,
  });

  const { data: movementsData } = useQuery({
    queryKey: ['materiel-movements', id],
    queryFn: () => logisticsService.getMaterielMovements(id).then(r => r.data),
    enabled: !!id,
  });

  const { data: defectsData } = useQuery({
    queryKey: ['materiel-defects', id],
    queryFn: () => logisticsService.getMaterielDefects(id).then(r => r.data),
    enabled: !!id,
  });

  const movements = movementsData?.results || [];
  const defects = defectsData?.results || [];

  const statusColor = () => {
    const s = materiel?.etat;
    if (s === 'OP') return 'bg-green-500';
    if (s === 'PA') return 'bg-red-500';
    if (s === 'RE') return 'bg-yellow-500';
    return 'bg-slate-400';
  };
  const statusLabel = () => {
    const s = materiel?.etat;
    if (s === 'OP') return 'Operational';
    if (s === 'PA') return 'Broken';
    if (s === 'RE') return 'In Repair';
    return s;
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin block">settings</span>
        <p className="mt-4 text-slate-500">Loading equipment…</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-primary hover:bg-primary/10 rounded-full p-1 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-lg font-bold leading-tight">{materiel?.nom || 'Equipment Detail'}</h2>
              <p className="text-xs text-slate-500">{materiel?.identifiant_unique || `EQ-${id}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center justify-center rounded-lg h-10 bg-primary text-white px-4 text-sm font-bold gap-2">
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Details
            </button>
            <button className="flex items-center justify-center rounded-lg h-10 bg-slate-200 dark:bg-slate-800 w-10">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left Column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Main Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Equipment image / icon */}
                  <div className="relative group shrink-0">
                    <div className="w-full md:w-48 h-48 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {materiel?.image
                        ? <img src={materiel.image} alt={materiel.nom} className="w-full h-full object-cover" />
                        : <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">settings_input_component</span>
                      }
                    </div>
                    <div className={`absolute top-2 right-2 px-3 py-1 ${statusColor()} text-white text-xs font-bold rounded-full`}>
                      {statusLabel()}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{materiel?.nom}</h1>
                      <p className="text-slate-500 text-lg mt-1">ID: {materiel?.identifiant_unique || `EQ-${id}`}</p>
                      {materiel?.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{materiel.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <InfoBlock label="Category" value={materiel?.categorie_nom} />
                      <InfoBlock label="Owner" value={materiel?.eglise_nom} />
                      <InfoBlock label="Quantity" value={materiel?.quantite} />
                      <InfoBlock label="Movements" value={materiel?.mouvements_count} />
                      <InfoBlock label="Defect Reports" value={materiel?.defauts_count} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex gap-8">
                  {[
                    { key: 'movements',   label: 'Historique des Mouvements' },
                    { key: 'maintenance', label: 'Journal de Maintenance' },
                    { key: 'defects',     label: 'Signalements de Pannes' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`pb-4 font-bold text-sm border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content: Movements */}
              {activeTab === 'movements' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Historique des Mouvements</h3>
                    <Link to="/movements" className="text-primary text-sm font-semibold hover:underline">Voir Tout</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">De / Vers</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Géré par</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {movements.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Aucun mouvement enregistré.</td></tr>
                        ) : movements.map(mv => (
                          <tr key={mv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(mv.date_mouvement).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4"><MovementTypeBadge type={mv.type_mouvement} /></td>
                            <td className="px-6 py-4">
                              {mv.eglise_origine_nom || '?'} → {mv.eglise_destination_nom || mv.evenement_titre || 'Central'}
                            </td>
                            <td className="px-6 py-4 font-medium">{mv.responsable_nom || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Carte Dernière Maintenance (toujours visible sous les mouvements) ── */}
              {activeTab === 'movements' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Dernière Maintenance</h3>
                  {defects.filter(d => d.repare).length > 0 ? (
                    defects.filter(d => d.repare).slice(0, 1).map(d => (
                      <div key={d.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="size-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined">build</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{d.description?.substring(0, 80) || 'Maintenance réalisée'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Terminé le {new Date(d.date_signalement).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{d.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="size-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">build</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Révision Annuelle & Nettoyage</p>
                        <p className="text-xs text-slate-500 mt-1">Aucun historique de maintenance enregistré dans le système.</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          Vérifiez auprès du responsable logistique pour l'historique complet.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Maintenance */}
              {activeTab === 'maintenance' && (
                <div className="space-y-4">
                  {defects.filter(d => d.repare).length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                      <span className="material-symbols-outlined text-4xl block mb-2 text-primary">build_circle</span>
                      <p className="font-medium text-slate-600 dark:text-slate-300">Aucune maintenance enregistrée.</p>
                    </div>
                  ) : defects.filter(d => d.repare).map(d => (
                    <div key={d.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                      <div className="size-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">build</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{d.description?.substring(0, 80)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Réparé le {new Date(d.date_signalement).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{d.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content: Signalements (Defects) */}
              {activeTab === 'defects' && (
                <div className="space-y-4">
                  {defects.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl block mb-2 text-green-400">check_circle</span>
                      <p className="font-medium text-slate-600 dark:text-slate-300">Aucun signalement de panne pour cet équipement.</p>
                    </div>
                  ) : defects.map(d => (
                    <div key={d.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                      <div className="size-10 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 shrink-0">
                        <span className="material-symbols-outlined">report_problem</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm">{d.description?.substring(0, 60) || 'Signalement'}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.niveau_gravite === 'Critical' ? 'bg-red-100 text-red-700' :
                            d.niveau_gravite === 'Medium'   ? 'bg-orange-100 text-orange-700' :
                                                              'bg-green-100 text-green-700'
                          }`}>{d.niveau_gravite || 'Medium'}</span>
                          {d.repare && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Réparé</span>}
                        </div>
                        <p className="text-xs text-slate-500">Signalé le {new Date(d.date_signalement).toLocaleDateString('fr-FR')}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{d.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-6">

              {/* QR Code card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                <h3 className="font-bold mb-5 w-full text-center">Equipment QR Label</h3>
                <div className="size-48 bg-white dark:bg-slate-800 p-3 border-2 border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-center relative group cursor-pointer">
                  {materiel?.qr_code
                    ? <img src={materiel.qr_code} alt="QR Code" className="w-full h-full object-contain" />
                    : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300">qr_code_2</span>
                        <p className="text-xs text-slate-400">QR generated on save</p>
                      </div>
                    )
                  }
                  <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <span className="material-symbols-outlined text-primary text-4xl">print</span>
                  </div>
                </div>
                <p className="mt-4 text-xs font-mono text-slate-500">{materiel?.identifiant_unique || `EQ-${id}-SGL-CI`}</p>
                <a
                  href={materiel?.qr_code}
                  download
                  className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export Label
                </a>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/movements"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined">swap_horiz</span>
                    Initiate Transfer
                  </Link>
                  <Link
                    to={`/report/${id}`}
                    className="w-full h-12 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined">report_problem</span>
                    Report Defect
                  </Link>
                </div>
              </div>

              {/* Location Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold mb-4">Last Known Location</h3>
                <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #dde9f8 0%, #c3d9f5 100%)' }} />
                  {/* Decorative map grid */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg,#1745cf 0,#1745cf 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#1745cf 0,#1745cf 1px,transparent 0,transparent 50%)',
                    backgroundSize: '30px 30px'
                  }} />
                  <div className="relative z-10 bg-primary p-2 rounded-full text-white shadow-lg animate-pulse">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400">home_pin</span>
                  <p className="text-sm font-medium">{materiel?.eglise_nom || 'Abidjan Central'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EquipmentDetail;
