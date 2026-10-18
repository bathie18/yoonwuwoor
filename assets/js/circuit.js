/* Yoon Wu Wóor — circuit de traitement des signalements citoyens (proposition à valider avec les acteurs) */
const YCircuit = (() => {
  /* Familles et types de signalement */
  const FAMILLES = {
    infra: ['Infrastructure et chaussée', '#8b5e34'],
    equip: ['Équipements de la route', '#f5b700'],
    usagers: ['Sécurité des usagers vulnérables', '#2b6cb0'],
    comport: ['Comportements et circulation', '#e31b23'],
    autre: ['Autres', '#535a66']
  };
  const TYPES = {
    degradee:      { lib: 'Chaussée dégradée / nids-de-poule', fam: 'infra',   ic: '🕳', col: '#8b5e34', prio: 'P2' },
    obstacle:      { lib: 'Obstacle, sable, animaux en divagation', fam: 'infra', ic: '⛔', col: '#7b3fbf', prio: 'P1' },
    eclairage:     { lib: 'Route mal éclairée', fam: 'equip',   ic: '💡', col: '#f5b700', prio: 'P2' },
    signalisation: { lib: 'Signalisation absente ou abîmée', fam: 'equip', ic: '⚠', col: '#ff7a00', prio: 'P2' },
    feu:           { lib: 'Feu tricolore en panne', fam: 'equip',   ic: '🚦', col: '#e31b23', prio: 'P1' },
    pieton:        { lib: 'Traversée piétonne dangereuse', fam: 'usagers', ic: '🚶', col: '#2b6cb0', prio: 'P2' },
    vitesse:       { lib: 'Vitesse excessive récurrente', fam: 'comport', ic: '⏱', col: '#12161d', prio: 'P2' },
    autre:         { lib: 'Autre', fam: 'autre', ic: '•', col: '#535a66', prio: 'P3' }
  };
  /* Statuts : étape atteinte dans le circuit (0 à 5) */
  const STATUTS = {
    'Reçu':      { etape: 0, col: '#9aa1ac', ouvert: true },
    'Qualifié':  { etape: 1, col: '#2b6cb0', ouvert: true },
    'Transmis':  { etape: 2, col: '#7b3fbf', ouvert: true },
    'Programmé': { etape: 3, col: '#ff7a00', ouvert: true },
    'En cours':  { etape: 4, col: '#f5b700', ouvert: true },
    'Résolu':    { etape: 5, col: '#00853f', ouvert: false },
    'Rejeté':    { etape: 1, col: '#535a66', ouvert: false }
  };
  const PRIORITES = {
    P1: ['P1 · Danger immédiat (alerte sous 24 h)', '#e31b23'],
    P2: ['P2 · Risque avéré (traitement sous 30 jours)', '#ff7a00'],
    P3: ['P3 · Gêne ou amélioration (programmation annuelle)', '#f5b700']
  };
  const GESTIONNAIRES = {
    'AGEROUTE': ['#00853f', 'Routes classées (nationales, régionales, départementales) hors autoroutes'],
    'ADS (Autoroutes du Sénégal)': ['#7b3fbf', 'Autoroutes à péage, avec le concessionnaire ou l\'exploitant de chaque section'],
    'Commune': ['#2b6cb0', 'Voirie communale, éclairage public, abords des écoles et marchés'],
    'Police nationale': ['#12161d', 'Comportements en agglomération : vitesse, stationnement, divagation'],
    'Gendarmerie nationale': ['#535a66', 'Comportements en rase campagne et sur les grands axes'],
    'ANASER': ['#e31b23', 'Signalements à requalifier ou relevant de la prévention']
  };
  /* Les 6 étapes du circuit */
  const ETAPES = [
    { nom: 'Réception', qui: 'Plateforme Yoon Wu Wóor (automatique)', role: 'Enregistre le signalement, attribue une référence, envoie l\'accusé de réception et détecte les doublons proches.', delai: 'Immédiat' },
    { nom: 'Qualification et validation', qui: 'ANASER – cellule Observatoire', role: 'Vérifie la localisation, la photo et la réalité du danger ; fixe la catégorie et la priorité ; valide ou rejette (doublon, hors champ).', delai: 'P1 : 24 h · P2 / P3 : 5 jours ouvrés' },
    { nom: 'Affectation et transmission', qui: 'ANASER – cellule Observatoire', role: 'Transmet au gestionnaire compétent, proposé automatiquement selon le type et la voie : AGEROUTE, ADS, commune, Police ou Gendarmerie. Alerte immédiate des forces de l\'ordre en P1.', delai: '24 h après validation' },
    { nom: 'Diagnostic et programmation', qui: 'Gestionnaire de la voie ou service compétent', role: 'Diagnostique sur le terrain, choisit la réponse (réparation, aménagement, contrôle) et la programme. Sur le réseau classé, l\'entretien est financé par le FERA.', delai: 'P1 : mise en sécurité sous 72 h · P2 : 30 jours' },
    { nom: 'Intervention', qui: 'Gestionnaire, son entreprise ou les forces de l\'ordre', role: 'Réalise les travaux, la mise en sécurité ou les contrôles ; met à jour l\'avancement et joint une photo après intervention.', delai: 'Selon programmation' },
    { nom: 'Vérification et clôture', qui: 'ANASER – cellule Observatoire', role: 'Contrôle la preuve d\'intervention et les retours des citoyens, clôture et informe le déclarant. Le dossier peut être rouvert sous 30 jours si le problème persiste.', delai: '5 jours ouvrés après intervention' }
  ];
  /* Qui fait quoi : réceptionne / valide / édite / clôture */
  const RACI = [
    ['Citoyen ou usager', 'Déclare, complète, confirme', 'Peut compléter son signalement tant qu\'il n\'est pas validé', 'Peut demander la réouverture'],
    ['Plateforme (automatique)', 'Réceptionne, accuse réception', '—', '—'],
    ['ANASER (Observatoire)', 'Qualifie, valide ou rejette, affecte', 'Édite la fiche publique : catégorie, priorité, statut, message au citoyen', 'Clôture après vérification'],
    ['AGEROUTE / ADS / commune', 'Accepte ou réoriente l\'affectation', 'Édite l\'avancement technique : diagnostic, programmation, photo après travaux', 'Déclare l\'intervention terminée'],
    ['Police / Gendarmerie', 'Reçoit les alertes P1 et les signalements de comportement', 'Renseigne les contrôles réalisés', 'Déclare l\'action terminée'],
    ['Ministère (MITTA)', 'Supervise le tableau de bord', '—', 'Arbitre les dossiers bloqués ou hors délai'],
    ['FERA', 'Consulté pour le financement', '—', '—']
  ];
  return { FAMILLES, TYPES, STATUTS, PRIORITES, GESTIONNAIRES, ETAPES, RACI };
})();
