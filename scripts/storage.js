/**
 * storage.js : script chargé de fournir toutes les fonctions de base de gestion des données de l'application.
 * Composant : App Storage Manager
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
  // Création dans MAINAPP de l'objet dédié à la gestion des données
  window.MAINAPP.storage = {};

  // Objet contenant l'ensemble des données gérées par système de clé-valeur
  const MEMORY_STORAGE = {};

  /**
   * Récupère une valeur associée à une clé. Par défaut, lève une exception si la clé est absente
   * @param {*} key clé
   * @param {boolean} error_if_absent lève une erreur si la clé est absente, retourne null sinon (défaut: true)
   * @param {*} defaultValue valeur par défaut si la clé est absente et error_if_absent est false
   * @returns {*} valeur associée à la clé, null (ou defaultValue) si la clé est absente et si error_if_absent est false
   */
  window.MAINAPP.storage.get = function (key, error_if_absent = true, defaultValue = null) {
    if (!key) {
      throw new Error('Clé manquante.');
    }
    if (key in MEMORY_STORAGE) {
      return MEMORY_STORAGE[key];
    }
    if (error_if_absent) {
      throw new Error(`Données absente pour la clé "${key}"`);
    }
    return defaultValue;
  };

  /**
   * Enregistre une valeur associée à une clé. Si la clé est déjà présente, écrase la valeur
   * @param {*} key clé
   * @param {*} value valeur
   */
  window.MAINAPP.storage.set = function (key, value) {
    if (!key) {
      throw new Error('Clé manquante.');
    }
    MEMORY_STORAGE[key] = value;
  };

  /**
   * Supprime une clé et sa valeur si la clé est présente. Ne fait rien sinon.
   * @param {*} key clé
   */
  window.MAINAPP.storage.delete = function (key) {
    if (!key) {
      throw new Error('Clé manquante.');
    }
    if (key in MEMORY_STORAGE) {
      delete MEMORY_STORAGE[key];
    }
  };

  /**
   * Informe si la clé est présente ou non.
   * @param {*} key clé
   * @returns {boolean} true si la clé est présente, false sinon
   */
  window.MAINAPP.storage.has = function (key) {
    if (!key) {
      throw new Error('Clé manquante.');
    }
    return key in MEMORY_STORAGE;
  };

  /**
   * Retourne la liste des clés présentes
   * @returns {Array<string>} le tableau de clés
   */
  window.MAINAPP.storage.keys = function () {
    return Object.keys(MEMORY_STORAGE);
  };

  /**
   * Réinitialise l'ensemble du stockage mémoire
   */
  window.MAINAPP.storage.clear = function () {
    Object.keys(MEMORY_STORAGE).forEach((k) => delete MEMORY_STORAGE[k]);
  };

  /**
   * Retourne une copie de l'ensemble du stockage
   * @returns {Object} copie de l'objet de stockage
   */
  window.MAINAPP.storage.getAll = function () {
    return { ...MEMORY_STORAGE };
  };
}());
