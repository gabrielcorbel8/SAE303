/**
 * visDataPreprocessor.js : script chargé de fournir toutes les fonctions de préparation des données pour les visualisations
 * et le mapping de données selon le référentiel SAE 3.01 - 3.03.
 * Composant : Data viz preprocessor
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
  window.MAINAPP.vizDataPreprocessor = {};

  /**
   * Prépare les données pour la visualisation en carte de chaleur des salaires nets moyens temps plein par discipline et par région.
   * Retourne un tableau de noms de régions (regionNoms), un tableau de noms de disciplines (disciplineNoms), et un tableau de triplets [indexDiscipline, indexRegion, salaire].
   * @param {Array} salairesAnneeRegDisc tableau de quadruplets [annee, regionId, discId, moyenne salaire]
   * @param {Object} regionsById dictionnaire de régions par région id
   * @param {Object} disicplinesById dictionnaire de disciplines par discipline id
   * @returns {Object} {regionNoms, disciplineNoms, salaires}
   */
  window.MAINAPP.vizDataPreprocessor.prepareDataForSalaireHeatmap = function(salairesAnneeRegDisc, regionsById, disicplinesById) {
    if (!salairesAnneeRegDisc || !regionsById || !disicplinesById) {
      return { regionNoms: [], disciplineNoms: [], salaires: [] };
    }

    const regionNoms = Object.values(regionsById).map(({ nom }) => nom);
    const disciplineNoms = Object.values(disicplinesById).map(({ nom }) => nom);
    const indexRegionById = Object.values(regionsById).reduce((dico, { id }, idx) => {
      dico[id] = idx;
      return dico;
    }, {});
    const indexDisciplineById = Object.values(disicplinesById).reduce((dico, { id }, idx) => {
      dico[id] = idx;
      return dico;
    }, {});

    const dicoTriplets = salairesAnneeRegDisc.reduce((dico, [annee, regionId, discId, salaireMoyen]) => {
      const key = `${regionId}-${discId}`;
      const entree = dico[key];
      if (entree) {
        if (annee > entree.annee) {
          entree.annee = annee;
          entree.salaire = salaireMoyen;
        }
      } else {
        dico[key] = {
          regionId,
          discId,
          annee,
          salaire: salaireMoyen
        };
      }
      return dico;
    }, {});

    const tripletsSalaires = Object.values(dicoTriplets)
      .filter(({ regionId, discId }) => indexRegionById[regionId] !== undefined && indexDisciplineById[discId] !== undefined)
      .map(({ regionId, discId, salaire }) => [
        indexRegionById[regionId],
        indexDisciplineById[discId],
        salaire
      ]);

    return {
      regionNoms,
      disciplineNoms,
      salaires: tripletsSalaires,
    };
  };

  /**
   * Prépare les données pour la visualisation en lignes de l'évolution dans le temps des salaires par région pour une discipline donnée,
   * ou par discipline pour une région donnée.
   * @param {Array} salairesAnneeRegDisc tableau de quadruplets [annee, regionId, discId, moyenne salaire]
   * @param {Object} regionsById dictionnaire de régions par région id
   * @param {Object} disicplinesById dictionnaire de disciplines par discipline id
   * @param {number|null} selectedDisciplineId id de la discipline sélectionnée
   * @param {number|null} selectedRegionId id de la région sélectionnée
   * @returns {Object} {legendes, annees, series, vizName}
   */
  window.MAINAPP.vizDataPreprocessor.prepareDataForSalaireLines = function(salairesAnneeRegDisc, regionsById, disicplinesById, selectedDisciplineId=null, selectedRegionId=null) {
    if (selectedDisciplineId == null && selectedRegionId == null) {
      throw new Error("Impossible de préparer les données pour la visu lines si ni une discipline ni une région n'est sélectionnée");
    }
    if (selectedDisciplineId != null && selectedRegionId != null) {
      throw new Error("Impossible de préparer les données pour la visu lines si une discipline et une région sont toutes les deux sélectionnées");
    }

    if (selectedDisciplineId !== null) {
      const salairesFiltres = salairesAnneeRegDisc.filter(([, , disciplineId]) => disciplineId === selectedDisciplineId);

      const legendes = Array.from(new Set(salairesFiltres.map(([, regionId]) => regionId)))
        .filter((regionId) => regionsById[regionId])
        .map((regionId) => regionsById[regionId].nom)
        .sort((rNom1, rNom2) => rNom1.localeCompare(rNom2));

      const anneesConcernees = Array.from(new Set(salairesFiltres.map(([annee]) => annee))).sort((a1, a2) => a1 - a2);
      const anneesIdxByAnnee = Object.fromEntries(anneesConcernees.map((annee, idx) => [annee, idx]));

      const seriesByIdRegion = salairesFiltres.reduce((dico, [annee, regionId, , salaire]) => {
        if (!regionsById[regionId]) return dico;
        let entree = dico[regionId];
        if (!entree) {
          entree = {
            nom: regionsById[regionId].nom,
            salaires: Array(anneesConcernees.length).fill(null),
          };
          dico[regionId] = entree;
        }
        const anneeIdx = anneesIdxByAnnee[annee];
        entree.salaires[anneeIdx] = salaire;
        return dico;
      }, {});

      const discName = disicplinesById[selectedDisciplineId] ? disicplinesById[selectedDisciplineId].nom : `ID ${selectedDisciplineId}`;
      return {
        legendes,
        annees: anneesConcernees,
        series: Object.values(seriesByIdRegion),
        vizName: `discipline ${discName}`,
      };
    } else {
      const salairesFiltres = salairesAnneeRegDisc.filter(([, regionId]) => regionId === selectedRegionId);

      const legendes = Array.from(new Set(salairesFiltres.map(([, , disciplineId]) => disciplineId)))
        .filter((disciplineId) => disicplinesById[disciplineId])
        .map((disciplineId) => disicplinesById[disciplineId].nom)
        .sort((rNom1, rNom2) => rNom1.localeCompare(rNom2));

      const anneesConcernees = Array.from(new Set(salairesFiltres.map(([annee]) => annee))).sort((a1, a2) => a1 - a2);
      const anneesIdxByAnnee = Object.fromEntries(anneesConcernees.map((annee, idx) => [annee, idx]));

      const seriesByIdDiscipline = salairesFiltres.reduce((dico, [annee, , disciplineId, salaire]) => {
        if (!disicplinesById[disciplineId]) return dico;
        let entree = dico[disciplineId];
        if (!entree) {
          entree = {
            nom: disicplinesById[disciplineId].nom,
            salaires: Array(anneesConcernees.length).fill(null),
          };
          dico[disciplineId] = entree;
        }
        const anneeIdx = anneesIdxByAnnee[annee];
        entree.salaires[anneeIdx] = salaire;
        return dico;
      }, {});

      const regName = regionsById[selectedRegionId] ? regionsById[selectedRegionId].nom : `ID ${selectedRegionId}`;
      return {
        legendes,
        annees: anneesConcernees,
        series: Object.values(seriesByIdDiscipline),
        vizName: `région ${regName}`,
      };
    }
  };

  /**
   * Mapping exact d'une formation selon le Référentiel de Données (Spécification SAE 3.01-3.03, page 3)
   * Transforme un objet JSON issu de GET /api/rest/formations ou GET /api/rest/formations/{ifc}
   * vers les champs normés du référentiel projet.
   * @param {Object} item - Objet formation brut retourné par l'API
   * @returns {Object} Objet normalisé selon le référentiel projet
   */
  window.MAINAPP.vizDataPreprocessor.formatFormationItem = function (item) {
    if (!item) return null;

    const isAlternance = Boolean(item.alternance);

    return {
      ifc: item.ifc || '',
      eta_uai: item.etabUai || '',
      eta_nom: item.etablissement || 'Établissement non renseigné',
      region: item.region || 'Région non renseignée',
      acad: item.academie || 'Académie non renseignée',
      ville: item.ville || 'Ville non renseignée',
      mention: item.mention || 'Intitulé de la mention',
      parcours: item.parcours || '',
      discipline: item.discipline || 'Discipline non renseignée',
      secteurDisciplinaire: item.secteur_disciplinaire || item.secteurDisciplinaire || 'Nom du secteur disciplinaire',
      sectDiscId: item.sectDiscId || null,
      alternance: isAlternance,
      alternanceLabel: isAlternance ? 'Avec alternance' : 'Sans alternance',
      code_postal: item.code_postal || '',
      dept: item.dept || '',
      lieux: item.lieux || '',
      latitude: item.latitude || null,
      longitude: item.longitude || null,
      // Données externes hors API gérées séparément (règle 4 du document)
      logo: 'assets/card-placeholder.svg',
      volume_horaire: item.volume_horaire || 'Non précisé',
      prix_annee: item.prix_annee || (isAlternance ? 'Prise en charge entreprise / OPCO' : '243 € / an (Université publique)')
    };
  };

  /**
   * Traitement et mapping des statistiques de candidatures d'un Master (Spécification section 4, page 3)
   * Calcule le taux d'admission par filière d'origine :
   * formule : (experience[filiere].accept / general.accept) * 100
   * @param {Object} candidaturesResponse - Réponse de l'API POST /api/rest/stats/search pour les candidatures
   * @returns {Array<Object>} Liste des statistiques annuelles formatées
   */
  window.MAINAPP.vizDataPreprocessor.formatCandidaturesStats = function (candidaturesResponse) {
    if (!candidaturesResponse || !Array.isArray(candidaturesResponse.candidatures)) {
      return [];
    }

    const filieres = ['lg3', 'lp3', 'master', 'autre', 'nonInscrit'];
    const filieresLibelles = {
      lg3: 'Licence générale (L3)',
      lp3: 'Licence professionnelle (LP)',
      master: 'Master',
      autre: 'Autre cursus',
      nonInscrit: 'Non inscrit l\'année précédente'
    };

    return candidaturesResponse.candidatures.map((c) => {
      const annee = c.identifiants ? c.identifiants.anneeCollecte : 'Inconnue';
      const gen = c.general || {};
      const exp = c.experience || {};

      const n_places = gen.capacite || 0;
      const n_candidats = gen.nb || 0;
      const n_proposition_admission = gen.prop || 0;
      const totalAccept = gen.accept || 0;

      // Calcul des taux d'admission par formation précédente
      const tauxParFiliere = {};
      filieres.forEach((f) => {
        if (exp[f] && typeof exp[f].accept === 'number' && totalAccept > 0) {
          tauxParFiliere[f] = Math.round((exp[f].accept / totalAccept) * 100);
        } else {
          tauxParFiliere[f] = 0;
        }
      });

      return {
        annee,
        n_places,
        n_candidats,
        n_proposition_admission,
        totalAccept,
        taux_admission_formation_precedente: tauxParFiliere,
        filieresLibelles,
        selectiviteTaux: n_candidats > 0 ? Math.round((n_places / n_candidats) * 100) : null
      };
    });
  };

  /**
   * Traitement et mapping des statistiques d'insertion professionnelle (Spécification section 3.B et 4)
   * @param {Object} insertionProResponse - Réponse de l'API POST /api/rest/stats/search pour l'insertion pro
   * @returns {Array<Object>} Liste des statistiques d'insertion pro formatées
   */
  window.MAINAPP.vizDataPreprocessor.formatInsertionProStats = function (insertionProResponse) {
    if (!insertionProResponse || !Array.isArray(insertionProResponse.insertionsPro)) {
      return [];
    }

    return insertionProResponse.insertionsPro.map((ins) => {
      const annee = ins.identifiants ? ins.identifiants.anneeCollecte : null;
      const salaireMedian = ins.salaire ? ins.salaire.netMedianTempsPlein : null;
      const tauxEmploi = ins.emplois ? ins.emplois.tauxInsertion : null;
      const partCadre = ins.emplois ? ins.emplois.partCadre : null;

      return {
        annee,
        salaireNetMedian: salaireMedian,
        tauxInsertion: tauxEmploi,
        partCadre: partCadre,
        donneesBrutes: ins
      };
    });
  };

}());
