import { API_ENDPOINTS } from './config.js';

// Cache pour stocker les réponses API
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Effectue une requête API avec mise en cache
 * @param {string} endpoint - L'URL de l'endpoint
 * @param {Object} options - Options de la requête fetch
 * @param {boolean} useCache - Si vrai, utilise le cache
 * @returns {Promise<any>} - Les données de la réponse
 */
export async function fetchWithCache(endpoint, options = {}, useCache = true) {
  const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
  const now = Date.now();
  
  // Vérifier le cache si activé
  if (useCache && apiCache.has(cacheKey)) {
    const { data, timestamp } = apiCache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  
  try {
    showLoading(true);
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mettre en cache la réponse
    if (useCache) {
      apiCache.set(cacheKey, {
        data,
        timestamp: now
      });
    }
    
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    showError(`Erreur lors de la récupération des données: ${error.message}`);
    throw error;
  } finally {
    showLoading(false);
  }
}

/**
 * Récupère les événements pour une plage de dates donnée
 * @param {Date} start - Date de début
 * @param {Date} end - Date de fin
 * @returns {Promise<Array>} - Liste des événements
 */
export async function fetchEvents(start, end) {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    _: Date.now() // Empêche le cache navigateur
  });
  
  const url = `${API_ENDPOINTS.EVENTS}?${params}`;
  return fetchWithCache(url);
}

/**
 * Récupère les détails d'un événement
 * @param {string} eventId - ID de l'événement
 * @returns {Promise<Object>} - Détails de l'événement
 */
export async function fetchEventDetails(eventId) {
  return fetchWithCache(API_ENDPOINTS.EVENT_DETAIL(eventId));
}

/**
 * Affiche un indicateur de chargement
 * @param {boolean} isLoading - Si vrai, affiche l'indicateur
 */
function showLoading(isLoading) {
  let loader = document.getElementById('loading-overlay');
  
  if (isLoading && !loader) {
    loader = document.createElement('div');
    loader.id = 'loading-overlay';
    loader.innerHTML = `
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    `;
    document.body.appendChild(loader);
  } else if (!isLoading && loader) {
    document.body.removeChild(loader);
  }
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur à afficher
 */
function showError(message) {
  // Implémentez l'affichage des erreurs selon votre UI
  console.error(message);
  // Exemple avec Toast ou une alerte
  alert(message);
}
