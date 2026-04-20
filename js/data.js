/* =============================================
   DATA — Questions, Departments, geographic constants
   Content (voices, participation counts) lives in Firestore.
   Nothing in this file represents citizen submissions.
   ============================================= */

const QUESTIONS = [
  { id: 'q1', key: 'q1', hintKey: 'q1h' },
  { id: 'q2', key: 'q2', hintKey: 'q2h' },
  { id: 'q3', key: 'q3', hintKey: 'q3h' },
  { id: 'q4', key: 'q4', hintKey: 'q4h' },
  { id: 'q5', key: 'q5', hintKey: 'q5h' }
];

/* =============================================
   DEPARTMENTS — Haiti geographic data only
   (counts come live from Firestore meta/stats.perDept)
   ============================================= */
const DEPARTMENTS = [
  { id: 'ouest',      name: { ht: 'Lwès',        fr: 'Ouest',        en: 'Ouest' },       capital: 'Port-au-Prince', labelX: 225, labelY: 290, aliases: ['port-au-prince','port au prince','pap','petion-ville','petion ville','petionville','delmas','carrefour','tabarre','kenscoff','croix-des-bouquets','ouest'] },
  { id: 'artibonite', name: { ht: 'Latibonit',   fr: 'Artibonite',   en: 'Artibonite' },  capital: 'Gonaïves',       labelX: 210, labelY: 225, aliases: ['gonaives','gonaïves','saint-marc','st-marc','saint marc','dessalines','artibonite','latibonit'] },
  { id: 'nord',       name: { ht: 'Nò',          fr: 'Nord',         en: 'Nord' },        capital: 'Cap-Haïtien',    labelX: 228, labelY: 162, aliases: ['cap-haitien','cap-haïtien','cap haitien','cap-haitian','capois','milot','limbe','limbé','nord','no'] },
  { id: 'nord-est',   name: { ht: 'Nòdès',       fr: 'Nord-Est',     en: 'Nord-Est' },    capital: 'Fort-Liberté',   labelX: 335, labelY: 175, aliases: ['fort-liberte','fort-liberté','ouanaminthe','ouanaminth','nord-est','nodes','nordest'] },
  { id: 'nord-ouest', name: { ht: 'Nòdwès',      fr: 'Nord-Ouest',   en: 'Nord-Ouest' },  capital: 'Port-de-Paix',   labelX: 110, labelY: 163, aliases: ['port-de-paix','port de paix','saint-louis du nord','mole','môle','nord-ouest','nodwes','nordouest'] },
  { id: 'centre',     name: { ht: 'Sant',        fr: 'Centre',       en: 'Centre' },      capital: 'Hinche',         labelX: 340, labelY: 238, aliases: ['hinche','mirebalais','lascahobas','belladère','belladere','centre','sant'] },
  { id: 'sud',        name: { ht: 'Sid',         fr: 'Sud',          en: 'Sud' },         capital: 'Les Cayes',      labelX: 95,  labelY: 338, aliases: ['les cayes','cayes','aux cayes','port-salut','port salut','cavaillon','sud','sid'] },
  { id: 'sud-est',    name: { ht: 'Sidès',       fr: 'Sud-Est',      en: 'Sud-Est' },     capital: 'Jacmel',         labelX: 275, labelY: 345, aliases: ['jacmel','marigot','bainet','cayes-jacmel','sud-est','sides','sudest'] },
  { id: 'nippes',     name: { ht: 'Nip',         fr: 'Nippes',       en: 'Nippes' },      capital: 'Miragoâne',      labelX: 113, labelY: 295, aliases: ['miragoane','miragoâne','anse-a-veau','nippes','nip'] },
  { id: 'grand-anse', name: { ht: 'Grandans',    fr: 'Grand\'Anse',  en: 'Grand\'Anse' }, capital: 'Jérémie',        labelX: 48,  labelY: 300, aliases: ['jeremie','jérémie','dame-marie','abricots','grand-anse','grandans','grande-anse'] }
];

const DIASPORA_LABEL = { ht: 'Dyaspora', fr: 'Diaspora', en: 'Diaspora' };

/* =============================================
   DEFAULT ACCOUNT (admin / owner fallback login)
   ============================================= */
const DEFAULT_ACCOUNT = {
  name: 'Fridgy Compere',
  phone: '+50912345678',
  email: 'fridjycompere8@gmail.com',
  address: 'Port-au-Prince, Ayiti',
  isAnon: false,
  registered: true
};
const DEFAULT_AUTH = btoa('+50912345678:admin2026');
