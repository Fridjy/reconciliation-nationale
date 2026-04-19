/* =============================================
   COUNTRIES DATA — flags, phone codes, names
   Haiti first, then diaspora countries, then rest
   ============================================= */

const COUNTRIES = [
  // Haiti first
  { code: 'HT', name: 'Haïti', flag: '\ud83c\udded\ud83c\uddf9', phone: '+509' },
  // Top diaspora countries
  { code: 'US', name: 'États-Unis', flag: '\ud83c\uddfa\ud83c\uddf8', phone: '+1' },
  { code: 'CA', name: 'Canada', flag: '\ud83c\udde8\ud83c\udde6', phone: '+1' },
  { code: 'FR', name: 'France', flag: '\ud83c\uddeb\ud83c\uddf7', phone: '+33' },
  { code: 'DO', name: 'Rép. Dominicaine', flag: '\ud83c\udde9\ud83c\uddf4', phone: '+1' },
  { code: 'BR', name: 'Brésil', flag: '\ud83c\udde7\ud83c\uddf7', phone: '+55' },
  { code: 'CL', name: 'Chili', flag: '\ud83c\udde8\ud83c\uddf1', phone: '+56' },
  { code: 'MX', name: 'Mexique', flag: '\ud83c\uddf2\ud83c\uddfd', phone: '+52' },
  { code: 'BS', name: 'Bahamas', flag: '\ud83c\udde7\ud83c\uddf8', phone: '+1' },
  { code: 'TC', name: 'Îles Turques', flag: '\ud83c\uddf9\ud83c\udde8', phone: '+1' },
  { code: 'GF', name: 'Guyane française', flag: '\ud83c\uddeb\ud83c\uddf7', phone: '+594' },
  { code: 'GP', name: 'Guadeloupe', flag: '\ud83c\uddeb\ud83c\uddf7', phone: '+590' },
  { code: 'MQ', name: 'Martinique', flag: '\ud83c\uddeb\ud83c\uddf7', phone: '+596' },
  // Separator
  { code: '---', name: '───────────', flag: '', phone: '' },
  // Rest of world (alphabetical)
  { code: 'DE', name: 'Allemagne', flag: '\ud83c\udde9\ud83c\uddea', phone: '+49' },
  { code: 'AR', name: 'Argentine', flag: '\ud83c\udde6\ud83c\uddf7', phone: '+54' },
  { code: 'BE', name: 'Belgique', flag: '\ud83c\udde7\ud83c\uddea', phone: '+32' },
  { code: 'BJ', name: 'Bénin', flag: '\ud83c\udde7\ud83c\uddef', phone: '+229' },
  { code: 'CM', name: 'Cameroun', flag: '\ud83c\udde8\ud83c\uddf2', phone: '+237' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '\ud83c\udde8\ud83c\uddee', phone: '+225' },
  { code: 'CO', name: 'Colombie', flag: '\ud83c\udde8\ud83c\uddf4', phone: '+57' },
  { code: 'CU', name: 'Cuba', flag: '\ud83c\udde8\ud83c\uddfa', phone: '+53' },
  { code: 'ES', name: 'Espagne', flag: '\ud83c\uddea\ud83c\uddf8', phone: '+34' },
  { code: 'GB', name: 'Royaume-Uni', flag: '\ud83c\uddec\ud83c\udde7', phone: '+44' },
  { code: 'IT', name: 'Italie', flag: '\ud83c\uddee\ud83c\uddf9', phone: '+39' },
  { code: 'JM', name: 'Jamaïque', flag: '\ud83c\uddef\ud83c\uddf2', phone: '+1' },
  { code: 'JP', name: 'Japon', flag: '\ud83c\uddef\ud83c\uddf5', phone: '+81' },
  { code: 'LB', name: 'Liban', flag: '\ud83c\uddf1\ud83c\udde7', phone: '+961' },
  { code: 'MA', name: 'Maroc', flag: '\ud83c\uddf2\ud83c\udde6', phone: '+212' },
  { code: 'NL', name: 'Pays-Bas', flag: '\ud83c\uddf3\ud83c\uddf1', phone: '+31' },
  { code: 'PE', name: 'Pérou', flag: '\ud83c\uddf5\ud83c\uddea', phone: '+51' },
  { code: 'SN', name: 'Sénégal', flag: '\ud83c\uddf8\ud83c\uddf3', phone: '+221' },
  { code: 'CH', name: 'Suisse', flag: '\ud83c\udde8\ud83c\udded', phone: '+41' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '\ud83c\uddf9\ud83c\uddf9', phone: '+1' },
  { code: 'VE', name: 'Venezuela', flag: '\ud83c\uddfb\ud83c\uddea', phone: '+58' }
];
