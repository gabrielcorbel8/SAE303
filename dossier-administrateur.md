Document administrateur - M2Droit

1. Présentation générale


    1.1. Objet du document

Ce document s’adresse à chaque personne qui aura accès à l’administration de 
notre application. Ce guide ne doit pas être partagé avec une personne non
autorisée. Le but est de vous expliquer comment gérer le site “M2Droit”.


    1.2. Présentation de l'application

Le but de “M2Droit” est de faciliter la recherche des futurs étudiants en master dans
le secteur disciplinaire du droit et des sciences politiques. Dessus, vous pouvez
chercher des masters, puis filtrer selon la localisation, le type de formation
(alternance ou non) et le prix, mais aussi chercher directement sur une carte
interactive. L’application affiche également des statistiques d’admission sous forme
d’histogramme (nombre de candidats, propositions d’admission, places et taux
d’admission).


    1.3. Architecture technique

“M2Droit” repose sur une architecture front-end communiquant par requêtes asynchrones 
(AJAX / fetch) avec deux sources de données :
● Un serveur API REST interne : il gère le référentiel de données principal
(formations, établissements, mentions, statistiques de candidatures).
● Une API externe (API REST OpenData) : elle fournit des informations
complémentaires (logo de l'établissement, prix de la formation, volume
horaire).
Un système de cache local est intégré dans l’application afin d'accélérer le filtrage
des données et d'éviter de surcharger les serveurs.

    1.4. Interlocuteurs et contacts

Pour toute aide, vous pouvez contacter l’agence et vous adresser à Gabriel
CORBEL. Notre site est hébergé par "Le Mans Université".



2. Prérequis et Installation


    2.1. Prérequis matériels et logiciels

“M2Droit” est disponible uniquement en français. Pour utiliser ou administrer
l’application confortablement,votre ordinateur doit être équipé au minimum de :

● MacOS : “OS X 10.10 Yosemite” (2015) ou supérieur.
● Windows : “Windows 10” (2015) ou supérieur.
● Linux : Noyau “Linux 4.0” (2015) ou supérieur.
● Navigateur web à jour (Chrome, Firefox, Edge ou Safari) avec JavaScript
activé.


    2.2. Procédure de déploiement

Vous pouvez récupérer le site “M2Droit” et accéder à son interface d’administration
grâce au lien de déploiement et aux identifiants fournis par l’équipe technique de "Le
Mans Université".


    2.3. Configuration de l'environnement

Pour fonctionner, l'application nécessite la configuration des paramètres suivants :
● URL de l'API REST interne : adresse du serveur hébergeant les formations
et les candidatures.
● Clé et URL de l'API externe (Rest OpenData) : paramètres de connexion
pour récupérer les logos, tarifs et volumes horaires.
● Accès à la base de données : identifiants de connexion (hôte, port, nom de
la base, utilisateur et mot de passe) au référentiel de données.



3. Gestion du catalogue des Masters (Administration fonctionnelle)


    3.1. Modèle de données

Le référentiel de données de “M2Droit” s'organise autour des entités principales
suivantes :
● Formation : identifiée par son code ifc, elle contient le parcours, le statut
alternance (oui/non), les lieux et la ville.
● Établissement : identifié par son code eta_uai, avec son nom (eta_nom), son
logo et son universite de rattachement. Il est rattaché à une Académie,
elle-même rattachée à une Région.
● Classification pédagogique : chaque formation vise une Mention, qui
concerne un SecteurDisciplinaire, lui-même précisé par une Discipline.
● Candidatures : table statistique liée à une formation, un établissement, une
discipline et une année (TempsCollecte). Elle stocke le nombre de candidats
(n_candidats), les propositions d'admission (n_propositions_admissions), le
nombre de places (n_places) et le taux d'admission
(taux_admission_formation_precedente).


    3.2. Ajout et modification manuelle

