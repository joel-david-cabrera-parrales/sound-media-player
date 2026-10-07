import type { Track } from './track.model';

/** Un género canónico de la taxonomía (promovida desde shared/mocks). */
export interface GenreEntry {
  id: string;
  es: string;
  en: string;
  synonyms: string[];
}

/** Cajón para tags sin match en la taxonomía ("Varios" / "Miscellaneous"). */
export const OTHER_GENRE_ID = 'miscellaneous';

/** Imagen por defecto para géneros sin carátula (incluye Otros). */
export const DEFAULT_GENRE_COVER = '/images/genre-default.svg';

export const GENRE_TAXONOMY: GenreEntry[] = [
  { id: "miscellaneous", es: "Varios", en: "Miscellaneous", synonyms: ["Varios"] },
  { id: "gregorian-chant", es: "Canto Gregoriano", en: "Gregorian Chant", synonyms: ["Canto llano", "Monofonía medieval sacra"] },
  { id: "medieval-music", es: "Música Medieval", en: "Medieval Music", synonyms: ["Ars antiqua", "Ars nova"] },
  { id: "renaissance-music", es: "Música Renacentista", en: "Renaissance Music", synonyms: ["Polifonía renacentista"] },
  { id: "baroque-music", es: "Música Barroca", en: "Baroque Music", synonyms: ["Barroco musical"] },
  { id: "classical-period", es: "Clasicismo", en: "Classical Period", synonyms: ["Música clásica clásica", "Estilo galante"] },
  { id: "romantic-music", es: "Romanticismo", en: "Romantic Music", synonyms: ["Música romántica"] },
  { id: "impressionist-music", es: "Impresionismo Musical", en: "Impressionist Music", synonyms: ["Impresionismo"] },
  { id: "serialism", es: "Serialismo", en: "Serialism", synonyms: ["Dodecafonismo", "Música serial"] },
  { id: "minimal-music", es: "Minimalismo Clásico", en: "Minimal Music", synonyms: ["Música minimalista"] },
  { id: "musique-concrete", es: "Música Concreta", en: "Musique Concrète", synonyms: ["Electroacústica académica"] },
  { id: "neoclassicism", es: "Neoclasicismo", en: "Neoclassicism", synonyms: ["Neoclasicismo musical"] },
  { id: "contemporary-classical-music", es: "Música Clásica Contemporánea", en: "Contemporary Classical Music", synonyms: ["Música académica contemporánea", "Vanguardia musical"] },
  { id: "delta-blues", es: "Delta Blues", en: "Delta Blues", synonyms: ["Country blues tradicional"] },
  { id: "chicago-blues", es: "Chicago Blues", en: "Chicago Blues", synonyms: ["Electric blues urbano"] },
  { id: "country-blues", es: "Country Blues", en: "Country Blues", synonyms: ["Folk blues"] },
  { id: "electric-blues", es: "Electric Blues", en: "Electric Blues", synonyms: ["Blues eléctrico"] },
  { id: "jump-blues", es: "Jump Blues", en: "Jump Blues", synonyms: ["Pre-R&B"] },
  { id: "rhythm-and-blues", es: "Rhythm and Blues", en: "Rhythm and Blues", synonyms: ["R&B tradicional", "R&B clásico"] },
  { id: "contemporary-randb", es: "R&B Contemporáneo", en: "Contemporary R&B", synonyms: ["R&B moderno", "Urban pop"] },
  { id: "ragtime", es: "Ragtime", en: "Ragtime", synonyms: ["Piano rag"] },
  { id: "dixieland", es: "Dixieland", en: "Dixieland", synonyms: ["New Orleans Jazz", "Early Jazz"] },
  { id: "swing", es: "Swing", en: "Swing", synonyms: ["Big Band Jazz"] },
  { id: "bebop", es: "Bebop", en: "Bebop", synonyms: ["Bop"] },
  { id: "hard-bop", es: "Hard Bop", en: "Hard Bop", synonyms: ["Soul Jazz"] },
  { id: "cool-jazz", es: "Cool Jazz", en: "Cool Jazz", synonyms: ["West Coast Jazz"] },
  { id: "free-jazz", es: "Free Jazz", en: "Free Jazz", synonyms: ["Avant-garde Jazz"] },
  { id: "jazz-fusion", es: "Jazz Fusión", en: "Jazz Fusion", synonyms: ["Jazz Rock"] },
  { id: "smooth-jazz", es: "Smooth Jazz", en: "Smooth Jazz", synonyms: ["Pop Jazz", "Contemporary Jazz"] },
  { id: "modal-jazz", es: "Jazz Modal", en: "Modal Jazz", synonyms: ["Jazz modal"] },
  { id: "nu-jazz", es: "Nu Jazz", en: "Nu Jazz", synonyms: ["Jazztronica", "Electro-Jazz"] },
  { id: "gypsy-jazz", es: "Gypsy Jazz", en: "Gypsy Jazz", synonyms: ["Jazz manouche"] },
  { id: "latin-jazz", es: "Jazz Latino", en: "Latin Jazz", synonyms: ["Afro-Cuban Jazz"] },
  { id: "soul", es: "Soul", en: "Soul", synonyms: ["Motown Sound", "Soul clásico"] },
  { id: "neo-soul", es: "Neo-Soul", en: "Neo-Soul", synonyms: ["Alternative R&B"] },
  { id: "northern-soul", es: "Northern Soul", en: "Northern Soul", synonyms: ["Uptempo soul"] },
  { id: "psychedelic-soul", es: "Soul Psicodélico", en: "Psychedelic Soul", synonyms: ["Black rock"] },
  { id: "funk", es: "Funk", en: "Funk", synonyms: ["Funk clásico"] },
  { id: "p-funk", es: "P-Funk", en: "P-Funk", synonyms: ["Parliament-Funkadelic", "Psychedelic funk"] },
  { id: "g-funk", es: "G-Funk", en: "G-Funk", synonyms: ["Gangsta Funk"] },
  { id: "go-go", es: "Go-Go", en: "Go-Go", synonyms: ["Washington Go-Go"] },
  { id: "disco", es: "Música Disco", en: "Disco", synonyms: ["Disco"] },
  { id: "rock-and-roll", es: "Rock and Roll", en: "Rock and Roll", synonyms: ["Rock n' Roll", "Classic Rock & Roll"] },
  { id: "rockabilly", es: "Rockabilly", en: "Rockabilly", synonyms: ["Hillbilly rock"] },
  { id: "surf-rock", es: "Surf Rock", en: "Surf Rock", synonyms: ["Surf music"] },
  { id: "garage-rock", es: "Garage Rock", en: "Garage Rock", synonyms: ["Garage punk"] },
  { id: "psychedelic-rock", es: "Rock Psicodélico", en: "Psychedelic Rock", synonyms: ["Acid rock"] },
  { id: "hard-rock", es: "Hard Rock", en: "Hard Rock", synonyms: ["Rock pesado"] },
  { id: "progressive-rock", es: "Rock Progresivo", en: "Progressive Rock", synonyms: ["Prog rock"] },
  { id: "glam-rock", es: "Glam Rock", en: "Glam Rock", synonyms: ["Glitter rock"] },
  { id: "soft-rock", es: "Soft Rock", en: "Soft Rock", synonyms: ["Light rock", "AOR"] },
  { id: "arena-rock", es: "Arena Rock", en: "Arena Rock", synonyms: ["Stadium rock"] },
  { id: "krautrock", es: "Krautrock", en: "Krautrock", synonyms: ["Kosmische Musik"] },
  { id: "pub-rock", es: "Pub Rock", en: "Pub Rock", synonyms: ["Roots rock británico"] },
  { id: "pop-rock", es: "Pop Rock", en: "Pop Rock", synonyms: ["Rock pop"] },
  { id: "folk-rock", es: "Folk Rock", en: "Folk Rock", synonyms: ["Folk eléctrico"] },
  { id: "southern-rock", es: "Rock Sureño", en: "Southern Rock", synonyms: ["Southern rock"] },
  { id: "proto-punk", es: "Proto-Punk", en: "Proto-Punk", synonyms: ["Pre-punk"] },
  { id: "punk-rock", es: "Punk Rock", en: "Punk Rock", synonyms: ["Punk 77"] },
  { id: "hardcore-punk", es: "Hardcore Punk", en: "Hardcore Punk", synonyms: ["Hardcore"] },
  { id: "post-punk", es: "Post-Punk", en: "Post-Punk", synonyms: ["Art punk"] },
  { id: "pop-punk", es: "Pop Punk", en: "Pop Punk", synonyms: ["Neon punk", "Punk pop"] },
  { id: "ska-punk", es: "Ska Punk", en: "Ska Punk", synonyms: ["Skacore"] },
  { id: "anarcho-punk", es: "Anarcopunk", en: "Anarcho-Punk", synonyms: ["Anarchist punk"] },
  { id: "skate-punk", es: "Skate Punk", en: "Skate Punk", synonyms: ["Skatecore"] },
  { id: "crust-punk", es: "Crust Punk", en: "Crust Punk", synonyms: ["Crustcore"] },
  { id: "emo", es: "Emo", en: "Emo", synonyms: ["Emotional hardcore"] },
  { id: "screamo", es: "Screamo", en: "Screamo", synonyms: ["Skramz"] },
  { id: "grunge", es: "Grunge", en: "Grunge", synonyms: ["Seattle sound"] },
  { id: "indie-rock", es: "Rock Independiente", en: "Indie Rock", synonyms: ["Indie rock"] },
  { id: "post-rock", es: "Post-Rock", en: "Post-Rock", synonyms: ["Ambient rock"] },
  { id: "shoegaze", es: "Shoegaze", en: "Shoegaze", synonyms: ["Dream pop pesado"] },
  { id: "britpop", es: "Britpop", en: "Britpop", synonyms: ["Pop rock británico noventero"] },
  { id: "noise-rock", es: "Noise Rock", en: "Noise Rock", synonyms: ["Noise pop"] },
  { id: "math-rock", es: "Math Rock", en: "Math Rock", synonyms: ["Math rock instrumental"] },
  { id: "gothic-rock", es: "Rock Gótico", en: "Gothic Rock", synonyms: ["Goth rock", "Darkwave rock"] },
  { id: "heavy-metal", es: "Heavy Metal", en: "Heavy Metal", synonyms: ["Metal clásico", "NWOBHM"] },
  { id: "speed-metal", es: "Speed Metal", en: "Speed Metal", synonyms: ["Fast metal"] },
  { id: "thrash-metal", es: "Thrash Metal", en: "Thrash Metal", synonyms: ["Thrash"] },
  { id: "death-metal", es: "Death Metal", en: "Death Metal", synonyms: ["DM"] },
  { id: "black-metal", es: "Black Metal", en: "Black Metal", synonyms: ["BM", "First wave black metal"] },
  { id: "power-metal", es: "Power Metal", en: "Power Metal", synonyms: ["Euro-power", "Melodic metal"] },
  { id: "doom-metal", es: "Doom Metal", en: "Doom Metal", synonyms: ["Doom"] },
  { id: "progressive-metal", es: "Metal Progresivo", en: "Progressive Metal", synonyms: ["Prog metal"] },
  { id: "nu-metal", es: "Nu Metal", en: "Nu Metal", synonyms: ["Aggro metal", "Alt-metal"] },
  { id: "metalcore", es: "Metalcore", en: "Metalcore", synonyms: ["Hardcore metal"] },
  { id: "deathcore", es: "Deathcore", en: "Deathcore", synonyms: ["Death metal hardcore"] },
  { id: "sludge-metal", es: "Sludge Metal", en: "Sludge Metal", synonyms: ["Sludge doom"] },
  { id: "symphonic-metal", es: "Metal Sinfónico", en: "Symphonic Metal", synonyms: ["Symphonic metal"] },
  { id: "folk-metal", es: "Folk Metal", en: "Folk Metal", synonyms: ["Pagan metal"] },
  { id: "industrial-metal", es: "Metal Industrial", en: "Industrial Metal", synonyms: ["Cyber metal"] },
  { id: "groove-metal", es: "Groove Metal", en: "Groove Metal", synonyms: ["Post-thrash"] },
  { id: "stoner-metal", es: "Stoner Metal", en: "Stoner Metal", synonyms: ["Stoner rock", "Desert rock"] },
  { id: "dance-pop", es: "Dance-Pop", en: "Dance-Pop", synonyms: ["Pop bailable"] },
  { id: "synth-pop", es: "Synthpop", en: "Synth-pop", synonyms: ["Techno-pop"] },
  { id: "electropop", es: "Electropop", en: "Electropop", synonyms: ["Pop electrónico"] },
  { id: "teen-pop", es: "Teen Pop", en: "Teen Pop", synonyms: ["Bubblegum pop"] },
  { id: "art-pop", es: "Art Pop", en: "Art Pop", synonyms: ["Avant-pop"] },
  { id: "dream-pop", es: "Dream Pop", en: "Dream Pop", synonyms: ["Pop atmosférico"] },
  { id: "indie-pop", es: "Indie Pop", en: "Indie Pop", synonyms: ["Twee pop"] },
  { id: "k-pop", es: "Pop Coreano", en: "K-Pop", synonyms: ["K-Pop"] },
  { id: "j-pop", es: "Pop Japonés", en: "J-Pop", synonyms: ["J-Pop"] },
  { id: "c-pop", es: "Pop Chino", en: "C-Pop", synonyms: ["Mandopop", "Cantopop"] },
  { id: "europop", es: "Europop", en: "Europop", synonyms: ["Pop europeo"] },
  { id: "latin-pop", es: "Pop Latino", en: "Latin Pop", synonyms: ["Latin pop"] },
  { id: "old-school-hip-hop", es: "Hip-Hop Clásico", en: "Old School Hip-Hop", synonyms: ["Rap clásico"] },
  { id: "east-coast-hip-hop", es: "Rap de la Costa Este", en: "East Coast Hip-Hop", synonyms: ["New York hip-hop"] },
  { id: "west-coast-hip-hop", es: "Rap de la Costa Oeste", en: "West Coast Hip-Hop", synonyms: ["California hip-hop"] },
  { id: "gangsta-rap", es: "Gangsta Rap", en: "Gangsta Rap", synonyms: ["Reality rap"] },
  { id: "conscious-hip-hop", es: "Rap Consciente", en: "Conscious Hip-Hop", synonyms: ["Political hip-hop"] },
  { id: "boom-bap", es: "Boom Bap", en: "Boom Bap", synonyms: ["90s Hip-hop"] },
  { id: "trap-music", es: "Trap", en: "Trap Music", synonyms: ["Atlanta trap"] },
  { id: "drill-music", es: "Drill", en: "Drill Music", synonyms: ["Chicago drill", "UK drill", "Brooklyn drill"] },
  { id: "grime", es: "Grime", en: "Grime", synonyms: ["UK grime"] },
  { id: "crunk", es: "Crunk", en: "Crunk", synonyms: ["Dirty South crunk"] },
  { id: "cloud-rap", es: "Cloud Rap", en: "Cloud Rap", synonyms: ["Vapor rap"] },
  { id: "lo-fi-hip-hop", es: "Lo-Fi Hip-Hop", en: "Lo-Fi Hip-Hop", synonyms: ["Chillhop", "Lo-fi beats"] },
  { id: "instrumental-hip-hop", es: "Hip-Hop Instrumental", en: "Instrumental Hip-Hop", synonyms: ["Abstract hip-hop"] },
  { id: "reggaeton", es: "Reguetón", en: "Reggaeton", synonyms: ["Reggaeton", "Neoperreo"] },
  { id: "latin-trap", es: "Trap Latino", en: "Latin Trap", synonyms: ["Spanish trap"] },
  { id: "dembow", es: "Dembow", en: "Dembow", synonyms: ["Dembow dominicano"] },
  { id: "deep-house", es: "Deep House", en: "Deep House", synonyms: ["Soulful house"] },
  { id: "tech-house", es: "Tech House", en: "Tech House", synonyms: ["Techno house"] },
  { id: "progressive-house", es: "Progressive House", en: "Progressive House", synonyms: ["Prog house"] },
  { id: "electro-house", es: "Electro House", en: "Electro House", synonyms: ["Complextro"] },
  { id: "acid-house", es: "Acid House", en: "Acid House", synonyms: ["303 sound"] },
  { id: "tropical-house", es: "Tropical House", en: "Tropical House", synonyms: ["Trop house"] },
  { id: "future-house", es: "Future House", en: "Future House", synonyms: ["Future bounce"] },
  { id: "afro-house", es: "Afro House", en: "Afro House", synonyms: ["Tribal house africano"] },
  { id: "amapiano", es: "Amapiano", en: "Amapiano", synonyms: ["South African house"] },
  { id: "detroit-techno", es: "Detroit Techno", en: "Detroit Techno", synonyms: ["Techno clásico"] },
  { id: "minimal-techno", es: "Minimal Techno", en: "Minimal Techno", synonyms: ["Minimal"] },
  { id: "industrial-techno", es: "Techno Industrial", en: "Industrial Techno", synonyms: ["Hard techno industrial"] },
  { id: "acid-techno", es: "Acid Techno", en: "Acid Techno", synonyms: ["Acid EDM"] },
  { id: "hard-techno", es: "Hard Techno", en: "Hard Techno", synonyms: ["Schranz"] },
  { id: "dub-techno", es: "Dub Techno", en: "Dub Techno", synonyms: ["Echo techno"] },
  { id: "psytrance", es: "Psytrance", en: "Psytrance", synonyms: ["Goa trance", "Psychedelic trance"] },
  { id: "progressive-trance", es: "Progressive Trance", en: "Progressive Trance", synonyms: ["Prog trance"] },
  { id: "uplifting-trance", es: "Uplifting Trance", en: "Uplifting Trance", synonyms: ["Melodic trance"] },
  { id: "drum-and-bass", es: "Drum and Bass", en: "Drum and Bass", synonyms: ["DnB", "Drum 'n' bass"] },
  { id: "jungle", es: "Jungle", en: "Jungle", synonyms: ["Ragga jungle"] },
  { id: "dubstep", es: "Dubstep", en: "Dubstep", synonyms: ["UK dubstep", "Brostep"] },
  { id: "uk-garage", es: "UK Garage", en: "UK Garage", synonyms: ["UKG", "2-step"] },
  { id: "breakbeat", es: "Breakbeat", en: "Breakbeat", synonyms: ["Breaks"] },
  { id: "hardstyle", es: "Hardstyle", en: "Hardstyle", synonyms: ["Hard dance"] },
  { id: "gabber", es: "Gabber", en: "Gabber", synonyms: ["Hardcore techno"] },
  { id: "ambient-music", es: "Ambient", en: "Ambient Music", synonyms: ["Música ambiental"] },
  { id: "idm", es: "IDM", en: "IDM", synonyms: ["Intelligent Dance Music", "Braindance"] },
  { id: "downtempo", es: "Downtempo", en: "Downtempo", synonyms: ["Chillout"] },
  { id: "trip-hop", es: "Trip-Hop", en: "Trip-Hop", synonyms: ["Bristol sound"] },
  { id: "synthwave", es: "Synthwave", en: "Synthwave", synonyms: ["Retrowave", "Outrun"] },
  { id: "vaporwave", es: "Vaporwave", en: "Vaporwave", synonyms: ["Mallsoft"] },
  { id: "hyperpop", es: "Hyperpop", en: "Hyperpop", synonyms: ["Digicore"] },
  { id: "chiptune", es: "Chiptune", en: "Chiptune", synonyms: ["8-bit", "Nintendocore"] },
  { id: "electronic-body-music", es: "EBM", en: "Electronic Body Music", synonyms: ["Industrial dance"] },
  { id: "mento", es: "Mento", en: "Mento", synonyms: ["Acoustic reggae precursor"] },
  { id: "ska", es: "Ska", en: "Ska", synonyms: ["First wave ska"] },
  { id: "rocksteady", es: "Rocksteady", en: "Rocksteady", synonyms: ["Pre-reggae"] },
  { id: "roots-reggae", es: "Reggae Roots", en: "Roots Reggae", synonyms: ["Roots reggae"] },
  { id: "dub", es: "Dub", en: "Dub", synonyms: ["Reggae dub"] },
  { id: "dancehall", es: "Dancehall", en: "Dancehall", synonyms: ["Ragga"] },
  { id: "calypso", es: "Calipso", en: "Calypso", synonyms: ["Trinidadian calypso"] },
  { id: "soca", es: "Soca", en: "Soca", synonyms: ["Soul calypso"] },
  { id: "salsa", es: "Salsa", en: "Salsa", synonyms: ["Salsa dura", "Salsa romántica"] },
  { id: "cuban-son", es: "Son Cubano", en: "Cuban Son", synonyms: ["Son tradicional"] },
  { id: "mambo", es: "Mambo", en: "Mambo", synonyms: ["Mambo afro-cubano"] },
  { id: "cha-cha-cha", es: "Cha-cha-chá", en: "Cha-cha-chá", synonyms: ["Chachachá"] },
  { id: "bolero", es: "Bolero", en: "Bolero", synonyms: ["Bolero latino"] },
  { id: "bachata", es: "Bachata", en: "Bachata", synonyms: ["Bachata dominicana"] },
  { id: "merengue", es: "Merengue", en: "Merengue", synonyms: ["Merengue dominicano"] },
  { id: "cumbia", es: "Cumbia", en: "Cumbia", synonyms: ["Cumbia colombiana", "Cumbia argentina", "Cumbia mexicana"] },
  { id: "ranchera", es: "Ranchera", en: "Ranchera", synonyms: ["Música ranchera"] },
  { id: "corrido", es: "Corrido", en: "Corrido", synonyms: ["Corridos tumbados", "Corridos bélicos"] },
  { id: "banda-music", es: "Banda Sinaloense", en: "Banda Music", synonyms: ["Música de banda"] },
  { id: "norteno", es: "Norteño", en: "Norteño", synonyms: ["Música norteña"] },
  { id: "mariachi", es: "Mariachi", en: "Mariachi", synonyms: ["Son jalisciense"] },
  { id: "vallenato", es: "Vallenato", en: "Vallenato", synonyms: ["Música vallenata"] },
  { id: "tango", es: "Tango", en: "Tango", synonyms: ["Tango rioplatense", "Milonga"] },
  { id: "samba", es: "Samba", en: "Samba", synonyms: ["Samba de roda", "Samba enredo"] },
  { id: "bossa-nova", es: "Bossa Nova", en: "Bossa Nova", synonyms: ["Bossa"] },
  { id: "forro", es: "Forró", en: "Forró", synonyms: ["Baião"] },
  { id: "funk-carioca", es: "Funk Carioca", en: "Funk Carioca", synonyms: ["Baile funk", "Brazilian funk"] },
  { id: "flamenco", es: "Flamenco", en: "Flamenco", synonyms: ["Cante jondo", "Rumba flamenca"] },
  { id: "traditional-country", es: "Country Tradicional", en: "Traditional Country", synonyms: ["Classic country"] },
  { id: "bluegrass", es: "Bluegrass", en: "Bluegrass", synonyms: ["High lonesome sound"] },
  { id: "honky-tonk", es: "Honky Tonk", en: "Honky Tonk", synonyms: ["Hillbilly music"] },
  { id: "outlaw-country", es: "Outlaw Country", en: "Outlaw Country", synonyms: ["Country outlaw"] },
  { id: "country-pop", es: "Country Pop", en: "Country Pop", synonyms: ["Commercial country"] },
  { id: "americana", es: "Americana", en: "Americana", synonyms: ["Roots music"] },
  { id: "traditional-folk", es: "Folk Tradicional", en: "Traditional Folk", synonyms: ["Música folclórica"] },
  { id: "indie-folk", es: "Indie Folk", en: "Indie Folk", synonyms: ["Folk alternativo"] },
  { id: "neofolk", es: "Neofolk", en: "Neofolk", synonyms: ["Apocalyptic folk"] },
  // Paraguas: tags ID3 de una sola palabra que no tienen entrada propia.
  // Van al final para que las entradas específicas ganen por primer match.
  { id: "rock", es: "Rock", en: "Rock", synonyms: ["Rock music", "Música rock"] },
  { id: "pop", es: "Pop", en: "Pop", synonyms: ["Pop music", "Música pop"] },
  { id: "hip-hop", es: "Hip Hop", en: "Hip Hop", synonyms: ["HipHop", "Rap", "Hip hop music", "Música hip hop"] },
  { id: "rnb", es: "R&B", en: "R&B", synonyms: ["RnB", "RNB", "R&B music"] },
  { id: "jazz", es: "Jazz", en: "Jazz", synonyms: ["Jazz music", "Música jazz"] },
  { id: "metal", es: "Metal", en: "Metal", synonyms: ["Metal music", "Música metal"] },
  { id: "punk", es: "Punk", en: "Punk", synonyms: ["Punk music", "Música punk"] },
  { id: "indie", es: "Indie", en: "Indie", synonyms: ["Indie music", "Música indie", "Música independiente"] },
  { id: "alternative-rock", es: "Rock Alternativo", en: "Alternative Rock", synonyms: ["Alternative", "Alt Rock", "Rock alternativo", "Alternativo"] },
  { id: "electronic", es: "Electrónica", en: "Electronic", synonyms: ["Electronic music", "Música electrónica", "Electronica", "EDM", "Dance", "Música dance", "Techno", "Tecno"] },
  { id: "classical", es: "Música Clásica", en: "Classical Music", synonyms: ["Classical", "Música clásica", "Clásica", "Opera", "Ópera"] },
  { id: "country", es: "Country", en: "Country", synonyms: ["Country music", "Música country"] },
  { id: "folk", es: "Folk", en: "Folk", synonyms: ["Folk music", "Música folk"] },
  { id: "blues", es: "Blues", en: "Blues", synonyms: ["Blues music", "Música blues"] },
];

