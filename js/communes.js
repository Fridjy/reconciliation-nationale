/* =============================================
   HAITI COMMUNES — grouped by department
   Used for registration form dropdowns
   ============================================= */

const HAITI_COMMUNES = {
  "Ouest": ["Anse à Galets", "Arcahaie", "Cabaret", "Carrefour", "Cité Soleil", "Cornillon / Grand Bois", "Croix-Des-Bouquets", "Delmas", "Fonds-Verrettes", "Ganthier", "Grand-Goâve", "Gressier", "Kenscoff", "Léogâne", "Petit-Goâve", "Pointe à Raquette", "Port-au-Prince", "Pétion-Ville", "Tabarre", "Thomazeau"],
  "Nord": ["Acul du Nord", "Bahon", "Bas Limbé", "Borgne", "Cap-Haïtien", "Dondon", "Grande Riviere Du Nord", "La Victoire", "Limbé", "Limonade", "Milot", "Pignon", "Pilate", "Plaine du Nord", "Plaisance", "Port-Margot", "Quartier Morin", "Ranquitte", "Saint-Raphaël"],
  "Artibonite": ["Anse Rouge", "Desdunes", "Dessalines", "Ennery", "Gonaïves", "Grande Saline", "Gros Morne", "L'Estère", "La Chapelle", "Marmelade", "Petite Rivière de l'Artibonite", "Saint-Marc", "Saint-Michel de l'Attalaye", "Terre Neuve", "Verrettes"],
  "Sud": ["Aquin", "Arniquet", "Camp-Perrin", "Cavaillon", "Chantal", "Chardonnières", "Côteaux", "Les Anglais", "Les Cayes", "Maniche", "Port-Salut", "Port-à-Piment", "Roche à Bâteau", "Saint Jean du Sud", "Saint Louis du Sud", "Tiburon", "Torbeck", "Île à Vache"],
  "Sud-Est": ["Anse-à-Pître", "Bainet", "Belle Anse", "Cayes-Jacmel", "Côtes de Fer", "Grand Gosier", "Jacmel", "La Vallée", "Marigot", "Thiotte"],
  "Nord-Est": ["Capotille", "Caracol", "Carice", "Ferrier", "Fort-Liberté", "Mombin Crochu", "Mont-Organisé", "Ouanaminthe", "Perches", "Sainte Suzanne", "Terrier Rouge", "Trou du Nord", "Vallières"],
  "Nord-Ouest": ["Anse-à-Foleur", "Baie de Henne", "Bassin Bleu", "Bombardopolis", "Chamsolme", "Jean Rabel", "La Tortue", "Môle Saint Nicolas", "Port-de-Paix", "Saint-Louis du Nord"],
  "Centre": ["Belladère", "Boucan Carré", "Cerca Carvajal", "Cerca La Source", "Hinche", "Lascahobas", "Maïssade", "Mirebalais", "Saut d'Eau", "Savanette", "Thomassique", "Thomonde"],
  "Grande'Anse": ["Abricots", "Anse d'Hainault", "Beaumont", "Bonbon", "Chambellan", "Corail", "Dame Marie", "Jérémie", "Les Irois", "Moron", "Pestel", "Roseaux"],
  "Nippes": ["Anse-à-Veau", "Arnaud", "Baradères", "Fonds des Nègres", "Grand-Boucan", "L'Asile", "Miragoâne", "Paillant", "Petit Trou de Nippes", "Petite Rivière de Nippes", "Plaisance du Sud"],
  "Sud": ["Aquin", "Arniquet", "Camp-Perrin", "Cavaillon", "Chantal", "Chardonnières", "Côteaux", "Les Anglais", "Les Cayes", "Maniche", "Port-Salut", "Port-à-Piment", "Roche à Bâteau", "Saint Jean du Sud", "Saint Louis du Sud", "Tiburon", "Torbeck", "Île à Vache"]
};

// Department name → department ID mapping (matches DEPARTMENTS in data.js)
const DEPT_NAME_TO_ID_REG = {
  'Ouest': 'ouest',
  'Nord': 'nord',
  'Artibonite': 'artibonite',
  'Sud': 'sud',
  'Sud-Est': 'sud-est',
  'Nord-Est': 'nord-est',
  'Nord-Ouest': 'nord-ouest',
  'Centre': 'centre',
  "Grande'Anse": 'grand-anse',
  'Nippes': 'nippes'
};