L'ajout ou la correction d'une fiche master s'effectue directement dans le référentiel
de données via l'interface d'administration de l'API REST :
I. Connectez-vous à l'interface d'administration.
II. Sélectionnez la table Formation (ou Établissement).
III. Vérifiez que la Mention et l'Établissement existent déjà dans la base avant
de créer une nouvelle formation.
IV. Renseignez les champs obligatoires (ifc, parcours, alternance, ville) et
enregistrez.


    3.3. Import et mise à jour en masse

Lors des mises à jour annuelles des données nationales (MonMaster / OpenData) :
● Les données sont importées au format CSV ou JSON dans la base de
données du serveur API REST.
● Gestion des doublons : l'import s'appuie sur les clés primaires (ifc pour les
formations, eta_uai pour les établissements). Si un identifiant existe déjà, la
fiche est mise à jour ; sinon, elle est créée.
● Les informations complémentaires (logos, prix, volumes horaires) sont
synchronisées via l'API externe.


    3.4. Gestion des filtres et du cache de recherche

Le filtrage des masters (localisation, alternance, prix) s'effectue côté client après
récupération des données. Si une modification effectuée en base n'apparaît pas immédiatement sur le site, il est nécessaire de vider le cache local (voir section 5.4)
afin de forcer le rechargement des données depuis les API.


    3.5. Cycle de vie annuel

À chaque nouvelle campagne universitaire :
I. Création d'une nouvelle entrée dans la table TempsCollecte (ex. nouvelle
annee).
II. Import des nouvelles statistiques dans la table Candidatures pour l'année
concernée.
III. Suppression ou désactivation des formations fermées qui n'ont plus de
rattachement actif.



4. Exploitation et Maintenance (Runbook)


    4.1. Commandes de gestion des services

L'application étant hébergée sur les serveurs de "Le Mans Université", le
redémarrage du serveur web ou du service hébergeant l'API REST s'effectue via
l'hébergeur.


        4.2. Sauvegardes

Une sauvegarde automatique quotidienne de la base de données (contenant les
formations, établissements et candidatures) est assurée par l'infrastructure de "Le
Mans Université".


    4.3. Tâches planifiées

Les mises à jour des données issues de l'API externe (prix, logos, volumes horaires)
sont exécutées de manière asynchrone lors de la navigation des utilisateurs et mises
en mémoire dans le cache local. Aucune tâche planifiée manuelle n'est requise côté
client.

    
    4.4. Procédure de mise à jour de l'application

I. Récupérer la nouvelle version des fichiers sources de l'application.
II. Vérifier la compatibilité avec la structure de la base de données (MCD).
III. Déployer les nouveaux fichiers sur l'espace d'hébergement de "Le Mans
Université".
IV. Tester le chargement de la carte, des filtres et de l'histogramme des
candidatures.



5. Sécurité et Conformité (RGPD)


    5.1. Sécurisation des accès

L'accès à l'interface d'administration de la base de données est protégé par
authentification et restreint aux personnes autorisées.


    5.2. Gestion des données personnelles

“M2Droit” ne collecte aucune donnée personnelle auprès des étudiants : il n'y a ni
formulaire d'inscription, ni suivi nominatif. Les données statistiques de candidatures
(n_candidats, n_places) sont uniquement des données agrégées et anonymes.


    5.3. Mises à jour de sécurité

Les mises à jour de sécurité du serveur d'hébergement sont gérées par les équipes
de "Le Mans Université". Les mises à jour front-end (cartographie, graphiques) sont
assurées par l'agence lors des maintenances évolutives.



6. Annexes


    6.1. Glossaire

● AJAX / fetch : technologie permettant à la page web de récupérer des
données auprès des serveurs en arrière-plan sans recharger toute la page.
● API REST : interface permettant à l'application front-end de communiquer
avec la base de données des formations et avec les données OpenData.
● Cache local : espace de mémoire temporaire dans le navigateur qui
conserve les données déjà téléchargées pour accélérer la navigation.
● eta_uai : code unique d'identification d'un établissement d'enseignement
supérieur en France (Unité Administrative Immatriculée).
● ifc : identifiant unique d'une formation de master dans le référentiel.