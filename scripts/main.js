/**
 * main.js : script "point d'entrée" de notre application web M2Droit (SAE 3.01 - 3.03).
 * S'appuie sur les fonctions proposées par les autres scripts (network, storage, vizDataPreprocessor, visualisations)
 * et organise l'orchestration globale de l'application.
 * Composant : Orchestrator
 */

// garantie de ne pas polluer l'espace de noms de notre environnement javascript par l'encapsulation de tout notre script dans l'exécution d'une fonction anonyme
(function () {

  /* ==========================================================================
     Section 1 : Traitement des statistiques de salaires (Démonstration ECharts)
     ========================================================================== */

  function creerMoyennesSalairesParAnneeRegionDiscipline() {
    const { storage } = window.MAINAPP;
    const stats = storage.get('stats', false);
    if (!stats || !stats.insertionsPro) return;

    const quadrupletsBruts = stats.insertionsPro
      .filter(({ salaire }) => salaire && salaire.netMedianTempsPlein)
      .map(({ identifiants, relations, salaire }) => [
        identifiants.anneeCollecte,
        relations.regionId,
        relations.discIds,
        salaire.netMedianTempsPlein
      ])
      .flatMap(([annee, regionId, discIds, salaire]) => (discIds || []).map((discId) => [annee, regionId, discId, salaire]));

    const dicoQuadruplets = quadrupletsBruts.reduce((dico, [annee, regionId, discId, salaire]) => {
      const key = `${annee}-${regionId}-${discId}`;
      const entree = dico[key];
      if (entree) {
        entree.sommeSalaires += salaire;
        entree.nbSalaires += 1;
      } else {
        dico[key] = {
          annee,
          regionId,
          discId,
          sommeSalaires: salaire,
          nbSalaires: 1
        };
      }
      return dico;
    }, {});

    const quadruplets = Object.values(dicoQuadruplets).map(({ annee, regionId, discId, sommeSalaires, nbSalaires }) => [
      annee,
      regionId,
      discId,
      Math.round(sommeSalaires / nbSalaires)
    ]);

    storage.set('salairesAnneeRegDisc', quadruplets);
  }

  function updateVisualisations({ updateSalaireHeatmap = false, updateSalaireLines = false }) {
    const { viz, storage, vizDataPreprocessor } = window.MAINAPP;
    const salaires = storage.get('salairesAnneeRegDisc', false);
    const regions = storage.get('regionsById', false);
    const disciplines = storage.get('disicplinesById', false);

    if (!salaires || !regions || !disciplines) return;

    if (updateSalaireHeatmap) {
      const { regionNoms, disciplineNoms, salaires: triplets } = vizDataPreprocessor.prepareDataForSalaireHeatmap(
        salaires,
        regions,
        disciplines
      );
      viz.updateSalaireHeatmapTitle(regionNoms.length, disciplineNoms.length);
      viz.updateSalaireHeatmapData(regionNoms, disciplineNoms, triplets);
    }
    if (updateSalaireLines) {
      const { legendes, annees, series, vizName } = vizDataPreprocessor.prepareDataForSalaireLines(
        salaires,
        regions,
        disciplines,
        storage.get('selectedDisciplineId', false),
        storage.get('selectedRegionId', false)
      );
      viz.updateSalaireLinesTitle(vizName);
      viz.updateSalaireLinesData(legendes, annees, series);
    }
  }

  function onSelectDisciplineByNom(disciplineNom) {
    const { storage } = window.MAINAPP;
    const disciplines = storage.get('disicplinesById', false);
    if (!disciplines) return;

    const discipline = Object.values(disciplines).find(({ nom }) => nom === disciplineNom);
    if (discipline) {
      storage.set('selectedRegionId', null);
      storage.set('selectedDisciplineId', discipline.id);
      updateVisualisations({ updateSalaireLines: true });
    }
  }

  function onSelectRegionByNom(regionNom) {
    const { storage } = window.MAINAPP;
    const regions = storage.get('regionsById', false);
    if (!regions) return;

    const region = Object.values(regions).find(({ nom }) => nom === regionNom);
    if (region) {
      storage.set('selectedRegionId', region.id);
      storage.set('selectedDisciplineId', null);
      updateVisualisations({ updateSalaireLines: true });
    }
  }

  /* ==========================================================================
     Section 2 : Gestion de l'Interface Catalogue M2Droit (HTML / CSS / JS)
     ========================================================================== */

  /**
   * Génère le code HTML d'une carte de Master conforme à la maquette Figma
   * @param {Object} master - Données normalisées du master
   * @returns {string} Markup HTML de l'élément article
   */
  function renderMasterCard(master) {
    return `
      <article class="master-card" data-ifc="${master.ifc}">
        <div class="card-logo-container">
          <img src="assets/card-placeholder.svg" alt="Logo de la formation" class="card-logo-img" width="334" height="138">
        </div>
        <div class="card-mention-secteur">
          <div class="card-field">
            <span class="field-label">MENTION</span>
            <span class="field-value">${master.mention || "Intitulé de la mention"}</span>
          </div>
          <div class="card-field">
            <span class="field-label">SECTEUR DISCIPLINAIRE</span>
            <span class="field-value">${master.secteurDisciplinaire || "Nom du secteur disciplinaire"}</span>
          </div>
        </div>
        <div class="card-localisation-box">
          <div class="card-localisation-row">
            <div class="card-loc-field">
              <span class="field-label">ACADÉMIE</span>
              <span class="field-value">${master.acad || "Nom de l\u2019académie"}</span>
            </div>
            <div class="card-loc-field">
              <span class="field-label">VILLE</span>
              <span class="field-value">${master.ville || "Nom de la ville"}</span>
            </div>
            <div class="card-loc-field">
              <span class="field-label">RÉGION</span>
              <span class="field-value">${master.region || "Nom de la région"}</span>
            </div>
          </div>
        </div>
        <button type="button" class="btn-more" data-ifc="${master.ifc}">en savoir plus</button>
      </article>
    `;
  }

  /**
   * Affiche la liste des formations dans le conteneur de grille
   * @param {Array<Object>} formations
   */
  function renderCatalogue(formations) {
    const gridEl = document.getElementById('masters-grid');
    if (!gridEl) return;

    // HTML du bloc "aucun résultat"
    const noResultsHtml = `
      <div id="no-results" class="no-results" style="display: none;">
        <h3>Aucun Master ne correspond à votre recherche</h3>
        <p>Essayez d'élargir vos critères ou de réinitialiser la recherche.</p>
        <button type="button" class="btn-all-masters" id="btn-reset-empty">
          Réinitialiser les filtres
        </button>
      </div>
    `;

    if (!formations || formations.length === 0) {
      gridEl.innerHTML = noResultsHtml;
      const emptyResetBtn = document.getElementById('btn-reset-empty');
      if (emptyResetBtn) {
        emptyResetBtn.addEventListener('click', function () {
          document.getElementById('btn-all-masters')?.click();
        });
      }
      const nr = document.getElementById('no-results');
      if (nr) nr.style.display = 'block';
      return;
    }

    gridEl.innerHTML = formations.map(renderMasterCard).join('') + noResultsHtml;

    // Réattacher les écouteurs sur les boutons "en savoir plus"
    gridEl.querySelectorAll('.btn-more').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ifc = btn.dataset.ifc;
        openMasterDetailsModal(ifc);
      });
    });

    var emptyResetBtn = document.getElementById('btn-reset-empty');
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', function () {
        document.getElementById('btn-all-masters')?.click();
      });
    }
  }

  /**
   * Applique les filtres de recherche (Localisation, Alternance, Prix)
   */
  function applyFilters() {
    const { storage } = window.MAINAPP;
    const allFormations = storage.get('formations', false) || [];

    const locInput = document.getElementById('filter-location');
    const altSelect = document.getElementById('filter-alternance');
    const prixSelect = document.getElementById('filter-prix');

    const locQuery = locInput ? locInput.value.trim().toLowerCase() : '';
    const altQuery = altSelect ? altSelect.value.toLowerCase() : '';
    const prixQuery = prixSelect ? prixSelect.value.toLowerCase() : '';

    const filtered = allFormations.filter(function (f) {
      // Filtre texte Localisation (cherche dans ville, académie, région, mention, établissement)
      if (locQuery) {
        const text = (f.ville + ' ' + f.acad + ' ' + f.region + ' ' + f.mention + ' ' + f.secteurDisciplinaire + ' ' + f.eta_nom).toLowerCase();
        if (!text.includes(locQuery)) return false;
      }

      // Filtre Alternance
      if (altQuery === 'avec' && !f.alternance) return false;
      if (altQuery === 'sans' && f.alternance) return false;

      // Filtre Prix (heuristique basée sur le prix)
      if (prixQuery === 'public' && f.prix_annee && f.prix_annee.toLowerCase().includes('privé')) return false;
      if (prixQuery === 'prive' && f.prix_annee && !f.prix_annee.toLowerCase().includes('privé')) return false;

      return true;
    });

    renderCatalogue(filtered);
  }

  /* ==========================================================================
     Section 3 : Modal "En savoir plus" - Détails d'une formation
     ========================================================================== */

  /**
   * Ouvre la modal de détails d'un Master, charge les infos et stats depuis l'API
   * @param {string} ifc - Identifiant IFC de la formation
   */
  function openMasterDetailsModal(ifc) {
    const { network, vizDataPreprocessor } = window.MAINAPP;
    const modalEl = document.getElementById('master-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');

    if (!modalEl || !modalBody) return;

    // Afficher la modal avec un indicateur de chargement
    modalEl.classList.add('active');
    modalBody.innerHTML = '<p style="text-align:center; padding:30px;">Chargement des détails...</p>';

    // Charger les détails de la formation
    network.loadFormationByIfc(ifc)
      .then(function (rawFormation) {
        var formation = vizDataPreprocessor.formatFormationItem(rawFormation);
        if (!formation) {
          modalBody.innerHTML = '<p>Impossible de charger les détails de cette formation.</p>';
          return;
        }

        if (modalTitle) {
          modalTitle.textContent = formation.mention;
        }

        // Construire le contenu HTML de la modal
        var detailsHtml = '<div class="modal-details">';
        detailsHtml += '<div class="detail-section">';
        detailsHtml += '<h4>Informations générales</h4>';
        detailsHtml += '<p><strong>Mention :</strong> ' + formation.mention + '</p>';
        if (formation.parcours) {
          detailsHtml += '<p><strong>Parcours :</strong> ' + formation.parcours + '</p>';
        }
        detailsHtml += '<p><strong>Secteur disciplinaire :</strong> ' + formation.secteurDisciplinaire + '</p>';
        detailsHtml += '<p><strong>Discipline :</strong> ' + formation.discipline + '</p>';
        detailsHtml += '<p><strong>Alternance :</strong> ' + formation.alternanceLabel + '</p>';
        detailsHtml += '</div>';

        detailsHtml += '<div class="detail-section">';
        detailsHtml += '<h4>Localisation</h4>';
        detailsHtml += '<p><strong>Établissement :</strong> ' + formation.eta_nom + '</p>';
        detailsHtml += '<p><strong>Ville :</strong> ' + formation.ville + '</p>';
        detailsHtml += '<p><strong>Académie :</strong> ' + formation.acad + '</p>';
        detailsHtml += '<p><strong>Région :</strong> ' + formation.region + '</p>';
        if (formation.code_postal) {
          detailsHtml += '<p><strong>Code postal :</strong> ' + formation.code_postal + '</p>';
        }
        detailsHtml += '</div>';

        detailsHtml += '<div class="detail-section">';
        detailsHtml += '<h4>Coût et modalités</h4>';
        detailsHtml += '<p><strong>Prix indicatif :</strong> ' + formation.prix_annee + '</p>';
        detailsHtml += '</div>';

        // Zone pour le graphique de statistiques de candidatures
        detailsHtml += '<div class="detail-section" id="modal-stats-section">';
        detailsHtml += '<h4>Statistiques de candidatures</h4>';
        detailsHtml += '<div id="modal-stats-chart" style="width:100%; height:300px;">';
        detailsHtml += '<p style="text-align:center; color:#695a50;">Chargement des statistiques...</p>';
        detailsHtml += '</div>';
        detailsHtml += '</div>';

        detailsHtml += '</div>';

        modalBody.innerHTML = detailsHtml;

        // Charger les statistiques de candidatures en arrière-plan
        return network.requestStats(
          { ifcs: [ifc] },
          { candidatures: true }
        ).then(function (statsData) {
          var statsFormatted = vizDataPreprocessor.formatCandidaturesStats(statsData);
          var chartContainer = document.getElementById('modal-stats-chart');
          if (!chartContainer) return;

          if (statsFormatted.length === 0) {
            chartContainer.innerHTML = '<p style="text-align:center; color:#695a50;">Aucune statistique disponible pour cette formation.</p>';
            return;
          }

          // Vérifier la disponibilité d'ECharts pour afficher un graphique
          if (typeof echarts !== 'undefined') {
            var chart = echarts.init(chartContainer);
            var latestStats = statsFormatted[statsFormatted.length - 1];

            var categories = [];
            var values = [];
            var filieresLibelles = latestStats.filieresLibelles;
            var taux = latestStats.taux_admission_formation_precedente;

            Object.keys(taux).forEach(function (key) {
              categories.push(filieresLibelles[key] || key);
              values.push(taux[key]);
            });

            chart.setOption({
              title: {
                text: 'Taux admission par formation (' + latestStats.annee + ')',
                left: 'center',
                textStyle: { fontSize: 13, color: '#38201a' }
              },
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
              grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
              xAxis: {
                type: 'category',
                data: categories,
                axisLabel: { rotate: 25, fontSize: 10 }
              },
              yAxis: {
                type: 'value',
                axisLabel: { formatter: '{value} %' }
              },
              series: [{
                type: 'bar',
                data: values,
                itemStyle: { color: '#790101' },
                label: { show: true, position: 'top', formatter: '{c} %' }
              }]
            });
          } else {
            // Fallback texte si ECharts n'est pas chargé
            var textHtml = '<ul>';
            var latestStats2 = statsFormatted[statsFormatted.length - 1];
            textHtml += '<li><strong>Places :</strong> ' + latestStats2.n_places + '</li>';
            textHtml += '<li><strong>Candidats :</strong> ' + latestStats2.n_candidats + '</li>';
            textHtml += '<li><strong>Propositions :</strong> ' + latestStats2.n_proposition_admission + '</li>';
            textHtml += '</ul>';
            chartContainer.innerHTML = textHtml;
          }
        }).catch(function () {
          var chartContainer = document.getElementById('modal-stats-chart');
          if (chartContainer) {
            chartContainer.innerHTML = '<p style="text-align:center; color:#695a50;">Statistiques indisponibles.</p>';
          }
        });
      })
      .catch(function (err) {
        console.error('Erreur chargement détails formation :', err);
        modalBody.innerHTML = '<p>Erreur lors du chargement des détails. Veuillez réessayer.</p>';
      });
  }

  /**
   * Ferme une modal en retirant la classe active
   * @param {HTMLElement} modalEl - Élément DOM de la modal
   */
  function closeModal(modalEl) {
    if (modalEl) {
      modalEl.classList.remove('active');
    }
  }

  /* ==========================================================================
     Section 4 : Fonction principale et initialisation
     ========================================================================== */

  /**
   * Fonction main() : point d'entrée de l'application
   * Charge les données de référence, puis les formations depuis l'API,
   * les normalise et les affiche dans le catalogue.
   */
  function main() {
    var { network, storage, vizDataPreprocessor } = window.MAINAPP;

    var loadingEl = document.getElementById('loading-indicator');

    console.log('[M2Droit] Démarrage de l\'application...');

    // 1. Charger les entités de référence (académies, régions, disciplines, etc.)
    network.loadEntities()
      .then(function (entities) {
        // Stocker les référentiels en mémoire
        storage.set('academiesById', entities.academiesById);
        storage.set('regionsById', entities.regionsById);
        storage.set('secteursDiscById', entities.secteursDiscById);
        storage.set('disicplinesById', entities.disicplinesById);
        storage.set('etablissementsByUai', entities.etablissementsByUai);
        storage.set('mentionsById', entities.mentionsById);

        console.log('[M2Droit] Référentiels chargés avec succès.');

        // 2. Charger toutes les formations de droit
        return network.loadFormations({ q: 'droit' });
      })
      .then(function (rawFormations) {
        console.log('[M2Droit] ' + rawFormations.length + ' formations reçues de l\'API.');

        // 3. Normaliser chaque formation via le vizDataPreprocessor
        var formations = rawFormations
          .map(function (item) { return vizDataPreprocessor.formatFormationItem(item); })
          .filter(function (f) { return f !== null; });

        // 4. Stocker les formations normalisées
        storage.set('formations', formations);

        // 5. Masquer le chargement et afficher les cartes
        if (loadingEl) loadingEl.style.display = 'none';
        renderCatalogue(formations);

        console.log('[M2Droit] ' + formations.length + ' cartes de Masters affichées.');
      })
      .catch(function (err) {
        console.error('[M2Droit] Erreur lors du chargement :', err);
        if (loadingEl) {
          loadingEl.innerHTML = '<p style="color:#790101;">Erreur de chargement des données. Vérifiez votre connexion et rechargez la page.</p>';
        }
      });

    // ---- Mise en place des écouteurs d'événements ----

    // Formulaire de recherche : soumission
    var searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        applyFilters();
      });
    }

    // Bouton "Afficher tous les masters" : réinitialiser les filtres
    var btnAllMasters = document.getElementById('btn-all-masters');
    if (btnAllMasters) {
      btnAllMasters.addEventListener('click', function () {
        // Réinitialiser les champs
        var locInput = document.getElementById('filter-location');
        var altSelect = document.getElementById('filter-alternance');
        var prixSelect = document.getElementById('filter-prix');
        if (locInput) locInput.value = '';
        if (altSelect) altSelect.value = '';
        if (prixSelect) prixSelect.value = '';

        // Réafficher toutes les formations
        var formations = storage.get('formations', false) || [];
        renderCatalogue(formations);
      });
    }

    // Changement de valeur des filtres -> recherche en temps réel
    ['filter-location', 'filter-alternance', 'filter-prix'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', applyFilters);
        el.addEventListener('change', applyFilters);
      }
    });

    // Modal "En savoir plus" : fermeture
    var masterModal = document.getElementById('master-modal');
    var masterModalCloseBtn = document.getElementById('modal-close-btn');
    if (masterModalCloseBtn) {
      masterModalCloseBtn.addEventListener('click', function () {
        closeModal(masterModal);
      });
    }
    if (masterModal) {
      masterModal.addEventListener('click', function (e) {
        if (e.target === masterModal) {
          closeModal(masterModal);
        }
      });
    }

    // Modal RGPD : ouverture / fermeture
    var rgpdLink = document.getElementById('rgpd-link');
    var rgpdModal = document.getElementById('rgpd-modal');
    var rgpdCloseBtn = document.getElementById('rgpd-close-btn');
    if (rgpdLink && rgpdModal) {
      rgpdLink.addEventListener('click', function (e) {
        e.preventDefault();
        rgpdModal.classList.add('active');
      });
    }
    if (rgpdCloseBtn) {
      rgpdCloseBtn.addEventListener('click', function () {
        closeModal(rgpdModal);
      });
    }
    if (rgpdModal) {
      rgpdModal.addEventListener('click', function (e) {
        if (e.target === rgpdModal) {
          closeModal(rgpdModal);
        }
      });
    }

    // Fermeture des modals avec la touche Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (masterModal) closeModal(masterModal);
        if (rgpdModal) closeModal(rgpdModal);
      }
    });

    // Navigation lisse pour les ancres
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          var target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  /* ==========================================================================
     Section 5 : Bootstrap — démarrage de l'application au chargement du DOM
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', main);

}());
