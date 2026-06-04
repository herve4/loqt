import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { logisticsService } from '../services/api';

const ImportEgliseModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: Upload & Options, 2: Preview & Validation, 3: Processing, 4: Report
  const [matchMethod, setMatchMethod] = useState('id'); // 'id' or 'name'
  const [notFoundMethod, setNotFoundMethod] = useState('create'); // 'create' or 'skip'
  const [file, setFile] = useState(null);
  const [validatedRows, setValidatedRows] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, error: 0 });
  const [importLogs, setImportLogs] = useState([]);
  const fileInputRef = useRef(null);

  // Load dependency data for validation
  const { data: regionsData } = useQuery({
    queryKey: ['regions-import'],
    queryFn: () => logisticsService.getRegions().then(res => res.data),
    enabled: isOpen
  });

  const { data: villesData } = useQuery({
    queryKey: ['villes-import'],
    queryFn: () => logisticsService.getVilles({ page_size: 10000 }).then(res => res.data),
    enabled: isOpen
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-import'],
    queryFn: () => logisticsService.getMembersList({ page_size: 10000 }).then(res => res.data),
    enabled: isOpen
  });

  const regions = Array.isArray(regionsData) ? regionsData : (regionsData?.results || []);
  const villes = Array.isArray(villesData) ? villesData : (villesData?.results || []);
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
      nom: getVal(['NOM', 'NOMDELEGLISE', 'NAME']),
      ville: getVal(['VILLE', 'CITY']),
      region: getVal(['REGION']),
      pasteur: getVal(['PASTEUR', 'PASTEURNOM', 'PASTOR']),
      telephone: getVal(['TELEPHONE', 'TEL', 'PHONE']),
      siege_national: getVal(['SIEGENATIONAL', 'HQNATIONAL', 'SIEGE']),
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

      // Validate Nom
      if (!fields.nom) {
        errors.push("Le nom de l'église est requis.");
      }

      // Validate Ville
      if (!fields.ville) {
        errors.push("La ville est requise.");
      }

      // Check if Ville exists in DB
      let matchedVille = villes.find(
        v => v.nom.toLowerCase().trim() === fields.ville.toLowerCase().trim()
      );

      let matchedRegion = null;
      if (fields.region) {
        matchedRegion = regions.find(
          r => r.nom.toLowerCase().trim() === fields.region.toLowerCase().trim()
        );
      }

      if (!matchedVille) {
        if (fields.region && !matchedRegion) {
          warnings.push(`La ville "${fields.ville}" et la région "${fields.region}" n'existent pas. Elles seront créées.`);
        } else {
          warnings.push(`La ville "${fields.ville}" sera créée sous la région "${matchedRegion?.nom || regions[0]?.nom || 'Principale'}".`);
        }
      }

      // Resolve Pasteur by name
      let pasteurId = null;
      let pasteurName = '';
      if (fields.pasteur) {
        const queryName = fields.pasteur.toLowerCase().trim();
        const match = members.find(m => {
          const fullName = `${m.first_name} ${m.last_name}`.toLowerCase().trim();
          const reverseFullName = `${m.last_name} ${m.first_name}`.toLowerCase().trim();
          return fullName.includes(queryName) || reverseFullName.includes(queryName) || (m.email && m.email.toLowerCase().includes(queryName));
        });
        if (match) {
          pasteurId = match.id;
          pasteurName = `${match.first_name} ${match.last_name}`;
        } else {
          warnings.push(`Pasteur "${fields.pasteur}" non trouvé. L'église sera importée sans pasteur assigné.`);
        }
      }

      // Parse Siege National flag
      const isNationalHq = ['oui', 'yes', 'vrai', 'true', '1'].includes(fields.siege_national.toLowerCase().trim());

      return {
        index: index + 1,
        identifiant_unique: fields.identifiant_unique,
        nom: fields.nom,
        ville_nom: fields.ville,
        region_nom: fields.region || matchedRegion?.nom || '',
        pasteur_id: pasteurId,
        pasteur_nom: pasteurName || fields.pasteur,
        telephone: fields.telephone,
        is_national_hq: isNationalHq,
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

    // Refresh villes & regions internally before processing
    let currentVilles = [...villes];
    let currentRegions = [...regions];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // Step 1: Resolve Region / create if missing
        let regionId = null;
        if (row.region_nom) {
          let rMatch = currentRegions.find(r => r.nom.toLowerCase().trim() === row.region_nom.toLowerCase().trim());
          if (!rMatch) {
            const newR = await logisticsService.createRegion({ nom: row.region_nom });
            rMatch = newR.data;
            currentRegions.push(rMatch);
            logs.push({ type: 'info', msg: `Région "${row.region_nom}" créée.` });
          }
          regionId = rMatch.id;
        } else {
          regionId = currentRegions[0]?.id; // Default fallback
        }

        // Step 2: Resolve Ville / create if missing
        let villeId = null;
        let vMatch = currentVilles.find(v => v.nom.toLowerCase().trim() === row.ville_nom.toLowerCase().trim());
        if (!vMatch) {
          if (!regionId) {
            // Ensure at least one region exists
            if (currentRegions.length === 0) {
              const defaultR = await logisticsService.createRegion({ nom: "Région Principale" });
              currentRegions.push(defaultR.data);
              regionId = defaultR.data.id;
            } else {
              regionId = currentRegions[0].id;
            }
          }
          const newV = await logisticsService.createVille({ nom: row.ville_nom, region: regionId });
          vMatch = newV.data;
          currentVilles.push(vMatch);
          logs.push({ type: 'info', msg: `Ville "${row.ville_nom}" créée.` });
        }
        villeId = vMatch.id;

        // Step 3: Match existing Church
        let matchedChurch = null;
        let dbId = null;

        // Check if IDENTIFIANT_UNIQUE is given (e.g. SGL-EG-015)
        if (matchMethod === 'id' && row.identifiant_unique) {
          const matchIdStr = row.identifiant_unique.replace('SGL-EG-', '').trim();
          const parsedId = parseInt(matchIdStr, 10);
          if (!isNaN(parsedId)) {
            dbId = parsedId;
            try {
              const res = await logisticsService.getEglises();
              const allChurches = Array.isArray(res.data) ? res.data : (res.data.results || []);
              matchedChurch = allChurches.find(c => c.id === dbId);
            } catch (e) {
              // Ignore match error
            }
          }
        }

        // Match by Name if not matched by ID
        if (!matchedChurch && row.nom) {
          const res = await logisticsService.getEglises({ search: row.nom });
          const found = Array.isArray(res.data) ? res.data : (res.data.results || []);
          matchedChurch = found.find(c => c.nom.toLowerCase().trim() === row.nom.toLowerCase().trim());
          if (matchedChurch) {
            dbId = matchedChurch.id;
          }
        }

        // Step 4: Build Payload
        const payload = {
          nom: row.nom,
          ville: villeId,
          region: regionId,
          is_national_hq: row.is_national_hq,
        };

        if (row.telephone) payload.phone = row.telephone;
        if (row.pasteur_id) payload.pasteur = row.pasteur_id;

        if (matchedChurch && dbId) {
          // Update
          await logisticsService.updateEglise(dbId, payload);
          logs.push({
            type: 'success',
            msg: `Ligne ${row.index} : Église "${row.nom}" (SGL-EG-${String(dbId).padStart(3, '0')}) mise à jour.`
          });
          successCount++;
        } else {
          // Create
          if (notFoundMethod === 'create') {
            const createRes = await logisticsService.createEglise(payload);
            const created = createRes.data;
            logs.push({
              type: 'success',
              msg: `Ligne ${row.index} : Église "${row.nom}" créée avec succès (SGL-EG-${String(created.id).padStart(3, '0')}).`
            });
            successCount++;
          } else {
            logs.push({
              type: 'warning',
              msg: `Ligne ${row.index} : Église "${row.nom}" ignorée (Option de création désactivée).`
            });
          }
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        logs.push({
          type: 'error',
          msg: `Ligne ${row.index} : Erreur d'import de "${row.nom}" : ${errMsg}`
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
      // Invalidate queries so that the main screen refreshes
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      queryClient.invalidateQueries({ queryKey: ['villes'] });
      onSuccess();
    }
  };

  const inputStyle = {
    backgroundColor: '#020617',
    color: '#ffffff',
    borderColor: '#1e293b'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl p-6 relative flex flex-col rounded-none border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Importation des Églises (XLSX / CSV)
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">LOGISTIQUE CONSOLE — IMPORT ÉGLISES</p>
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
                      value="id"
                      checked={matchMethod === 'id'}
                      onChange={() => setMatchMethod('id')}
                      className="accent-blue-600"
                    />
                    <span>Par Identifiant (ex: SGL-EG-015)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="matchMethod"
                      value="name"
                      checked={matchMethod === 'name'}
                      onChange={() => setMatchMethod('name')}
                      className="accent-blue-600"
                    />
                    <span>Par Nom exact de l'église</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 mb-2 uppercase">
                  Si l'église n'existe pas en base
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
                    <span>Créer une nouvelle église</span>
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
                    <th className="p-2.5">ID REF</th>
                    <th className="p-2.5">NOM</th>
                    <th className="p-2.5">VILLE</th>
                    <th className="p-2.5">RÉGION</th>
                    <th className="p-2.5">PASTEUR</th>
                    <th className="p-2.5">VALIDATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {validatedRows.map((row) => (
                    <tr key={row.index} className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/10' : 'bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/30'}>
                      <td className="p-2.5 text-center text-slate-400">{row.index}</td>
                      <td className="p-2.5 text-slate-400 font-bold">{row.identifiant_unique || '-'}</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{row.nom || '-'}</td>
                      <td className="p-2.5">{row.ville_nom || <span className="text-rose-500 font-bold">MANQUANT</span>}</td>
                      <td className="p-2.5">{row.region_nom || <span className="text-slate-400 italic">Auto</span>}</td>
                      <td className="p-2.5 truncate max-w-[120px]" title={row.pasteur_nom}>{row.pasteur_nom || <span className="text-slate-400 italic">Aucun</span>}</td>
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
                              <span key={idx} className="block">ℹ️ {w}</span>
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
            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 bg-slate-955 text-slate-300 p-4 font-mono text-[10px] space-y-1.5 leading-relaxed">
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

export default ImportEgliseModal;
