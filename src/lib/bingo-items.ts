const universal = [
  // Animals
  'Amsel',
  'Blesshuhn',
  'Ente',
  'Fisch',
  'Graureiher',
  'Hund',
  'Ratte',
  'Taube',
  // People
  'Banksitzer',
  'Fotograf',
  'Glatze',
  'Händchenhalter',
  'Raucher',
  'Schaukler',
  'Schwangere',
  'Selbe Person erneut',
  'Senior',
  'Telefonierer',
  'Zopf',
  // Sport
  'Fußballspieler',
  'Minigolfer',
  'Läufer',
  'Radfahrer',
  'Rollerfahrer',
  'Tischtennisspieler',
  // Things
  '2er-Kinderwagen',
  'Babytrage',
  'Buch',
  'Flugzeug',
  'Getränk',
  'Helm',
  'Hubschrauber',
  'Over-Ears',
  'Rollstuhl',
  'Rucksack',
];
const spring: string[] = ['Biene'];
const summer: string[] = [
  'Eichhörnchen',
  'Badminton',
  'Frisbee',
  'Spikeball',
  'Campingstuhl',
  'Grill',
  'Picknick',
  'Regenbogen',
  'Schachspieler',
  'Schmetterling',
  'Wespe',
  'Wikinger Schach',
];
const autumn: string[] = ['Kastanie', 'Regenschirm', 'Fallendes Blatt'];
const winter: string[] = ['Mütze, Handschuhe', 'Schneeflocke', 'Schneemann'];

function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function getBingoItems(): string[] {
  const seasonMap = { spring, summer, autumn, winter };
  return [...universal, ...seasonMap[getSeason()]];
}
