/**
 * network.js : script chargé de fournir toutes les fonctions de base de récupération des données. 
 * Il n'y a donc qu'ici que nous ferons appel à l'API fetch.
 * 
 * Conforme à la spécification technique SAE 3.01 - 3.03 :
 * "Intégration de l'API REST « À la découverte du Master »"
 * URL de base : https://la-lab4ce.univ-lemans.fr/masters-stats
 */

// garantie de ne pas polluer l'espace de noms de notre environnement javascript par l'encapsulation de tout notre script dans l'exécution d'une fonction anonyme
(function () {
  /*
  Comme notre code-source est séparé en différents fichiers, nous rassemblons toutes nos fonctions ou autres données qui doivent être accessibles d'un script à l'autre
  dans une structure (un objet) global nommé MAINAPP. Dans chaque script, nous la créons si elle n'existe pas, puis nous y déclarerons nos fonctions 
  */
  if (!window.MAINAPP) {
    // Création de MAINAPP
    window.MAINAPP = {};
  }
  // Création dans MAINAPP de l'objet dédié à la gestion des données réseau
  window.MAINAPP.network = {};

  /*
  Fonctions et données "privées" : on ne les exporte pas directement dans MAINAPP, elles n'ont pas pour vocation d'être appelées depuis d'autres scripts
  */
  const BASE_API_URL = 'https://la-lab4ce.univ-lemans.fr/masters-stats/api/rest';

  /**
   * Récupère la liste des académies, construit et retourne un dictionnaire d'académies par id
   * ainsi qu'un dictionnaire de régions par id
   * Endpoint : GET /api/rest/academies
   * @returns {Promise<{academiesById: Object, regionsById: Object, academiesList: Array}>}
   */
  function loadAcademies() {
    return fetch(`${BASE_API_URL}/academies`)
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors du chargement des académies (code ${reponse.status}).`);
        }
        return reponse.json();
      })
      .then((academies) => {
        // Créer un dictionnaire (objet) d'académies par id
        const academiesById = Object.fromEntries(academies.map((academie) => [academie.id, academie]));
        // Créer un dictionnaire (objet) de région par id
        const regionsById = Object.fromEntries(academies.map((academie) => [academie.regionId, {
          id: academie.regionId,
          nom: academie.regionNom
        }]));
        // Retourne les dictionnaires et la liste brute
        return {
          academiesById,
          regionsById,
          academiesList: academies
        };
      });
  }

  /**
   * Récupère la liste des secteurs disciplinaires, construit et retourne un dictionnaire de sect. disc. par id
   * et un dictionnaire de discipline par id
   * Endpoint : GET /api/rest/secteurs-disciplinaires
   * @returns {Promise<{secteursDiscById: Object, disicplinesById: Object, secteursDiscList: Array}>}
   */
  function loadSecteurDisciplinaires() {
    return fetch(`${BASE_API_URL}/secteurs-disciplinaires`)
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors du chargement des secteurs disciplinaires (code ${reponse.status}).`);
        }
        return reponse.json();
      })
      .then((secteursDisc) => {
        // Créer un dictionnaire (objet) de secteur disciplinaire par id
        const secteursDiscById = Object.fromEntries(secteursDisc.map((secDisc) => [secDisc.id, secDisc]));
        // Créer un second dictionnaire (objet) de discipline par id
        const disicplinesById = Object.fromEntries(secteursDisc.map((secDisc) => [secDisc.disciplineId, {
          id: secDisc.disciplineId,
          nom: secDisc.disciplineNom,
        }]));
        // Retourne les dictionnaires et la liste brute
        return {
          secteursDiscById,
          disicplinesById,
          secteursDiscList: secteursDisc
        };
      });
  }

  /**
   * Récupère la liste des établissements, construit et retourne un dictionnaire d'établissements par UAI
   * Endpoint : GET /api/rest/etablissements
   * Structure retournée par l'API : [{ uai, nom, academieId }]
   * @returns {Promise<{etablissementsByUai: Object, etablissementsList: Array}>}
   */
  function loadEtablissements() {
    return fetch(`${BASE_API_URL}/etablissements`)
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors du chargement des établissements (code ${reponse.status}).`);
        }
        return reponse.json();
      })
      .then((etablissements) => {
        // Créer un dictionnaire (objet) d'établissements indexé par UAI
        const etablissementsByUai = Object.fromEntries(etablissements.map((etab) => [etab.uai, etab]));
        return {
          etablissementsByUai,
          etablissementsList: etablissements
        };
      });
  }

  /**
   * Récupère la liste des mentions de Master, construit et retourne un dictionnaire de mentions par id
   * Endpoint : GET /api/rest/mentions
   * Structure retournée par l'API : [{ id, nom, secDiscId }]
   * @returns {Promise<{mentionsById: Object, mentionsList: Array}>}
   */
  function loadMentions() {
    return fetch(`${BASE_API_URL}/mentions`)
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors du chargement des mentions (code ${reponse.status}).`);
        }
        return reponse.json();
      })
      .then((mentions) => {
        // Créer un dictionnaire (objet) de mentions indexé par id
        const mentionsById = Object.fromEntries(mentions.map((mention) => [mention.id, mention]));
        return {
          mentionsById,
          mentionsList: mentions
        };
      });
  }

  /**
   * Recherche des formations selon des critères textuels
   * Endpoint : GET /api/rest/formations?q={query}&full-details=1
   * @param {Object} criteres - Critères de recherche { q: string }
   * @returns {Promise<Array>} Liste des formations
   */
  function loadFormations(criteres) {
    const params = new URLSearchParams();
    if (criteres && criteres.q) {
      params.set('q', criteres.q);
    }
    params.set('full-details', '1');
    return fetch(`${BASE_API_URL}/formations?${params.toString()}`)
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors du chargement des formations (code ${reponse.status}).`);
        }
        return reponse.json();
      })
      .then((formations) => {
        // L'API retourne un tableau de formations
        return Array.isArray(formations) ? formations : [];
      });
  }

  /**
   * Récupère les détails d'une formation spécifique par son IFC
   * Endpoint : GET /api/rest/formations/{ifc}?full-details=1
   * @param {string} ifc - Identifiant IFC de la formation
   * @returns {Promise<Object>} Détails de la formation
   */
  function loadFormationByIfc(ifc) {
    return fetch(`${BASE_API_URL}/formations/${encodeURIComponent(ifc)}?full-details=1`)
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors du chargement de la formation ${ifc} (code ${reponse.status}).`);
        }
        return reponse.json();
      })
      .then((data) => {
        // L'API retourne parfois un objet, parfois un tableau avec un seul élément
        return Array.isArray(data) ? data[0] : data;
      });
  }

  /**
   * Recherche de statistiques de candidatures via POST /api/rest/stats/search
   * @param {Object} filters - Filtres de recherche (ex: { ifcs: [ifc] })
   * @param {Object} harvest - Données à récolter (ex: { candidatures: true })
   * @returns {Promise<Object>} Résultat des statistiques
   */
  function requestStats(filters, harvest) {
    return fetch(`${BASE_API_URL}/stats/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: filters || {}, harvest: harvest || {} })
    })
      .then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur serveur lors de la recherche de statistiques (code ${reponse.status}).`);
        }
        return reponse.json();
      });
  }


  /*
   Fonctions et données "publiques" : exportées dans MAINAPP.network
   */

  // Exportation des chargeurs individuels
  window.MAINAPP.network.loadAcademies = loadAcademies;
  window.MAINAPP.network.loadSecteurDisciplinaires = loadSecteurDisciplinaires;
  window.MAINAPP.network.loadEtablissements = loadEtablissements;
  window.MAINAPP.network.loadMentions = loadMentions;
  window.MAINAPP.network.loadFormations = loadFormations;
  window.MAINAPP.network.loadFormationByIfc = loadFormationByIfc;
  window.MAINAPP.network.requestStats = requestStats;

  /**
   * Charge l'ensemble des référentiels contextuels :
   * académies, régions, secteurs disciplinaires, disciplines, établissements et mentions.
   * @returns {Promise<{academiesById: Object, regionsById: Object, secteursDiscById: Object, disicplinesById: Object, etablissementsByUai: Object, mentionsById: Object}>}
   */
  window.MAINAPP.network.loadEntities = function () {
    return Promise.all([
      loadAcademies(),
      loadSecteurDisciplinaires(),
      loadEtablissements(),
      loadMentions()
    ]).then(([
      { academiesById, regionsById },
      { secteursDiscById, disicplinesById },
      { etablissementsByUai },
      { mentionsById }
    ]) => ({
      academiesById,
      regionsById,
      secteursDiscById,
      disicplinesById,
      etablissementsByUai,
      mentionsById
    }));
  };

}());
