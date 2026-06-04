import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ImportMembreModal from '../components/ImportMembreModal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';


const MembersList = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isManager = (role) => {
    return [
      'super_admin', 'pasteur_national', 'rln', 'pasteur_local', 'rll',
      'resp_dept', 'adj_dept', 'resp_sec', 'adj_sec'
    ].includes(role);
  };

  const showValidationTab = currentUser && isManager(currentUser.role);

  // Mutation for validating a user
  const validateMutation = useMutation({
    mutationFn: ({ id, status }) => logisticsService.updateMember(id, { validation_status: status }),
    onSuccess: (data, variables) => {
      toast.success(variables.status === 'approved' ? 'Inscription approuvée avec succès !' : 'Inscription rejetée.');
      queryClient.invalidateQueries({ queryKey: ['members-directory'] });
    },
    onError: () => {
      toast.error("Erreur lors de la modification du statut d'inscription.");
    }
  });

  // Charger la liste globale des membres
  const { data: membersData, isLoading, isError } = useQuery({
    queryKey: ['members-directory'],
    queryFn: () => logisticsService.getMembersList({ page_size: 10000 }).then(res => res.data)
  });

  // Charger les pôles (départements)
  const { data: polesData } = useQuery({
    queryKey: ['poles-selector'],
    queryFn: () => logisticsService.getPoles().then(res => res.data)
  });

  // Charger les églises
  const { data: churchesData } = useQuery({
    queryKey: ['churches-selector'],
    queryFn: () => logisticsService.getEglises({ page_size: 10000 }).then(res => res.data)
  });

  const members = Array.isArray(membersData) ? membersData : (membersData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);
  const churches = Array.isArray(churchesData) ? churchesData : (churchesData?.results || []);

  const getPoleName = (poleId) => {
    if (!poleId) return 'Aucun';
    const p = poles.find(item => item.id === poleId);
    return p ? p.nom : `Pôle #${poleId}`;
  };

  const getChurchName = (churchId) => {
    if (!churchId) return 'Non spécifiée';
    const c = churches.find(item => item.id === churchId);
    return c ? c.nom : `Église #${churchId}`;
  };

  const rolesMap = {
    super_admin: { label: 'SUPER-ADMIN', style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
    pasteur_national: { label: 'PASTEUR NAT.', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    rln: { label: 'RLN (NATIONAL)', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
    pasteur_local: { label: 'PASTEUR LOC.', style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
    rll: { label: 'RLL (LOCAL)', style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    technicien: { label: 'TECHNICIEN', style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
    
    // Rôles hérités / legacy possibles
    responsable: { label: 'RESPONSABLE', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
    membre: { label: 'MEMBRE', style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },

    // Nouveaux rôles
    pasteur: { label: 'PASTEUR', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    resp_dept: { label: 'RESP. DEPT.', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
    adj_dept: { label: 'ADJ. DEPT.', style: 'bg-indigo-50/50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/15 dark:text-indigo-300 dark:border-indigo-900' },
    resp_sec: { label: 'RESP. SEC.', style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
    adj_sec: { label: 'ADJ. SEC.', style: 'bg-sky-50/50 text-sky-600 border-sky-100 dark:bg-sky-950/15 dark:text-sky-300 dark:border-sky-900' },
    membre_dept: { label: 'MEMBRE DEPT.', style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
    membre_sec: { label: 'MEMBRE SEC.', style: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-800' },
  };

  const getScopedMembers = (allMembers) => {
    if (!currentUser) return [];
    
    // Global access roles
    if (['super_admin', 'pasteur_national', 'rln'].includes(currentUser.role)) {
      return allMembers;
    }

    const matchRegionConstraint = (managerEgliseId, memberEgliseId) => {
      if (!managerEgliseId || !memberEgliseId) return true;
      const managerChurch = churches.find(c => c.id === managerEgliseId);
      const memberChurch = churches.find(c => c.id === memberEgliseId);
      if (managerChurch && managerChurch.region && memberChurch && memberChurch.region) {
        return managerChurch.region === memberChurch.region;
      }
      return true;
    };
    
    return allMembers.filter(m => {
      // Show own info anyway
      if (m.id === currentUser.id) return true;
      
      // Pasteur local / RLL scope: same church
      if (['pasteur_local', 'rll'].includes(currentUser.role)) {
        return currentUser.eglise && m.eglise === currentUser.eglise;
      }
      
      // Resp Dept / Adj Dept scope: same department/pole and matching region
      if (['resp_dept', 'adj_dept'].includes(currentUser.role)) {
        const samePole = currentUser.pole && m.pole === currentUser.pole;
        return samePole && matchRegionConstraint(currentUser.eglise, m.eglise);
      }
      
      // Resp Sec / Adj Sec scope: same section name and matching region (covers all departments in that section)
      if (['resp_sec', 'adj_sec'].includes(currentUser.role)) {
        const sameSec = currentUser.section && m.section && m.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase();
        return sameSec && matchRegionConstraint(currentUser.eglise, m.eglise);
      }
      
      // Default role (e.g. member, technicien): only see themselves
      return false;
    });
  };

  const approvedMembers = members.filter(m => m.validation_status !== 'pending' && m.validation_status !== 'rejected');
  const pendingMembers = members.filter(m => m.validation_status === 'pending');

  const currentList = activeTab === 'pending' ? pendingMembers : approvedMembers;

  const scopedMembers = getScopedMembers(currentList);

  const filteredMembers = scopedMembers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          email.includes(searchTerm.toLowerCase()) || 
                          phone.includes(searchTerm.toLowerCase());

    const matchesDept = !deptFilter || String(user.pole) === String(deptFilter);
    
    const matchesSection = !sectionSearch || 
                           (user.section || '').toLowerCase().includes(sectionSearch.toLowerCase());

    return matchesSearch && matchesDept && matchesSection;
  });

  const handleDownloadQR = (qrUrl, userName) => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_accreditation_${userName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchAllFilteredMembers = async () => {
    try {
      const res = await logisticsService.getMembersList({
        page_size: 10000
      });
      const all = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      
      const approvedOnly = all.filter(m => m.validation_status !== 'pending' && m.validation_status !== 'rejected');
      const pendingOnly = all.filter(m => m.validation_status === 'pending');
      const targetList = activeTab === 'pending' ? pendingOnly : approvedOnly;

      const scoped = getScopedMembers(targetList);

      const filtered = scoped.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                              email.includes(searchTerm.toLowerCase()) || 
                              phone.includes(searchTerm.toLowerCase());
        const matchesDept = !deptFilter || String(user.pole) === String(deptFilter);
        const matchesSection = !sectionSearch || 
                               (user.section || '').toLowerCase().includes(sectionSearch.toLowerCase());
        return matchesSearch && matchesDept && matchesSection;
      });

      return filtered;
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération des membres.");
      return [];
    }
  };

  const handleExportXLSX = async () => {
    const loadToastId = toast.loading("Préparation de l'export Excel...");
    const items = await fetchAllFilteredMembers();
    if (items.length === 0) {
      toast.error("Aucune donnée à exporter.", { id: loadToastId });
      return;
    }

    const exportData = items.map(item => ({
      "IDENTIFIANT_UNIQUE": `SGL-MB-${String(item.id).padStart(3, '0')}`,
      "PRENOM": item.last_name || '',
      "NOM": item.first_name || '',
      "EMAIL": item.email || '',
      "TELEPHONE": item.phone || '',
      "ROLE": item.role || '',
      "EGLISE_LOCALE": getChurchName(item.eglise),
      "DEPARTEMENT": getPoleName(item.pole),
      "SECTION": item.section || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");
    XLSX.writeFile(workbook, "SGL-CI_Membres.xlsx");
    toast.success("Export Excel terminé !", { id: loadToastId });
  };

  const handleExportCSV = async () => {
    const loadToastId = toast.loading("Préparation de l'export CSV...");
    const items = await fetchAllFilteredMembers();
    if (items.length === 0) {
      toast.error("Aucune donnée à exporter.", { id: loadToastId });
      return;
    }

    const exportData = items.map(item => ({
      "IDENTIFIANT_UNIQUE": `SGL-MB-${String(item.id).padStart(3, '0')}`,
      "PRENOM": item.last_name || '',
      "NOM": item.first_name || '',
      "EMAIL": item.email || '',
      "TELEPHONE": item.phone || '',
      "ROLE": item.role || '',
      "EGLISE_LOCALE": getChurchName(item.eglise),
      "DEPARTEMENT": getPoleName(item.pole),
      "SECTION": item.section || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SGL-CI_Membres.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV terminé !", { id: loadToastId });
  };

  const handleExportPDF = async () => {
    const loadToastId = toast.loading("Génération du fichier PDF...");
    const items = await fetchAllFilteredMembers();
    if (items.length === 0) {
      toast.error("Aucune donnée à exporter.", { id: loadToastId });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Title & Header SGL-CI
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("SYSTEME DE GESTION LOGISTIQUE COTE D'IVOIRE", 14, 18);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("ANNUAIRE OFFICIEL DES ACCREDITES ET MEMBRES", 14, 23);

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(14, 26, 283, 26);

      // Document title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(activeTab === 'pending' ? "ACCREDITATIONS ET INSCRIPTIONS EN ATTENTE" : "ANNUAIRE OFFICIEL DES MEMBRES ET ACCREDITES", 14, 34);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      const generatedAt = `Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
      doc.text(generatedAt, 14, 39);

      // Table mapping
      const tableColumn = [
        "ID / REF", 
        "PRENOM", 
        "NOM", 
        "EMAIL", 
        "TELEPHONE", 
        "ROLE",
        "EGLISE LOCALE",
        "DEPARTEMENT",
        "SECTION"
      ];
      const tableRows = items.map(item => [
        `SGL-MB-${String(item.id).padStart(3, '0')}`,
        item.last_name || '',
        item.first_name || '',
        item.email || '-',
        item.phone || '-',
        (rolesMap[item.role]?.label || item.role || '-'),
        getChurchName(item.eglise),
        getPoleName(item.pole),
        item.section || '-'
      ]);

      // Generate table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 46,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 24, fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 32 },
          3: { cellWidth: 42 },
          4: { cellWidth: 30 },
          5: { cellWidth: 26 },
          6: { cellWidth: 32 },
          7: { cellWidth: 32 },
          8: { cellWidth: 20 }
        },
        margin: { top: 46, left: 14, right: 14 },
        didDrawPage: () => {
          const str = `Page ${doc.internal.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
        }
      });

      doc.save("SGL-CI_Membres.pdf");
      toast.success("Téléchargement du PDF réussi !", { id: loadToastId });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF.", { id: loadToastId });
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "IDENTIFIANT_UNIQUE": "SGL-MB-999",
        "PRENOM": "Jean Emmanuel (Requis)",
        "NOM": "Koffi (Requis)",
        "EMAIL": "jean.koffi@example.com (Unique)",
        "TELEPHONE": "+225 0707070707 (Unique)",
        "ROLE": "technicien",
        "EGLISE_LOCALE": "Eglise Exemple",
        "DEPARTEMENT": "PÔLE LOGISTIQUE",
        "SECTION": "Accueil"
      },
      {
        "IDENTIFIANT_UNIQUE": "",
        "PRENOM": "Instructions d'importation",
        "NOM": "1. PRENOM et NOM sont requis.",
        "EMAIL": "2. Soit l'EMAIL soit le TELEPHONE doit etre fourni.",
        "TELEPHONE": "3. Les doublons seront mis a jour (PATCH).",
        "ROLE": "4. ROLES valides : super_admin, pasteur_national, rln, pasteur_local, rll, technicien, pasteur, resp_dept, adj_dept, resp_sec, adj_sec, membre_dept, membre_sec, membre, responsable.",
        "EGLISE_LOCALE": "5. EGLISE_LOCALE et DEPARTEMENT (pôle technique) doivent correspondre a des noms existants.",
        "DEPARTEMENT": "",
        "SECTION": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modele_Import_Membres");
    XLSX.writeFile(workbook, "SGL-CI_Modele_Import_Membres.xlsx");
    toast.success("Modele d'importation des Membres telecharge !");
  };

  return (
    <Layout title="Annuaire Membres">
      <div className="flex-1 bg-background-light dark:bg-background-dark p-6 font-mono text-slate-900 dark:text-slate-300">
        
        {/* Header Monospace */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight uppercase">
              [ 👥 ACCREDITATIONS & MEMBRES ]
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
              Annuaire structurel de la logistique EBNG-CI
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Actions de Données Dropdown */}
            <div className="relative group">
              <button 
                type="button"
                className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-none font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-wider cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">database</span>
                <span>Actions de Données</span>
                <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-none py-1.5 z-40 hidden group-hover:block animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={handleExportXLSX}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                >
                  <span className="material-symbols-outlined text-base">download_for_offline</span>
                  Exporter en XLSX
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                >
                  <span className="material-symbols-outlined text-base">csv</span>
                  Exporter en CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                >
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  Exporter en PDF
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  Importer XLSX / CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                >
                  <span className="material-symbols-outlined text-base">file_download</span>
                  Télécharger le Modèle
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-none animate-pulse"></span>
              <span>{filteredMembers.length} {activeTab === 'pending' ? 'DEMANDES EN ATTENTE' : 'ACCRÉDITÉS FILTRÉS'}</span>
            </div>
          </div>
        </div>

        {/* Onglets de Navigation pour Gestionnaires */}
        {showValidationTab && (
          <div className="flex gap-4 border-b border-slate-205 dark:border-slate-800 pb-4 mb-6">
            <button
              onClick={() => { setActiveTab('directory'); setSearchTerm(''); }}
              className={`py-2 px-4 font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-slate-300 dark:border-slate-800 cursor-pointer ${
                activeTab === 'directory' 
                  ? 'bg-slate-800 text-white dark:bg-slate-800 border-slate-700 shadow-md' 
                  : 'bg-slate-950 text-slate-400 hover:text-slate-205 border-slate-900 hover:bg-slate-900/50'
              }`}
            >
              👥 Annuaire des Membres
            </button>
            <button
              onClick={() => { setActiveTab('pending'); setSearchTerm(''); }}
              className={`py-2 px-4 font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-slate-300 dark:border-slate-800 cursor-pointer relative ${
                activeTab === 'pending' 
                  ? 'bg-slate-800 text-white dark:bg-slate-800 border-slate-700 shadow-md' 
                  : 'bg-slate-950 text-slate-400 hover:text-slate-205 border-slate-900 hover:bg-slate-900/50'
              }`}
            >
              ⏳ Inscriptions en Attente
              {pendingMembers.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-4 bg-amber-500 text-white font-bold text-[8px] flex items-center justify-center rounded-full animate-bounce">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Barre de Filtres Monospace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-sm rounded-none">
          
          {/* Recherche textuelle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recherche Membre</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 text-xs rounded-none outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                placeholder="Nom, Email, Téléphone..."
                type="text"
              />
            </div>
          </div>

          {/* Filtrage Département */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtrer par Département</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">handyman</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 text-xs rounded-none outline-none appearance-none cursor-pointer text-slate-900 dark:text-slate-100"
              >
                <option value="">Tous les Départements</option>
                {poles.map(p => (
                  <option key={p.id} value={p.id}>{p.nom.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recherche Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recherche Section</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">group_work</span>
              <input 
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 text-xs rounded-none outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                placeholder="Nom de section (Accueil, etc.)"
                type="text"
              />
            </div>
          </div>

        </div>

        {/* Grid de Cartes de Membres */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-primary rounded-none animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-950/20 border border-red-900 text-red-400 p-4 text-xs">
            Erreur lors du chargement de l'annuaire des membres.
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500 uppercase tracking-wider">
            Aucun membre trouvé avec ces critères.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map(user => {
              const roleConf = rolesMap[user.role] || { 
                label: user.role ? user.role.toUpperCase() : 'SANS RÔLE', 
                style: user.role 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-amber-950/20 text-amber-400 border-amber-900'
              };
              const fullName = `${user.first_name} ${user.last_name}`;

              return (
                <div 
                  key={user.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-sm relative flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                >
                  
                  {/* Badge Actif/Inactif */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-none ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      {user.is_active ? 'actif' : 'inactif'}
                    </span>
                  </div>

                  <div>
                    {/* Identité */}
                    <div className="flex gap-4 items-start mb-4">
                      {/* Avatar miniature */}
                      <div className="size-16 border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950/50 flex-shrink-0">
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={fullName} 
                            className="w-full h-full object-cover grayscale rounded-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-slate-100 text-sm font-black uppercase line-clamp-1">
                          {fullName}
                        </h3>
                        <span className={`inline-block text-[8px] font-black tracking-widest uppercase border px-2 py-0.5 mt-1.5 ${roleConf.style}`}>
                          {roleConf.label}
                        </span>
                      </div>
                    </div>

                    {/* Infos structurelles */}
                    <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-500 uppercase tracking-wider mb-4">
                      <div className="flex justify-between">
                        <span>Église</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[160px] truncate text-right">
                          {getChurchName(user.eglise)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Département</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[160px] truncate text-right">
                          {getPoleName(user.pole)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Section</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[160px] truncate text-right">
                          {user.section || 'Aucune'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-50 dark:border-slate-800/40 pt-1.5 mt-1.5">
                        <span>Contact</span>
                        <span className="text-slate-600 dark:text-slate-400 font-mono text-[9px]">
                          {user.phone || user.email || 'Aucun'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Actions pour Inscriptions en attente / Section QR Code */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-4 mt-auto">
                    {activeTab === 'pending' ? (
                      <div className="flex w-full gap-2">
                        <button
                          onClick={() => {
                            if (window.confirm(`Approuver l'inscription de ${fullName} ?`)) {
                              validateMutation.mutate({ id: user.id, status: 'approved' });
                            }
                          }}
                          disabled={validateMutation.isPending}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-widest text-center flex items-center justify-center gap-1 cursor-pointer border border-emerald-700 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Rejeter l'inscription de ${fullName} ?`)) {
                              validateMutation.mutate({ id: user.id, status: 'rejected' });
                            }
                          }}
                          disabled={validateMutation.isPending}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase tracking-widest text-center flex items-center justify-center gap-1 cursor-pointer border border-rose-700 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      user.qr_code ? (
                        <>
                          <div 
                            className="size-10 border border-slate-200 dark:border-slate-800 p-0.5 bg-white flex-shrink-0 cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setSelectedQR(user)}
                            title="Agrandir le QR Code"
                          >
                            <img 
                              src={user.qr_code} 
                              alt="QR Code" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            onClick={() => handleDownloadQR(user.qr_code, fullName)}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300 font-black py-2 text-[9px] uppercase tracking-widest text-center flex items-center justify-center gap-1.5 rounded-none border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Télécharger Badge
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center py-2 text-[8px] text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800">
                          QR Code Non Généré
                        </div>
                      )
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Modal d'agrandissement QR Code */}
        {selectedQR && (
          <div 
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedQR(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-800 p-6 max-w-[320px] w-full flex flex-col items-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedQR(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <h3 className="text-slate-100 text-xs font-black uppercase tracking-widest text-center mb-4">
                Badge QR — {selectedQR.first_name} {selectedQR.last_name}
              </h3>
              
              {/* Boîte QR haute qualité */}
              <div className="size-52 bg-white p-2 border border-slate-800 mb-6 flex items-center justify-center">
                <img 
                  src={selectedQR.qr_code} 
                  alt="QR Code Agrandi" 
                  className="w-full h-full object-contain"
                />
              </div>

              <button
                onClick={() => {
                  handleDownloadQR(selectedQR.qr_code, `${selectedQR.first_name} ${selectedQR.last_name}`);
                  setSelectedQR(null);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-2.5 text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Télécharger l'image
              </button>
            </div>
          </div>
        )}

      </div>
      <ImportMembreModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['members-directory'] });
          queryClient.invalidateQueries({ queryKey: ['members'] });
          setIsImportModalOpen(false);
        }}
      />
    </Layout>
  );
};

export default MembersList;
