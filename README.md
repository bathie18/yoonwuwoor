# Yoon Wu Wóor — Observatoire national de la sécurité routière du Sénégal

*« Yoon wu wóor » : la route sûre, en wolof. Chaque trajet compte.*

Prototype de démonstration d'une plateforme nationale d'observation de la sécurité routière au Sénégal, inspirée de l'ONISR (France). Elle est pensée comme la vitrine du ministère en charge des Transports terrestres et de l'ensemble des acteurs (ANASER, DTR, CETUD, AGEROUTE, forces de défense et de sécurité, secours, collectivités, transporteurs).

**Démo en ligne :** https://bathie18.github.io/yoonwuwoor/

## Contenu

| Page | Description |
|---|---|
| `index.html` | Accueil : bilan 2025, chiffres clés, boîte à outils, carte, actualités, acteurs |
| `statistiques.html` | Statistiques et indicateurs : évolution, saisonnalité, causes, heures, usagers, régions, grands axes |
| `dataviz.html` | Dataviz des territoires : carte choroplèthe régions / départements / communes, fiche territoire, classement, comparaison, export du rapport PDF « Sécurité routière et accidentologie » |
| `carte.html` | Carte interactive : fonds OSM / aérien / blanc, étiquettes régions-départements-communes selon l'échelle, accidents classés (type de collision, gravité, luminosité, milieu) avec fiche détaillée, zones accidentogènes, fiches riches des centres de contrôle technique, auto-écoles, gares routières et centres de secours (matrice des destinations), signalements citoyens classés (type, famille, statut, gestionnaire, priorité) avec suivi du circuit de traitement, rapport PDF par territoire. Les catégories d'accidents sont décochées par défaut |
| `demarches.html` | Prévention et démarches : bons gestes par public, check-list avant un long trajet, démarches pas à pas (permis, carte grise, visite technique, assurance, après un accident, amendes, agréments), infractions et réforme du Code de la route, circuit de traitement des signalements, contacts utiles |
| `cartotheque.html` | Cartes thématiques téléchargeables (SVG) |
| `phototheque.html` | Banque d'images (illustrations provisoires) |
| `glossaire.html` | Glossaire A–Z avec recherche et filtre par thème |
| `quiz.html` | Quiz de sensibilisation (12 questions) |

Paramètres d'URL utiles pour les démos :
- `carte.html?couche=accidents` (ou `zone`, `heat`, `cct`, `autoecole`, `gare`, `secours`, `signalements`, `routes`)
- `dataviz.html?echelle=departement&indicateur=taux` (indicateurs : `tues`, `acc`, `bg`, `bl`, `taux`, `grav`)

## Données

- **Bilan national 2025** (15 407 accidents, 868 tués, 5 592 blessés graves, 9 536 blessés légers), répartitions par causes, heures, usagers, mois de pointe, axes et chiffres de Dakar, Thiès, Saint-Louis et Matam : ANASER, bilan 2025, repris par *Le Soleil* (2026).
- **Limites administratives** (14 régions, 45 départements, 433 communes) et **routes nationales** : package R `mapSenegal` (d'après GADM), reprojetées en WGS84 et simplifiées. GADM est libre pour un usage non commercial : prévoir une source ouverte (ANAT, OSM, geoBoundaries) pour la version de production.
- **Populations** : RGPH-5 (régions), estimations 2024 (départements).
- **Autoroutes** (A1, Ila Touba) : tracés indicatifs saisis manuellement.
- **Circuit de traitement des signalements** (`assets/js/circuit.js`) : proposition à valider avec le ministère, l'ANASER, l'AGEROUTE, l'ADS, les collectivités et les forces de sécurité.
- **Barème des amendes** : volontairement non renseigné en attendant le barème officiel (la grille « arrêté n° 009/MEMEFPD/MIT/MSPC » qui circule est togolaise).
- **Signalements citoyens** : 140 signalements de démonstration ; les nouveaux sont conservés dans le navigateur du visiteur pour la démonstration (version cible : API et back-office de traitement).
- **Simulé pour la démonstration** : séries 2021–2024, valeurs départementales et communales, répartition mensuelle hors pics publiés, et tous les points de la carte (zones accidentogènes, centres, auto-écoles, gares).

Fichiers : `data/stats.json`, `data/accidents.json` (2 200 accidents géolocalisés simulés), `data/signalements.json`, `data/labels.json`, `data/regions.geojson`, `data/departements.geojson`, `data/communes.geojson`, `data/routes.geojson`, `data/points.geojson`.

## Technique

Site statique sans build : HTML, CSS, JavaScript, [Leaflet](https://leafletjs.com/) (+ MarkerCluster, Leaflet.heat), [Chart.js](https://www.chartjs.org/), [jsPDF](https://github.com/parallax/jsPDF) pour les rapports, fonds de carte OpenStreetMap / CARTO / Esri. Thème clair / sombre, responsive.

Évolutions prévues pour la version cible : base PostGIS alimentée par les bulletins d'accidents (BAAC) des forces de sécurité, API, WebSIG QWC2 / Lizmap, back-office de publication, open data.

---
Prototype conçu par **CEGIT** — Centre d'Expertise en Géomatique et Ingénierie Territoriale · [cegitgroup.com](https://cegitgroup.com)
