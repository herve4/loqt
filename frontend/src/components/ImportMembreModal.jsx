import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { logisticsService } from '../services/api';

const ImportMembreModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: Upload & Options, 2: Preview & Validation, 3: Processing, 4: Report
  const [matchMethod, setMatchMethod] = useState('email_phone'); // 'email_phone' or 'id'
  const [notFoundMethod, setNotFoundMethod] = useState('create'); // 'create' or 'skip'
  const [file, setFile] = useState(null);
  const [validatedRows, setValidatedRows] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, error: 0 });
  const [importLogs, setImportLogs] = useState([]);
  const fileInputRef = useRef(null);

  // Load dependency data
  const { data: churchesData } = useQuery({
    queryKey: ['churches-import-m'],
    queryFn: () => logisticsService.getEglises({ page_size: 10000 }).then(res => res.data),
    enabled: isOpen
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles-import-m'],
    queryFn: () => logisticsService.getPoles().then(res => res.data),
    enabled: isOpen
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-import-m'],
    queryFn: () => logisticsService.getMembersList({ page_size: 10000 }).then(res => res.data),
    enabled: isOpen
  });

  const churches = Array.isArray(churchesData) ? churchesData : (churchesData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);
  const members = Array.isArray(membersData) ? membersData : (membersData?.results || []);

  if (!isOpen) return null;

  // Helper for key normalization
  const normalizeRow = (row) => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      const normKey = key.toUpperCase().trim()
        .replace(/[ÉÈÊË]/g, 'E')
        .replace(/[ÀÂÄ]/g, 'A')
        .replace(/[ÔÖ]/g, 'O')
        .replace(/[ÙÛÜ]/g, 'U')
        .replace(/[Ç]/g, 'C')
        .replace(/[\s_-]+/g, '');
      normalized[normKey] = row[key];
    });
    return normalized;
  };

  // Helper for field mapping
  const mapRowFields = (normalizedRow) => {
    const getVal = (keys) => {
      for (let key of keys) {
        if (normalizedRow[key] !== undefined && normalizedRow[key] !== null) {
          return String(normalizedRow[key]).trim();
        }
      }
      return '';
    };

    return {
      identifiant_unique: getVal(['IDENTIFIANTUNIQUE', 'IDENTIFIANT', 'ID', 'UNIQUEID', 'REF']),
      prenom: getVal(['PRENOM', 'FIRSTNAME', 'PRENOMS']),
      nom: getVal(['NOM', 'LASTNAME']),
      email: getVal(['EMAIL', 'MAIL', 'COURRIEL']),
      telephone: getVal(['TELEPHONE', 'TEL', 'PHONE']),
      role: getVal(['ROLE', 'FONCTION']),
      eglise_locale: getVal(['EGLISELOCALE', 'EGLISE', 'CHURCH']),
      departement: getVal(['DEPARTEMENT', 'POLE', 'DEPARTMENT']),
      section: getVal(['SECTION']),
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndLoadFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) validateAndLoadFile(selectedFile);
  };

  const validateAndLoadFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Format de fichier invalide. Veuillez utiliser .xlsx, .xls ou .csv.');
      return;
    }
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (targetFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawRows.length === 0) {
          toast.error('Le fichier est vide.');
          return;
        }

        processRows(rawRows);
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de la lecture du fichier. Assurez-vous qu'il n'est pas corrompu.");
      }
    };
    reader.readAsBinaryString(targetFile);
  };

  const processRows = (rawRows) => {
    const normalized = rawRows.map((row, index) => {
      const norm = normalizeRow(row);
      const fields = mapRowFields(norm);
      const errors = [];
      const warnings = [];

      // Validate Names
      if (!fields.nom) {
        errors.push("Le nom de famille est requis.");
      }
      if (!fields.prenom) {
        errors.push("Le prénom est requis.");
      }

      // Check if Email or Phone exists
      if (!fields.email && !fields.telephone) {
        errors.push("Au moins un e-mail ou un numéro de téléphone est requis.");
      }

      // Resolve Church
      let egliseId = null;
      let egliseName = '';
      if (fields.eglise_locale) {
        const match = churches.find(
          c => c.nom.toLowerCase().trim() === fields.eglise_locale.toLowerCase().trim()
        );
        if (match) {
          egliseId = match.id;
          egliseName = match.nom;
        } else {
          warnings.push(`Église locale "${fields.eglise_locale}" inconnue. Laissé vide.`);
        }
      }

      // Resolve Pole (Department)
      let poleId = null;
      let poleName = '';
      if (fields.departement) {
        const match = poles.find(
          p => p.nom.toLowerCase().trim() === fields.departement.toLowerCase().trim()
        );
        if (match) {
          poleId = match.id;
          poleName = match.nom;
        } else {
          warnings.push(`Département "${fields.departement}" inconnu. Laissé vide.`);
        }
      }

      // Map roles
      let role = 'membre';
      const rawRole = fields.role.toLowerCase().trim();
      const validRoles = [
        'super_admin', 'pasteur_national', 'rln', 'pasteur_local', 'rll',
        'technicien', 'pasteur', 'resp_dept', 'adj_dept', 'resp_sec',
        'adj_sec', 'membre_dept', 'membre_sec', 'membre', 'responsable'
      ];
      if (rawRole) {
        const found = validRoles.find(r => r === rawRole || r.replace('_', ' ') === rawRole || r.replace('_', '') === rawRole);
        if (found) {
          role = found;
        } else {
          warnings.push(`Rôle "${fields.role}" inconnu. Rôle par défaut "membre" assigné.`);
        }
      }

      return {
        index: index + 1,
        identifiant_unique: fields.identifiant_unique,
        first_name: fields.nom,
        last_name: fields.prenom,
        email: fields.email,
        phone: fields.telephone,
        role,
        eglise_id: egliseId,
        eglise_nom: egliseName || fields.eglise_locale,
        pole_id: poleId,
        pole_nom: poleName || fields.departement,
        section: fields.section,
        errors,
        warnings,
        isValid: errors.length === 0,
      };
    });

    setValidatedRows(normalized);
    setStep(2);
  };

  const handleStartImport = async () => {
    const validRows = validatedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('Aucune ligne valide à importer.');
      return;
    }

    setStep(3);
    setImportProgress({ current: 0, total: validRows.length, success: 0, error: 0 });
    const logs = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        let matchedUser = null;
        let dbId = null;

        // Step 1: Match User
        if (matchMethod === 'id' && row.identifiant_unique) {
          const matchIdStr = row.identifiant_unique.replace('SGL-MB-', '').trim();
          const parsedId = parseInt(matchIdStr, 10);
          if (!isNaN(parsedId)) {
            matchedUser = members.find(m => m.id === parsedId);
          }
        }

        // Fallback or main matching (email / phone)
        if (!matchedUser) {
          matchedUser = members.find(m => {
            const matchesEmail = row.email && m.email && m.email.toLowerCase().trim() === row.email.toLowerCase().trim();
            const matchesPhone = row.phone && m.phone && m.phone.trim() === row.phone.trim();
            return matchesEmail || matchesPhone;
          });
        }

        if (matchedUser) {
          dbId = matchedUser.id;
        }

        // Step 2: Build FormData payload
        const payload = new FormData();
        payload.append('first_name', row.first_name);
        payload.append('last_name', row.last_name);
        if (row.email) payload.append('email', row.email);
        if (row.phone) payload.append('phone', row.phone);
        payload.append('role', row.role);
        payload.append('is_active', 'true');
        if (row.eglise_id) payload.append('eglise', row.eglise_id);
        if (row.pole_id) payload.append('pole', row.pole_id);
        if (row.section) payload.append('section', row.section);

        if (matchedUser && dbId) {
          // Update
          await logisticsService.updateMember(dbId, payload);
          logs.push({
            type: 'success',
            msg: `Ligne ${row.index} : Membre "${row.first_name} ${row.last_name}" (SGL-MB-${String(dbId).padStart(3, '0')}) mis à jour.`
          });
          successCount++;
        } else {
          // Create
          if (notFoundMethod === 'create') {
            // Generate a secure temp password
            const tempPassword = `EBNG-${Math.random().toString(36).substring(2, 10)}`;
            payload.append('password', tempPassword);

            const createRes = await logisticsService.createMember(payload);
            const created = createRes.data;
            logs.push({
              type: 'success',
              msg: `Ligne ${row.index} : Membre "${row.first_name} ${row.last_name}" créé (SGL-MB-${String(created.id).padStart(3, '0')}). Mot de passe : ${tempPassword}`
            });
            successCount++;
          } else {
            logs.push({
              type: 'warning',
              msg: `Ligne ${row.index} : Membre "${row.first_name} ${row.last_name}" ignoré.`
            });
          }
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        logs.push({
          type: 'error',
          msg: `Ligne ${row.index} : Erreur d'import de "${row.first_name} ${row.last_name}" : ${errMsg}`
        });
        errorCount++;
      }

      setImportProgress(prev => ({
        ...prev,
        success: successCount,
        error: errorCount
      }));
    }

    setImportLogs(logs);
    setStep(4);
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['members-directory'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl p-6 relative flex flex-col rounded-none border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Importation des Membres (XLSX / CSV)
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">LOGISTIQUE CONSOLE — IMPORT MEMBRES</p>
          </div>
          {step !== 3 && (
            <button onClick={onClose} className="text-slate-500 hover:text-slate-950 dark:hover:text-white cursor-pointer transition-transform">
              <span className="material-symbols-outlined text-lg font-black">close</span>
            </button>
          )}
        </div>

        {/* STEP 1: Upload and options */}
        {step === 1 && (
          <div className="space-y-6 overflow-y-auto">
            {/* Drag Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/5 text-blue-500'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-500'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <span className="material-symbols-outlined text-4xl mb-3 text-slate-400">cloud_upload</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
                Glissez-déposez un fichier ici ou cliquez pour parcourir
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase mt-2">
                Formats acceptés : .xlsx, .xls, .csv
              </span>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 mb-2 uppercase">
                  Méthode de correspondance
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="matchMethod"
                      value="email_phone"
                      checked={matchMethod === 'email_phone'}
                      onChange={() => setMatchMethod('email_phone')}
                      className="accent-blue-600"
                    />
                    <span>Par Email ou Téléphone (Recommandé)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="matchMethod"
                      value="id"
                      checked={matchMethod === 'id'}
                      onChange={() => setMatchMethod('id')}
                      className="accent-blue-600"
                    />
                    <span>Par Identifiant Unique (ex: SGL-MB-003)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 mb-2 uppercase">
                  Si le compte n'existe pas en base
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="notFoundMethod"
                      value="create"
                      checked={notFoundMethod === 'create'}
                      onChange={() => setNotFoundMethod('create')}
                      className="accent-blue-600"
                    />
                    <span>Créer un nouveau compte membre</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="notFoundMethod"
                      value="skip"
                      checked={notFoundMethod === 'skip'}
                      onChange={() => setNotFoundMethod('skip')}
                      className="accent-blue-600"
                    />
                    <span>Ignorer la ligne d'importation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Validation */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Summary info */}
            <div className="flex justify-between items-center text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-950/40 p-3 border border-slate-200 dark:border-slate-800">
              <div>
                FICHIER : <span className="font-bold text-slate-850 dark:text-slate-300">{file?.name}</span>
              </div>
              <div className="flex gap-4">
                <span>TOTAL : <b>{validatedRows.length}</b></span>
                <span className="text-emerald-500 font-bold">VALIDE : {validatedRows.filter(r => r.isValid).length}</span>
                {validatedRows.some(r => !r.isValid) && (
                  <span className="text-rose-500 font-bold">ERREURS : {validatedRows.filter(r => !r.isValid).length}</span>
                )}
              </div>
            </div>

            {/* Table wrapper */}
            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-850 sticky top-0 font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5 w-12 text-center">#</th>
                    <th className="p-2.5">NOM & PRÉNOM</th>
                    <th className="p-2.5">EMAIL</th>
                    <th className="p-2.5">CONTACT</th>
                    <th className="p-2.5">RÔLE</th>
                    <th className="p-2.5">ÉGLISE</th>
                    <th className="p-2.5">DÉPT / PÔLE</th>
                    <th className="p-2.5 w-24">VALIDATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {validatedRows.map((row) => (
                    <tr key={row.index} className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/10' : 'bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/30'}>
                      <td className="p-2.5 text-center text-slate-400">{row.index}</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{row.first_name} {row.last_name}</td>
                      <td className="p-2.5">{row.email || '-'}</td>
                      <td className="p-2.5 font-mono">{row.phone || '-'}</td>
                      <td className="p-2.5 uppercase text-[9px] font-bold">{row.role}</td>
                      <td className="p-2.5 truncate max-w-[100px]" title={row.eglise_nom}>{row.eglise_nom || '-'}</td>
                      <td className="p-2.5 truncate max-w-[100px]" title={row.pole_nom}>{row.pole_nom || '-'}</td>
                      <td className="p-2.5">
                        {row.isValid ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check_circle</span> PRÊT
                          </span>
                        ) : (
                          <div className="text-rose-500 font-bold flex flex-col gap-0.5">
                            {row.errors.map((e, idx) => (
                              <span key={idx} className="flex items-center gap-0.5 text-[9px]">
                                ⚠️ {e}
                              </span>
                            ))}
                          </div>
                        )}
                        {row.warnings.length > 0 && (
                          <div className="text-amber-500 mt-0.5 text-[9px]">
                            {row.warnings.map((w, idx) => (
                              <span key={idx} className="block">ℹ] {w}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="h-11 px-5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] active:scale-95 transition-all cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={handleStartImport}
                disabled={validatedRows.filter(r => r.isValid).length === 0}
                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm font-black">play_arrow</span>
                Lancer l'importation ({validatedRows.filter(r => r.isValid).length} lignes)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Processing */}
        {step === 3 && (
          <div className="space-y-6 text-center py-10">
            <span className="material-symbols-outlined text-5xl text-blue-500 animate-spin">sync</span>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-350">
                Importation en cours...
              </h4>
              <p className="text-[10px] text-slate-400 uppercase">
                Traitement : {importProgress.current} sur {importProgress.total}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-none overflow-hidden max-w-md mx-auto">
              <div
                className="bg-blue-500 h-full transition-all duration-200"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-500 space-x-6">
              <span>SUCCÈS : <b className="text-emerald-500">{importProgress.success}</b></span>
              <span>ÉCHECS : <b className="text-rose-500">{importProgress.error}</b></span>
            </div>
          </div>
        )}

        {/* STEP 4: Report */}
        {step === 4 && (
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-2">
              Rapport d'importation terminé !
            </h4>

            {/* Stats block */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center mb-4">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Total validé</div>
                <div className="text-lg font-bold mt-1 text-slate-800 dark:text-slate-250">{importProgress.total}</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-500 uppercase">Succès</div>
                <div className="text-lg font-bold mt-1 text-emerald-500">{importProgress.success}</div>
              </div>
              <div>
                <div className="text-[10px] text-rose-500 uppercase">Échecs</div>
                <div className="text-lg font-bold mt-1 text-rose-500">{importProgress.error}</div>
              </div>
            </div>

            {/* Logs output */}
            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 bg-slate-955 text-slate-350 p-4 font-mono text-[10px] space-y-1.5 leading-relaxed">
              <div className="text-slate-500 border-b border-slate-800 pb-1.5 mb-2 uppercase">Journal d'exécution :</div>
              {importLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={
                    log.type === 'success'
                      ? 'text-emerald-450'
                      : log.type === 'warning' || log.type === 'info'
                      ? 'text-amber-450'
                      : 'text-rose-450'
                  }
                >
                  [{log.type === 'success' ? 'SUCCESS' : log.type === 'error' ? 'ERROR' : 'INFO'}] {log.msg}
                </div>
              ))}
            </div>

            {/* Final Action */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClose}
                className="h-11 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-wider text-[10px] active:scale-95 transition-all cursor-pointer"
              >
                Fermer la console
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportMembreModal;
