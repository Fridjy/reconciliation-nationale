/* =============================================
   DATA — Questions, Seed Answers, Departments
   To add a new question: push to QUESTIONS array
   and add matching i18n keys in i18n.js
   ============================================= */

const QUESTIONS = [
  { id: 'q1', key: 'q1', hintKey: 'q1h' },
  { id: 'q2', key: 'q2', hintKey: 'q2h' },
  { id: 'q3', key: 'q3', hintKey: 'q3h' },
  { id: 'q4', key: 'q4', hintKey: 'q4h' },
  { id: 'q5', key: 'q5', hintKey: 'q5h' }
];

const seedAnswers = [
  {
    id: 1, name: 'Marie-Claire', where: 'Jacmel',
    q1: { ht: 'Yon peyi kote timoun mwen ka mache al lekòl san pè. Kote lopital louvri. Kote yo pa oblije kite peyi a pou jwenn yon lavi dijne.',
          fr: 'Un pays où mes enfants peuvent aller à l\'école sans peur. Où les hôpitaux sont ouverts. Où on ne doit pas partir pour avoir une vie digne.',
          en: 'A country where my children can walk to school without fear. Where hospitals are open. Where people don\'t have to leave to find a dignified life.' },
    q2: { ht: 'Yon pèp ki sonje 1804 men ki viv nan 2026. Fyè san ògèy. Solidè san nayif.',
          fr: 'Un peuple qui se souvient de 1804 mais qui vit en 2026. Fier sans orgueil. Solidaire sans naïveté.',
          en: 'A people who remember 1804 but live in 2026. Proud without arrogance. United without naivety.' },
    q3: { ht: 'Vil san fatra. Lakanpay ki gen dlo. Pye bwa tout kote. Kote manman ka mennen tibebe l al jwe nan laplenn.',
          fr: 'Des villes sans ordures. Des campagnes avec de l\'eau. Des arbres partout. Où une mère peut amener son bébé jouer dans un parc.',
          en: 'Cities without garbage. Countryside with water. Trees everywhere. Where a mother can take her baby to play in a park.' },
    q4: { ht: 'Yon lajistis ki pa sou vann. Yon lapolis ki respekte pèp la. Yon leta ki sèvi, pa ki sèvi tèt li.',
          fr: 'Une justice qui ne se vend pas. Une police qui respecte le peuple. Un État qui sert, pas qui se sert.',
          en: 'A justice that cannot be bought. A police that respects the people. A state that serves, not one that serves itself.' },
    q5: { ht: 'Lidè ki koute anvan yo pale. Ki gen kouraj rekonèt yo pa gen tout repons. Ki kite pouvwa a lè lè a rive.',
          fr: 'Des leaders qui écoutent avant de parler. Qui ont le courage de dire qu\'ils n\'ont pas toutes les réponses. Qui quittent le pouvoir quand le moment vient.',
          en: 'Leaders who listen before they speak. Who have the courage to admit they don\'t have all the answers. Who leave power when the time comes.' },
    votes: { q1: 84, q2: 62, q3: 71, q4: 103, q5: 91 },
    comments: { q1: [], q2: [], q3: [], q4: [{who:'Patrick · Cap-Haïtien',text:{ht:'Dakò. Men ki jan?',fr:'D\'accord. Mais comment ?',en:'Agreed. But how?'}}], q5: [] }
  },
  {
    id: 2, name: 'Wilfrid', where: 'Boston · Dyaspora',
    q1: { ht: 'Yon peyi kote mwen ka retounen san pè pèdi lavi mwen. Kote envestisman mwen ap rete nan peyi a.',
          fr: 'Un pays où je peux rentrer sans craindre de perdre ma vie. Où mon investissement reste dans le pays.',
          en: 'A country I can return to without fearing for my life. Where my investment stays in the country.' },
    q2: { ht: 'Yon pèp ki konprann dyaspora se pa lènmi. Nou se yon pati nan kò nasyon an — pa yon gichè ATM.',
          fr: 'Un peuple qui comprend que la diaspora n\'est pas l\'ennemi. Nous sommes partie du corps de la nation — pas un distributeur.',
          en: 'A people who understand the diaspora is not the enemy. We are part of the nation\'s body — not an ATM.' },
    q3: { ht: 'Yon anviwonman teknolojik. Entènèt pou tout moun. Lekòl ki anseye kod, lasyans, lang etranje.',
          fr: 'Un environnement technologique. Internet pour tous. Des écoles qui enseignent le code, les sciences, les langues étrangères.',
          en: 'A technological environment. Internet for all. Schools that teach coding, science, foreign languages.' },
    q4: { ht: 'Dwa vòt pou dyaspora kounye a. Yon bank nasyonal devlopman. Yon ministè reyèl pou modènizasyon.',
          fr: 'Droit de vote pour la diaspora maintenant. Une banque nationale de développement. Un vrai ministère de la modernisation.',
          en: 'Voting rights for the diaspora now. A national development bank. A real ministry for modernization.' },
    q5: { ht: 'Lidè ki pa vin nan politik pou fè lajan. Yon limit laj — pa plis pase 65 an. Yon limit manda — pa janm plis pase 2.',
          fr: 'Des leaders qui ne viennent pas en politique pour s\'enrichir. Une limite d\'âge — pas plus de 65 ans. Une limite de mandat — jamais plus de 2.',
          en: 'Leaders who don\'t enter politics to get rich. An age limit — no more than 65. A term limit — never more than 2.' },
    votes: { q1: 56, q2: 142, q3: 78, q4: 189, q5: 167 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 3, name: 'Nadège', where: 'Gonaïves',
    q1: { ht: 'Yon peyi kote manje gen — diri nou, pwa nou, mayi nou. Kote nou pa enpòte tout bagay ki sòti Dominikani.',
          fr: 'Un pays où la nourriture abonde — notre riz, nos haricots, notre maïs. Où on n\'importe pas tout de Saint-Domingue.',
          en: 'A country where food is abundant — our rice, our beans, our corn. Where we don\'t import everything from the Dominican Republic.' },
    q2: { ht: 'Yon pèp ki rekòlte sa li plante. Travayè. Pasyan. Men ki pa tolere lenjistis.',
          fr: 'Un peuple qui récolte ce qu\'il sème. Travailleur. Patient. Mais qui ne tolère pas l\'injustice.',
          en: 'A people who reap what they sow. Hardworking. Patient. But who do not tolerate injustice.' },
    q3: { ht: 'Mòn yo plante ankò. Rivyè yo klere. Plaj yo pwòp. Yon anviwonman ki respekte.',
          fr: 'Les montagnes reboisées. Les rivières claires. Les plages propres. Un environnement respecté.',
          en: 'Mountains replanted. Rivers clear. Beaches clean. An environment that is respected.' },
    q4: { ht: 'Lekòl gratis. Sant sante pou ti peyizan. Yon bank ki prete kòb bay fanm nan mache a.',
          fr: 'L\'école gratuite. Des centres de santé pour les paysans. Une banque qui prête aux marchandes.',
          en: 'Free schools. Health centers for small farmers. A bank that lends to market women.' },
    q5: { ht: 'Lidè ki sòti nan pèp la. Ki te konnen grangou. Ki pale Kreyòl pi byen pase Franse.',
          fr: 'Des leaders issus du peuple. Qui ont connu la faim. Qui parlent le créole mieux que le français.',
          en: 'Leaders who come from the people. Who have known hunger. Who speak Kreyòl better than French.' },
    votes: { q1: 97, q2: 48, q3: 128, q4: 84, q5: 156 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 4, name: 'Anonim', where: 'Port-au-Prince',
    q1: { ht: 'Yon peyi san zam nan lari. Yon peyi kote mwen ka dòmi san tande bal.',
          fr: 'Un pays sans armes dans les rues. Un pays où je peux dormir sans entendre les balles.',
          en: 'A country without guns in the streets. A country where I can sleep without hearing gunshots.' },
    q2: { ht: 'Yon pèp ki konnen se yon sèl peyi nou genyen. Pa de. Pa twa. Yon sèl.',
          fr: 'Un peuple qui sait qu\'on n\'a qu\'un seul pays. Pas deux. Pas trois. Un seul.',
          en: 'A people who know we have only one country. Not two. Not three. One.' },
    q3: { ht: 'Lari ki klere lannwit. Paviyon kominotè. Dignite sitou.',
          fr: 'Des rues éclairées la nuit. Des espaces communautaires. La dignité surtout.',
          en: 'Streets lit at night. Community spaces. Dignity above all.' },
    q4: { ht: 'Konstitisyon ki klè. Eleksyon ki òganize byen. Parleman ki pa ka achte.',
          fr: 'Une constitution claire. Des élections bien organisées. Un parlement qui ne s\'achète pas.',
          en: 'A clear constitution. Well-organized elections. A parliament that cannot be bought.' },
    q5: { ht: 'Lidè ki ka di "mwen pa konnen" san wont. Ki gen moun entelijan bò kote yo.',
          fr: 'Des leaders qui peuvent dire "je ne sais pas" sans honte. Qui s\'entourent de personnes compétentes.',
          en: 'Leaders who can say "I don\'t know" without shame. Who surround themselves with competent people.' },
    votes: { q1: 215, q2: 89, q3: 67, q4: 142, q5: 98 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 5, name: 'Jean-Baptiste', where: 'Cap-Haïtien',
    q1: { ht: 'Yon peyi kote agrikilti se richès. Kote peyizan ka viv ak tè yo san pè.',
          fr: 'Un pays où l\'agriculture est la richesse. Où les paysans peuvent vivre de leur terre sans crainte.',
          en: 'A country where agriculture is wealth. Where farmers can live from their land without fear.' },
    q2: { ht: 'Yon pèp ki respekte istwa l men ki pa prizonye l. Ki ka pale Kreyòl, Franse, Angle — e ki fyè nan tout.',
          fr: 'Un peuple qui respecte son histoire mais qui n\'en est pas prisonnier. Qui parle créole, français, anglais — et en est fier.',
          en: 'A people who respect their history but are not prisoners of it. Who speak Kreyòl, French, English — and are proud of all.' },
    q3: { ht: 'Rivyè ki pwòp. Mòn ki gen pyebwa. Vil ki gen trotwa. Yon anviwonman kote moun respekte lanati.',
          fr: 'Des rivières propres. Des montagnes boisées. Des villes avec des trottoirs. Un environnement où les gens respectent la nature.',
          en: 'Clean rivers. Forested mountains. Cities with sidewalks. An environment where people respect nature.' },
    q4: { ht: 'Yon sistèm sante ki mache. Yon lekòl nan chak komin. Yon tribinal ki pa pou vann.',
          fr: 'Un système de santé qui fonctionne. Une école dans chaque commune. Un tribunal qui ne se vend pas.',
          en: 'A healthcare system that works. A school in every commune. A court that cannot be bought.' },
    q5: { ht: 'Lidè ki gen vizyon pou 50 an, pa pou 5 an. Ki envesti nan edikasyon, pa nan pwopagann.',
          fr: 'Des leaders avec une vision de 50 ans, pas de 5 ans. Qui investissent dans l\'éducation, pas la propagande.',
          en: 'Leaders with a 50-year vision, not a 5-year one. Who invest in education, not propaganda.' },
    votes: { q1: 134, q2: 76, q3: 198, q4: 112, q5: 87 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 6, name: 'Anonim', where: 'Montreal · Dyaspora',
    q1: { ht: 'Yon peyi kote mwen ka voye pitit mwen pase vakans san kè sote. Kote lajan transfè pa pèdi nan vòl.',
          fr: 'Un pays où je peux envoyer mes enfants en vacances sans angoisse. Où les transferts d\'argent ne se perdent pas.',
          en: 'A country where I can send my children on vacation without anxiety. Where money transfers don\'t disappear.' },
    q2: { ht: 'Yon pèp ki sispann di "se pa fòt mwen." Ki pran responsablite. Ki aji olye plenyen.',
          fr: 'Un peuple qui arrête de dire "ce n\'est pas ma faute." Qui prend ses responsabilités. Qui agit au lieu de se plaindre.',
          en: 'A people who stop saying "it\'s not my fault." Who take responsibility. Who act instead of complaining.' },
    q3: { ht: 'Yon anviwonman modèn. Entènèt rapid. Wout ki pa kraze machin. Limyè lannwit.',
          fr: 'Un environnement moderne. Internet rapide. Des routes qui ne cassent pas les voitures. De la lumière la nuit.',
          en: 'A modern environment. Fast internet. Roads that don\'t destroy cars. Light at night.' },
    q4: { ht: 'Yon sèvis paspò ki fonksyone. Yon anbasad ki respekte sitwayen l. Yon leta ki la pou sèvi.',
          fr: 'Un service de passeport qui fonctionne. Une ambassade qui respecte ses citoyens. Un État qui est là pour servir.',
          en: 'A passport service that works. An embassy that respects its citizens. A state that is there to serve.' },
    q5: { ht: 'Lidè ki gen eksperyans entènasyonal. Ki konprann teknoloji. Ki pa pè jenn moun.',
          fr: 'Des leaders avec une expérience internationale. Qui comprennent la technologie. Qui n\'ont pas peur des jeunes.',
          en: 'Leaders with international experience. Who understand technology. Who are not afraid of young people.' },
    votes: { q1: 245, q2: 167, q3: 89, q4: 201, q5: 156 },
    comments: { q1: [{who:'Sophie · Paris',text:{ht:'Menm bagay pou mwen!',fr:'Pareil pour moi !',en:'Same for me!'}}], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 7, name: 'Roseline', where: 'Les Cayes',
    q1: { ht: 'Yon peyi kote fanm ka mache lib nan lari. Kote pitit fi gen menm chans ak pitit gason.',
          fr: 'Un pays où les femmes peuvent marcher librement dans la rue. Où les filles ont les mêmes chances que les garçons.',
          en: 'A country where women can walk freely in the street. Where girls have the same chances as boys.' },
    q2: { ht: 'Yon pèp ki valorize travay. Ki pa ap tann charite. Ki kreye richès ak men l.',
          fr: 'Un peuple qui valorise le travail. Qui n\'attend pas la charité. Qui crée la richesse de ses mains.',
          en: 'A people who value work. Who don\'t wait for charity. Who create wealth with their own hands.' },
    q3: { ht: 'Pak pou timoun jwe. Bibliyotèk nan chak katye. Espas vèt nan vil yo.',
          fr: 'Des parcs pour que les enfants jouent. Des bibliothèques dans chaque quartier. Des espaces verts dans les villes.',
          en: 'Parks for children to play. Libraries in every neighborhood. Green spaces in cities.' },
    q4: { ht: 'Yon pwoteksyon sivil ki pare pou katastwòf. Yon sistèm idantite ki mache. Yon rejis fonsye klè.',
          fr: 'Une protection civile prête pour les catastrophes. Un système d\'identité qui fonctionne. Un registre foncier clair.',
          en: 'Civil protection ready for disasters. An identity system that works. A clear land registry.' },
    q5: { ht: 'Plis fanm nan pouvwa. Lidè ki konnen soufrans pèp la. Ki pa gen kont an dola nan peyi etranje.',
          fr: 'Plus de femmes au pouvoir. Des leaders qui connaissent la souffrance du peuple. Qui n\'ont pas de comptes en dollars à l\'étranger.',
          en: 'More women in power. Leaders who know the suffering of the people. Who don\'t have dollar accounts abroad.' },
    votes: { q1: 312, q2: 98, q3: 145, q4: 67, q5: 278 },
    comments: { q1: [], q2: [{who:'Marc · Jérémie',text:{ht:'Vrè pawòl.',fr:'Vrai.',en:'True words.'}}], q3: [], q4: [], q5: [] }
  },
  {
    id: 8, name: 'Pierre-Louis', where: 'Hinche',
    q1: { ht: 'Yon peyi kote pwovens pa bliye. Kote tout richès pa rete Pòtoprens. Kote chak depatman gen pouvwa.',
          fr: 'Un pays où les provinces ne sont pas oubliées. Où toute la richesse ne reste pas à Port-au-Prince. Où chaque département a du pouvoir.',
          en: 'A country where the provinces are not forgotten. Where all the wealth doesn\'t stay in Port-au-Prince. Where each department has power.' },
    q2: { ht: 'Yon pèp ki ini. Ki sispann fè diferans ant moun lavil ak moun andeyò. Nou tout se Ayisyen.',
          fr: 'Un peuple uni. Qui arrête de faire la différence entre citadins et ruraux. Nous sommes tous Haïtiens.',
          en: 'A united people. Who stop making a difference between city people and rural people. We are all Haitian.' },
    q3: { ht: 'Dlo pou tout moun. Elektrisite 24 sou 24. Wout ki konekte tout depatman.',
          fr: 'De l\'eau pour tous. De l\'électricité 24h/24. Des routes qui connectent tous les départements.',
          en: 'Water for everyone. Electricity 24/7. Roads that connect all departments.' },
    q4: { ht: 'Desantralizasyon reyèl. Majistra ki gen mwayen. Inivèsite nan chak depatman.',
          fr: 'Une vraie décentralisation. Des maires qui ont les moyens. Une université dans chaque département.',
          en: 'Real decentralization. Mayors with real resources. A university in every department.' },
    q5: { ht: 'Lidè ki sòti nan pwovens tou. Pa sèlman Pòtoprens. Ki konn realite peyizan an.',
          fr: 'Des leaders qui viennent aussi des provinces. Pas seulement de Port-au-Prince. Qui connaissent la réalité paysanne.',
          en: 'Leaders who also come from the provinces. Not just from Port-au-Prince. Who know the rural reality.' },
    votes: { q1: 189, q2: 134, q3: 256, q4: 178, q5: 112 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 9, name: 'Fabiola', where: 'Pétion-Ville',
    q1: { ht: 'Yon peyi kote biznis ka grandi san koripsyon. Kote jenn antreprenè gen aksè a kredi.',
          fr: 'Un pays où les entreprises peuvent grandir sans corruption. Où les jeunes entrepreneurs ont accès au crédit.',
          en: 'A country where businesses can grow without corruption. Where young entrepreneurs have access to credit.' },
    q2: { ht: 'Yon pèp ki modèn men ki kenbe rasin li. Ki itilize teknoloji pou konstwi, pa pou detwi.',
          fr: 'Un peuple moderne mais qui garde ses racines. Qui utilise la technologie pour construire, pas pour détruire.',
          en: 'A modern people who keep their roots. Who use technology to build, not to destroy.' },
    q3: { ht: 'Jesyon fatra ki mache. Resiklaj. Enèji solè. Yon peyi ki panse avni.',
          fr: 'Une gestion des déchets qui fonctionne. Le recyclage. L\'énergie solaire. Un pays qui pense à l\'avenir.',
          en: 'Waste management that works. Recycling. Solar energy. A country that thinks about the future.' },
    q4: { ht: 'Yon ladwàn ki pa koripsyon. Yon rejistè komès ki senp. Yon leta ki ankouraje, pa ki bloke.',
          fr: 'Une douane sans corruption. Un registre de commerce simple. Un État qui encourage, pas qui bloque.',
          en: 'Customs without corruption. A simple business registry. A state that encourages, not blocks.' },
    q5: { ht: 'Lidè ki konprann ekonomi. Ki gen plan konkrè. Ki mezire rezilta, pa pwomès.',
          fr: 'Des leaders qui comprennent l\'économie. Qui ont des plans concrets. Qui mesurent les résultats, pas les promesses.',
          en: 'Leaders who understand the economy. Who have concrete plans. Who measure results, not promises.' },
    votes: { q1: 167, q2: 203, q3: 134, q4: 189, q5: 145 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  },
  {
    id: 10, name: 'Emmanuel', where: 'Jérémie',
    q1: { ht: 'Yon peyi kote kilti se motè devlopman. Kote atis ka viv ak talan yo.',
          fr: 'Un pays où la culture est le moteur du développement. Où les artistes peuvent vivre de leur talent.',
          en: 'A country where culture drives development. Where artists can live from their talent.' },
    q2: { ht: 'Yon pèp ki li. Ki reflechi. Ki diskite san goumen. Ki koute anvan yo jije.',
          fr: 'Un peuple qui lit. Qui réfléchit. Qui discute sans se battre. Qui écoute avant de juger.',
          en: 'A people who read. Who think. Who discuss without fighting. Who listen before judging.' },
    q3: { ht: 'Plaj pwoteje. Patrimwàn natirèl konsève. Yon peyi ki bèl e ki konnen li bèl.',
          fr: 'Des plages protégées. Un patrimoine naturel conservé. Un pays beau qui sait qu\'il est beau.',
          en: 'Protected beaches. Conserved natural heritage. A beautiful country that knows it is beautiful.' },
    q4: { ht: 'Yon ministè kilti ki gen mwayen. Yon bibliyotèk nasyonal dijital. Yon mize nan chak vil.',
          fr: 'Un ministère de la culture qui a les moyens. Une bibliothèque nationale numérique. Un musée dans chaque ville.',
          en: 'A ministry of culture with resources. A national digital library. A museum in every city.' },
    q5: { ht: 'Lidè ki gen kilti. Ki li liv. Ki konprann istwa. Ki respekte konesans.',
          fr: 'Des leaders cultivés. Qui lisent. Qui comprennent l\'histoire. Qui respectent le savoir.',
          en: 'Cultured leaders. Who read. Who understand history. Who respect knowledge.' },
    votes: { q1: 98, q2: 267, q3: 178, q4: 56, q5: 234 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  }
];

/* =============================================
   DEPARTMENTS — Haiti geographic data
   ============================================= */
const DEPARTMENTS = [
  { id: 'ouest',      name: { ht: 'Lwès',        fr: 'Ouest',        en: 'Ouest' },       capital: 'Port-au-Prince', seedCount: 412, labelX: 225, labelY: 290, aliases: ['port-au-prince','port au prince','pap','petion-ville','petion ville','petionville','delmas','carrefour','tabarre','kenscoff','croix-des-bouquets','ouest'] },
  { id: 'artibonite', name: { ht: 'Latibonit',   fr: 'Artibonite',   en: 'Artibonite' },  capital: 'Gonaïves',       seedCount: 186, labelX: 210, labelY: 225, aliases: ['gonaives','gonaïves','saint-marc','st-marc','saint marc','dessalines','artibonite','latibonit'] },
  { id: 'nord',       name: { ht: 'Nò',          fr: 'Nord',         en: 'Nord' },        capital: 'Cap-Haïtien',    seedCount: 234, labelX: 228, labelY: 162, aliases: ['cap-haitien','cap-haïtien','cap haitien','cap-haitian','capois','milot','limbe','limbé','nord','no'] },
  { id: 'nord-est',   name: { ht: 'Nòdès',       fr: 'Nord-Est',     en: 'Nord-Est' },    capital: 'Fort-Liberté',   seedCount: 78,  labelX: 335, labelY: 175, aliases: ['fort-liberte','fort-liberté','ouanaminthe','ouanaminth','nord-est','nodes','nordest'] },
  { id: 'nord-ouest', name: { ht: 'Nòdwès',      fr: 'Nord-Ouest',   en: 'Nord-Ouest' },  capital: 'Port-de-Paix',   seedCount: 112, labelX: 110, labelY: 163, aliases: ['port-de-paix','port de paix','saint-louis du nord','mole','môle','nord-ouest','nodwes','nordouest'] },
  { id: 'centre',     name: { ht: 'Sant',        fr: 'Centre',       en: 'Centre' },      capital: 'Hinche',         seedCount: 95,  labelX: 340, labelY: 238, aliases: ['hinche','mirebalais','lascahobas','belladère','belladere','centre','sant'] },
  { id: 'sud',        name: { ht: 'Sid',         fr: 'Sud',          en: 'Sud' },         capital: 'Les Cayes',      seedCount: 168, labelX: 95,  labelY: 338, aliases: ['les cayes','cayes','aux cayes','port-salut','port salut','cavaillon','sud','sid'] },
  { id: 'sud-est',    name: { ht: 'Sidès',       fr: 'Sud-Est',      en: 'Sud-Est' },     capital: 'Jacmel',         seedCount: 203, labelX: 275, labelY: 345, aliases: ['jacmel','marigot','bainet','cayes-jacmel','sud-est','sides','sudest'] },
  { id: 'nippes',     name: { ht: 'Nip',         fr: 'Nippes',       en: 'Nippes' },      capital: 'Miragoâne',      seedCount: 64,  labelX: 113, labelY: 295, aliases: ['miragoane','miragoâne','anse-a-veau','nippes','nip'] },
  { id: 'grand-anse', name: { ht: 'Grandans',    fr: 'Grand\'Anse',  en: 'Grand\'Anse' }, capital: 'Jérémie',        seedCount: 54,  labelX: 48,  labelY: 300, aliases: ['jeremie','jérémie','dame-marie','abricots','grand-anse','grandans','grande-anse'] }
];

const DIASPORA_LABEL = { ht: 'Dyaspora', fr: 'Diaspora', en: 'Diaspora' };

/* =============================================
   DEFAULT ACCOUNT
   Used for the admin / owner. Can always log in
   with these credentials even if localStorage is cleared.
   Phone: +509 1234 5678 · Password: admin2026
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
