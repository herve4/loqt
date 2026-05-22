
import React, { useState, useEffect, useMemo } from 'react';
// Removed unused and non-existent LOGISTICS_SERVICES import
import { CATEGORIES } from '../constants';
import { Material, User } from '../types';
import { materialService } from '../services/materialService';
import { authService } from '../services/authService';
import { permissionService } from '../services/permissionService';

// Slider/carrousel d'images pour la modale détail matériel
type ImageSliderProps = {
  images: { image: string; description?: string }[];
};

const ImageSlider: React.FC<ImageSliderProps> = ({ images }) => {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  return (
    <div className="relative w-full h-72 flex flex-col items-center justify-center bg-slate-950">
      <img src={images[current].image} className="w-full h-72 object-contain rounded-2xl border border-slate-800 shadow-xl" alt={images[current].description || `Image ${current+1}`} />
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-lg">◀</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-lg">▶</button>
        </>
      )}
      {images[current].description && (
        <div className="mt-2 text-xs text-slate-400 text-center italic">{images[current].description}</div>
      )}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i === current ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
        ))}
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [permissionReason, setPermissionReason] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'trash'>('list');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [qtyFilter, setQtyFilter] = useState<number | ''>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser() as User;
    if (user) {
      setCurrentUser(user);
    }
    fetchMaterials();
  }, [viewMode, search, catFilter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await materialService.getMateriels({
        searchInput: search,
        categorie: catFilter,
        is_deleted: viewMode === 'trash'
      });
      setMaterials(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des matériels", err);
    } finally {
      setLoading(false);
    }
  };

  const deletedItemsCount = useMemo(() => (Array.isArray(materials) ? materials.filter(m => m.is_deleted).length : 0), [materials]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!permissionService.canAddMaterial(currentUser!)) {
      alert("Accès non autorisé. Veuillez faire une demande d'accès.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const materialData: any = {
      nom: formData.get('nom') as string,
      categorie_id: parseInt(formData.get('categorie_id') as string),
      quantite: Number(formData.get('quantite')),
      eglise_id: parseInt(formData.get('eglise_id') as string),
      description: formData.get('description') as string,
    };

    try {
      if (editingMaterial) {
        await materialService.updateMateriel(editingMaterial.id, materialData);
      } else {
        await materialService.createMateriel(materialData);
      }
      setIsModalOpen(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handlePermissionRequest = async () => {
    if (!currentUser) {
      alert('Vous devez être connecté');
      return;
    }
    setRequestingPermission(true);
    try {
      await permissionService.requestMaterialPermission(permissionReason);
      alert('Demande de permission soumise avec succès. Veuillez attendre la validation.');
      setPermissionReason('');
      // Sync permissions from backend
      const syncedUser = await authService.syncUserPermissions();
      if (syncedUser) {
        setCurrentUser(syncedUser as User);
      }
    } catch (err) {
      alert('Erreur lors de la soumission de la demande: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleSoftDelete = async (id: number) => {
    if (confirm("Mettre ce matériel dans la corbeille ?")) {
      await materialService.softDelete(id);
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, deletedAt: new Date().toLocaleString() } : m));
      // Refresh logic would ideally happen here
    }
  };

  const handleRestore = async (id: number) => {
    await materialService.restore(id);
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, is_deleted: false, deletedAt: undefined } : m));
  };

  const handleExport = () => {
    const dataToExport = materials.map(m => [
      m.nom, m.categorie.nom, m.quantite.toString(), m.eglise.nom
    ]);
    materialService.exportExcel(dataToExport);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 relative pb-24">

      {/* Permission Request Alert */}
      {currentUser && !permissionService.canAddMaterial(currentUser) && (
        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-400">Gestion Restreinte (Permission Requise)</p>
              <p className="text-xs text-slate-400">
                {currentUser.material_permission_status === 'en_attente' && "Demande envoyée. En attente de validation administrateur..."}
                {!currentUser.material_permission_status && "Demandez la permission pour ajouter/modifier du matériel"}
                {currentUser.material_permission_status === 'refusee' && "Votre demande a été refusée. Contactez l'administrateur."}
              </p>
            </div>
          </div>
          {!currentUser.material_permission_status && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Raison de la demande (optionnel)..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={permissionReason}
                onChange={(e) => setPermissionReason(e.target.value)}
              />
              <button 
                onClick={handlePermissionRequest}
                disabled={requestingPermission}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {requestingPermission ? '...' : '👉 Demander'}
              </button>
            </div>
          )}
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
            {viewMode === 'list' ? 'Inventaire' : 'Corbeille'} <span className="text-blue-500 not-italic">LOGISTIQUE</span>
          </h1>
          <p className="text-slate-500">{materials.length} matériels trouvés via l'API.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700"
          >
            📥 Exporter Excel
          </button>
          {viewMode === 'trash' ? (
            <button
              onClick={() => setViewMode('list')}
              className="px-6 py-3 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl font-bold hover:text-white transition-all flex items-center gap-2"
            >
              🔙 Retour Liste
            </button>
          ) : (
            <button
              onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }}
              disabled={!currentUser || !permissionService.canAddMaterial(currentUser)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Ajouter matériel
            </button>
          )}
        </div>
      </header>

      {/* Filters Area */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom (API searchInput)..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="All">Toutes les catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            placeholder="Quantité exacte..."
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
            value={qtyFilter}
            onChange={(e) => setQtyFilter(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="p-5">Images & Nom</th>
                <th className="p-5">Responsable</th>
                <th className="p-5">Catégorie</th>
                <th className="p-5 text-center">Quantité</th>
                <th className="p-5">{viewMode === 'trash' ? 'Supprimé le' : 'Église'}</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {materials.map(item => (
                <tr key={item.id} className="group hover:bg-slate-800/50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3 cursor-pointer" onClick={() => { setSelectedMaterial(item); setIsDetailOpen(true); }}>
                        {item.images_materiel.slice(0, 3).map((img, i) => (
                          <img key={i} src={img.image} className="w-10 h-10 rounded-lg object-cover border-2 border-slate-900 shadow-xl group-hover:rotate-3 transition-transform" />
                        ))}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{item.nom}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: {item.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-bold text-slate-300">{item.logistique?.responsable || 'Inconnu'}</span>
                  </td>
                  <td className="p-5">
                    <span className="px-2 py-1 bg-slate-950 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-800">{item.categorie.nom}</span>
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-xl font-black text-white">{item.quantite}</span>
                  </td>
                  <td className="p-5">
                    {viewMode === 'trash' ? (
                      <span className="text-xs font-bold text-rose-400 italic">{item.deletedAt || 'Date inconnue'}</span>
                    ) : (
                      <span className="text-sm text-slate-500">{item.eglise.nom}</span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex gap-2 justify-end">
                      {viewMode === 'list' ? (
                        <>
                          <button onClick={() => { setSelectedMaterial(item); setIsDetailOpen(true); }} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:text-white transition-colors">👁️</button>
                          <button onClick={() => { setEditingMaterial(item); setIsModalOpen(true); }} disabled={permission !== 'approved'} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:text-blue-400 transition-colors disabled:opacity-20">✏️</button>
                          <button onClick={() => handleSoftDelete(item.id)} disabled={permission !== 'approved'} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:text-rose-400 transition-colors disabled:opacity-20">🗑️</button>
                        </>
                      ) : (
                        <button onClick={() => handleRestore(item.id)} className="px-3 py-1.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">♻️ Restaurer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Trash Bin Bin Toggle */}
      <div className="fixed bottom-28 right-8 z-[60] flex flex-col items-end gap-3 group">
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'trash' : 'list')}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl transition-all shadow-2xl relative overflow-hidden group/btn ${viewMode === 'trash'
              ? 'bg-amber-600 text-white shadow-amber-600/40 rotate-12 scale-110'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-amber-500 shadow-black/60'
            }`}
        >
          {viewMode === 'list' ? '🗑️' : '📦'}
        </button>
      </div>

      {/* Detail View Modal */}
      {isDetailOpen && selectedMaterial && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">
            <div className="w-full md:w-1/2 bg-slate-950 flex flex-col">
              {/* Slider d'images */}
              <ImageSlider images={selectedMaterial.images_materiel} />
            </div>
            <div className="flex-1 p-10 overflow-y-auto space-y-8 bg-slate-900">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Localisation</p>
                  <p className="text-lg font-bold text-slate-200">{selectedMaterial.eglise.nom} ({selectedMaterial.eglise.ville})</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-700 transition-colors">✕</button>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{selectedMaterial.description}</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Quantité</p>
                  <p className="text-3xl font-black text-white italic">{selectedMaterial.quantite}</p>
                </div>
                <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">QR Code</p>
                  <div className="w-16 h-16 bg-white mx-auto rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800">
              <h2 className="text-xl font-black text-white uppercase italic">Nouveau Matériel (API Form)</h2>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <input name="nom" placeholder="Nom du matériel" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <select name="categorie_id" className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none">
                  {/* In a real app, these would be fetched from the API */}
                  <option value="1">Sonorisation</option>
                  <option value="2">Éclairage</option>
                  <option value="3">Vidéo</option>
                  <option value="4">Mobilier</option>
                </select>
                <input name="quantite" type="number" placeholder="Quantité" className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none" required />
              </div>
              <input name="eglise_id" placeholder="ID de l'Église (ex: 1)" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none" required />
              <textarea name="description" placeholder="Description technique" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 h-24 outline-none"></textarea>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-xs">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
