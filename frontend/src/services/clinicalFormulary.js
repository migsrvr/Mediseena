// Reference strengths for extraction/review, not a patient-specific dosing recommendation.
// Initial entries follow the approved project formulary; lists are not exhaustive.
export const COMMON_FORMULARY = Object.freeze(Object.fromEntries(Object.entries({
  amoxicillin: { strengths: ['250mg', '500mg', '125mg/5mL', '250mg/5mL'], defaultRoute: 'Oral' },
  paracetamol: { strengths: ['500mg', '650mg', '120mg/5mL', '250mg/5mL', '100mg/mL'], defaultRoute: 'Oral' },
  mefenamic: { strengths: ['250mg', '500mg', '50mg/5mL'], defaultRoute: 'Oral' },
  cefalexin: { strengths: ['250mg', '500mg', '125mg/5mL', '250mg/5mL'], defaultRoute: 'Oral' },
  coamoxiclav: { strengths: ['625mg', '1g', '228.5mg/5mL', '457mg/5mL'], defaultRoute: 'Oral' },
  ibuprofen: { strengths: ['200mg', '400mg', '100mg/5mL', '200mg/5mL'], defaultRoute: 'Oral' },
  losartan: { strengths: ['50mg', '100mg'], defaultRoute: 'Oral' },
  amlodipine: { strengths: ['5mg', '10mg'], defaultRoute: 'Oral' },
  metformin: { strengths: ['500mg', '850mg', '1000mg'], defaultRoute: 'Oral' },
  cetirizine: { strengths: ['10mg', '5mg/5mL', '2.5mg/mL'], defaultRoute: 'Oral' },
  salbutamol: { strengths: ['2mg', '4mg', '2mg/5mL', '100mcg/puff'], defaultRoute: 'Inhalation/Oral' },
  azithromycin: { strengths: ['250mg', '500mg', '200mg/5mL'], defaultRoute: 'Oral' },
  ciprofloxacin: { strengths: ['250mg', '500mg'], defaultRoute: 'Oral' },
  omeprazole: { strengths: ['20mg', '40mg'], defaultRoute: 'Oral' },
  pantoprazole: { strengths: ['20mg', '40mg'], defaultRoute: 'Oral' },
  clopidogrel: { strengths: ['75mg'], defaultRoute: 'Oral' },
  atorvastatin: { strengths: ['10mg', '20mg', '40mg', '80mg'], defaultRoute: 'Oral' },
  clindamycin: { strengths: ['150mg', '300mg', '75mg/5mL'], defaultRoute: 'Oral' },
  doxycycline: { strengths: ['100mg'], defaultRoute: 'Oral' },
  prednisone: { strengths: ['5mg', '10mg', '20mg'], defaultRoute: 'Oral' },
}).map(([name, entry]) => [name, Object.freeze({ ...entry, strengths: Object.freeze(entry.strengths) })])))

const aliases = Object.freeze({
  biogesic: 'paracetamol', amoxil: 'amoxicillin', augmentin: 'coamoxiclav',
  ponstan: 'mefenamic', keflex: 'cefalexin', ventolin: 'salbutamol',
  zithromax: 'azithromycin', lipitor: 'atorvastatin', plavix: 'clopidogrel',
  mefenamicacid: 'mefenamic', acetaminophen: 'paracetamol', cephalexin: 'cefalexin',
  amoxicillintrihydrate: 'amoxicillin', amlodipinebesylate: 'amlodipine',
})

export function lookupFormulary(name) {
  const notFound = () => ({ found: false, strengths: [], defaultRoute: '', genericName: '' })
  if (typeof name !== 'string' || !name.trim()) return notFound()
  // Resolve exact normalized names and explicit parenthetical generics; avoid substring matches.
  const parts = [name.replace(/\([^)]*\)/g, ' '), ...Array.from(name.matchAll(/\(([^)]+)\)/g), match => match[1])]
  const matches = new Set(parts.map(part => {
    const key = part.normalize('NFKC').toLowerCase().replace(/[\s.\-‐‑–—]/g, '')
    return Object.hasOwn(COMMON_FORMULARY, key) ? key : Object.hasOwn(aliases, key) ? aliases[key] : ''
  }).filter(Boolean))
  if (matches.size !== 1) return notFound()
  const genericName = [...matches][0]
  const entry = COMMON_FORMULARY[genericName]
  return { found: true, strengths: [...entry.strengths], defaultRoute: entry.defaultRoute, genericName }
}
