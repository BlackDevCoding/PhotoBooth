import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export type PhotoRecord = {
  id: string
  filename: string
  url: string
  createdAt: string
  filter: string
  mode: 'single' | 'strip'
  width: number
  height: number
  size: number
  originalFilename?: string
  originalUrl?: string
}

export type ContentKey = 'impressum' | 'datenschutz'

export type SlideshowSettings = {
  intervalMs: number
  showOverlays: boolean
  showQr: boolean
}

type DB = {
  photos: PhotoRecord[]
  content: Record<ContentKey, string>
  slideshow: SlideshowSettings
  admin: {
    tokenHash: string | null
    tokenExpiresAt: string | null
  }
}

const DEFAULT_DB: DB = {
  photos: [],
  content: {
    impressum: defaultImpressum(),
    datenschutz: defaultDatenschutz()
  },
  slideshow: {
    intervalMs: 6000,
    showOverlays: true,
    showQr: true
  },
  admin: {
    tokenHash: null,
    tokenExpiresAt: null
  }
}

export async function ensureDirs(storagePath: string) {
  await fs.mkdir(storagePath, { recursive: true })
  await fs.mkdir(join(storagePath, 'photos'), { recursive: true })
}

export function dbPath(storagePath: string) {
  return join(storagePath, 'db.json')
}

export async function loadDb(storagePath: string): Promise<DB> {
  await ensureDirs(storagePath)
  const p = dbPath(storagePath)
  try {
    const raw = await fs.readFile(p, 'utf8')
    const parsed = JSON.parse(raw) as DB
    return { ...DEFAULT_DB, ...parsed, content: { ...DEFAULT_DB.content, ...parsed.content }, slideshow: { ...DEFAULT_DB.slideshow, ...parsed.slideshow }, admin: { ...DEFAULT_DB.admin, ...parsed.admin } }
  } catch {
    await saveDb(storagePath, DEFAULT_DB)
    return structuredClone(DEFAULT_DB)
  }
}

export async function saveDb(storagePath: string, db: DB) {
  await ensureDirs(storagePath)
  await fs.writeFile(dbPath(storagePath), JSON.stringify(db, null, 2), 'utf8')
}

export function photosDir(storagePath: string) {
  return join(storagePath, 'photos')
}

function defaultImpressum() {
  return `# Impressum (Vorlage)\n\n**Angaben gemäß § 5 TMG**\n\n[Name/Firma]\n[Adresse]\n[PLZ Ort]\n\n**Kontakt**\n- E-Mail: [E-Mail]\n- Telefon: [Telefon]\n\n**Umsatzsteuer**\nUSt-IdNr.: [USt-IdNr.]\n\n**Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV**\n[Name]\n[Adresse]\n\n## Haftungshinweise (kurz)\nDiese Vorlage ersetzt keine Rechtsberatung. Bitte prüfen und anpassen.`
}

function defaultDatenschutz() {
  return `# Datenschutzerklärung (Vorlage)\n\nDiese Vorlage ersetzt keine Rechtsberatung. Bitte prüfen und anpassen.\n\n## Zweck der Website\nDiese Website dient als Fotoautomaten ("Photobooth") zur Aufnahme, Vorschau und Speicherung von Fotos.\n\n## Welche Daten werden verarbeitet?\n- **Fotos** (Upload vom Gerät nach Aufnahme)\n- **Zeitpunkt der Aufnahme** (Timestamp)\n- **Technische Metadaten**: IP-Adresse in Server-Logs (üblich), ggf. User-Agent.\n\n## Rechtsgrundlage (Hinweis)\nJe nach Einsatz kann die Verarbeitung auf **Einwilligung** (Art. 6 Abs. 1 lit. a DSGVO) oder **berechtigtem Interesse** (Art. 6 Abs. 1 lit. f DSGVO) beruhen. Bitte juristisch prüfen.\n\n## Speicherdauer / Löschung\nFotos werden gespeichert, bis sie über die Admin-Oberfläche gelöscht werden (Einzel- oder Komplettlöschung) oder bis ein definierter Zeitraum abläuft (falls Sie dies konfigurieren).\n\n## Empfänger / Hosting\nDie Daten werden auf dem Server gespeichert, auf dem diese Anwendung betrieben wird. Es erfolgt keine Weitergabe an Dritte, sofern nicht technisch erforderlich (z. B. Hosting-Provider).\n\n## Ihre Rechte\nSie haben je nach Situation Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch.\n\n## Kontakt\n[Name/Firma]\n[E-Mail]\n[Adresse]`}
