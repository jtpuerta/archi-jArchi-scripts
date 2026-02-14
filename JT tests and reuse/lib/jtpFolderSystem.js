/**
 * Classe FolderSystem
 * Permet de gérer une structure arborescente de dossiers avec navigation par chemins.
 */
class FolderSystem {
  constructor(nomRacine = "root") {
    this.racine = {
      nom: nomRacine,
      enfants: []
    };
  }

  // ==========================================
  // 1. MÉTHODES DE NAVIGATION ET PARCOURS
  // ==========================================

  /**
   * Applique une fonction (callback) sur chaque dossier de l'arbre.
   * C'est la méthode centrale pour manipuler ou afficher les données.
   */
  parcourir(callback, dossier = this.racine, profondeur = 0, parent = null, cheminParent = "") {
    const cheminActuel = cheminParent === "" ? dossier.nom : `${cheminParent}/${dossier.nom}`;
    
    // Exécution du callback : (dossierActuel, niveau, objetParent, cheminComplet)
    callback(dossier, profondeur, parent, cheminActuel);

    if (dossier.enfants) {
      dossier.enfants.forEach(enfant => {
        this.parcourir(callback, enfant, profondeur + 1, dossier, cheminActuel);
      });
    }
  }

  /**
   * Recherche tous les dossiers portant un nom spécifique.
   * @returns {Array} Liste des chemins complets trouvés.
   */
  rechercher(nomCible) {
    const resultats = [];
    this.parcourir((dossier, niveau, parent, chemin) => {
      if (dossier.nom === nomCible) resultats.push(chemin);
    });
    return resultats;
  }

  // ==========================================
  // 2. ACTIONS (CRÉER, SUPPRIMER, DÉPLACER)
  // ==========================================

  /**
   * Crée un nouveau dossier s'il n'existe pas déjà à cet emplacement.
   * @param {string} cheminParent - Ex: "root/src"
   * @param {string} nouveauNom - Nom du dossier à créer
   */
  creerDossier(cheminParent, nouveauNom) {
    const segments = this._getSegments(cheminParent);
    return this._actionRecursive(this.racine, segments, (parent) => {
      if (parent.enfants.some(e => e.nom === nouveauNom)) {
        console.warn(`⚠️ Le dossier "${nouveauNom}" existe déjà dans "${parent.nom}"`);
        return false;
      }
      parent.enfants.push({ nom: nouveauNom, enfants: [] });
      return true;
    });
  }

  /**
   * Supprime un dossier via son chemin complet.
   */
  supprimer(chemin) {
    const segments = this._getSegments(chemin);
    if (segments.length < 2) return false; // On ne peut pas supprimer la racine

    const nomASupprimer = segments[segments.length - 1];
    const segmentsParent = segments.slice(0, -1);

    return this._actionRecursive(this.racine, segmentsParent, (parent) => {
      const index = parent.enfants.findIndex(e => e.nom === nomASupprimer);
      if (index !== -1) {
        parent.enfants.splice(index, 1);
        return true;
      }
      return false;
    });
  }

  /**
   * Déplace un dossier d'un endroit à un autre.
   */
  deplacer(cheminSource, cheminDest) {
    const segmentsSource = this._getSegments(cheminSource);
    const nomDossier = segmentsSource[segmentsSource.length - 1];
    
    // 1. Extraction (Couper)
    let dossierExtrait = null;
    this._actionRecursive(this.racine, segmentsSource.slice(0, -1), (parent) => {
      const index = parent.enfants.findIndex(e => e.nom === nomDossier);
      if (index !== -1) dossierExtrait = parent.enfants.splice(index, 1)[0];
    });

    if (!dossierExtrait) return false;

    // 2. Insertion (Coller)
    const segmentsDest = this._getSegments(cheminDest);
    const insere = this._actionRecursive(this.racine, segmentsDest, (parent) => {
      if (parent.enfants.some(e => e.nom === nomDossier)) return false;
      parent.enfants.push(dossierExtrait);
      return true;
    });

    // Sécurité : remettre à l'origine si la destination est invalide
    if (!insere) {
      this._actionRecursive(this.racine, segmentsSource.slice(0, -1), (p) => p.enfants.push(dossierExtrait));
      return false;
    }
    return true;
  }

  // ==========================================
  // 3. PERSISTANCE (JSON)
  // ==========================================

  exporterJSON() {
    return JSON.stringify(this.racine, null, 2);
  }

  importerJSON(donneesJSON) {
    const donnees = typeof donneesJSON === "string" ? JSON.parse(donneesJSON) : donneesJSON;
    if (donnees && donnees.nom && Array.isArray(donnees.enfants)) {
      this.racine = donnees;
      return true;
    }
    return false;
  }

  // ==========================================
  // INTERNE (PRIVÉ)
  // ==========================================

  _getSegments(chemin) {
    return chemin.split('/').filter(s => s.length > 0);
  }

  _actionRecursive(actuel, segments, action) {
    if (segments.length === 1 && actuel.nom === segments[0]) {
      return action(actuel);
    }
    if (actuel.nom === segments[0]) {
      const prochain = actuel.enfants.find(e => e.nom === segments[1]);
      if (prochain) return this._actionRecursive(prochain, segments.slice(1), action);
    }
    return false;
  }
}

// ==========================================
// EXEMPLE D'UTILISATION
// ==========================================

/*
// 1. Initialisation
const monFS = new FolderSystem("Projet");

// 2. Création de dossiers
monFS.creerDossier("Projet", "src");
monFS.creerDossier("Projet/src", "assets");
monFS.creerDossier("Projet/src", "components");
monFS.creerDossier("Projet", "tests");

// 3. Déplacer "components" dans "tests" (pour l'exemple)
monFS.deplacer("Projet/src/components", "Projet/tests");

// 4. Rechercher tous les dossiers nommés "assets"
const cheminsTrouves = monFS.rechercher("assets");
console.log("Recherche 'assets':", cheminsTrouves);

// 5. Utiliser 'parcourir' pour afficher une arborescence visuelle
console.log("\nStructure actuelle :");
monFS.parcourir((dossier, niveau) => {
  console.log("  ".repeat(niveau) + "└── " + dossier.nom);
});

// 6. Sauvegarder
const backup = monFS.exporterJSON();
*/