const GENRE_IDS = new Set(GENRE_TAXONOMY.map((g) => g.id));

export function isGenreId(id: unknown): id is string {
  return typeof id === 'string' && GENRE_IDS.has(id);
}

function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function keysOf(name: string): string[] {
  const n = norm(name);
  const compact = n.replace(/ /g, '');
  return compact === n ? [n] : [n, compact];
}

/** Índice normalizado (nombre es/en + sinónimos, con y sin espacios) -> id. */
const GENRE_INDEX = new Map<string, string>();
for (const entry of GENRE_TAXONOMY) {
  for (const name of [entry.es, entry.en, ...entry.synonyms]) {
    for (const key of keysOf(name)) {
      if (key && !GENRE_INDEX.has(key)) GENRE_INDEX.set(key, entry.id);
    }
  }
}

function matchOne(part: string): string | null {
  const cleaned = part
    .replace(/^\s*\(\d+\)\s*/, '')
    .replace(/^\s*\d+\s*[-–—:]\s*/, '');
  for (const key of keysOf(cleaned)) {
    const hit = GENRE_INDEX.get(key);
    if (hit) return hit;
  }
  return null;
}

function splitRaw(raw: unknown): string[] {
  const items = Array.isArray(raw) ? raw : [raw];
  const parts: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;
    for (const p of item.split(/[\\/;,|]+/)) {
      const t = p.trim();
      if (t && parts.length < 8) parts.push(t);
    }
  }
  return parts;
}

/**
 * Normaliza el/los géneros de un tag ID3 a ids canónicos.
 * Sin match en ninguna parte -> [OTHER_GENRE_ID]. Nunca devuelve vacío.
 */
export function matchGenres(raw: unknown): string[] {
  const ids: string[] = [];
  for (const part of splitRaw(raw)) {
    const id = matchOne(part);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.length > 0 ? ids : [OTHER_GENRE_ID];
}

/** Etiqueta del género en el idioma actual (fallback al id). */
export function genreLabel(id: string, lang: string): string {
  const entry = GENRE_TAXONOMY.find((g) => g.id === id);
  if (!entry) return id;
  return lang.startsWith('en') ? entry.en : entry.es;
}

/** Aplica match a un track: fija genreIds[] + genreId primario. */
export function withMatchedGenres<T extends Pick<Track, 'genre'>>(track: T): T & {
  genreId: string;
  genreIds: string[];
} {
  const ids = matchGenres(track.genre);
  return { ...track, genreIds: ids, genreId: ids[0] };
}
