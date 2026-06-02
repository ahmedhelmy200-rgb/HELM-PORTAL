import { badayatTemplateGroups } from '@/lib/badayatAlKhairStore'
import {
  BADAYAT_TEMPLATE_DRAFTS_KEY,
  defaultBadayatPrintHeader,
  defaultBadayatTemplateBodies,
} from '@/lib/badayatTemplateEngine'

const VERSION_KEY = 'helm_badayat_portal_template_preset_version'
const RAW = [
  'eyJ2ZXJzaW9uIjoiMjAyNi0wNi0wMi1iYWRheWF0LWVtcGxveW1lbnQtdGVtcGxhdGUtdjEiLCJncm91cE5hbWUiOiLY',
  'p9mE2LnZgtmI2K8g2YjYp9mE2KrYudmK2YrZhiIsIm9yZGVyIjpbIti52YLYryDYudmF2YQg2YXYqNiv2KbZiiIsIti5',
  '2YLYryDYudmF2YQg2LTYp9mF2YQiXSwicHJpbnRIZWFkZXIiOnsiY29tcGFueU5hbWUiOiLYqNiv2KfZitin2Kkg2KfZhNiu2YrYs',
  'SDZhNiq2KzYp9ix2Kkg2KfZhNiz2YrYp9ix2KfYqiDYp9mE2YXZg9iq2LnZhdmE2KkiLCJjb21wYW55TmFtZUVuIjoiQkRBWVQgQUxL',
  'SElSIiwic3VidGl0bGUiOiLZhdmE2LHYtiDYs9mK2KfYsdin2KoiLCJsb2dvVXJsIjoiL2JhZGF5YXQtbG9nby5zdmciLCJhZGRy',
  'ZXNzIjoiNTgg2YXYudix2LYg2KjYr9in2YrYqSDYp9mE2K7Zitix2Iwg2LPZiNmCINiz2YrYp9ix2KfYqiDYp9mE2K3YsdinY',
  'jCDYp9mE2LTYp9ix2YLYqSIsImZvb3Rlck5vdGUiOiLZh9iw2Kcg2KfZhNi52YLZryDYtdinYr9ixINmF2YYgSEVMTSBQb3J0YWwgLS',
  'DZgtiz2YUg2KjYr9in2YrYqSDYp9mE2K7ZitixIC0g2KfZhNmG2YXYp9iw2KwiLCJib2RpZXMiOnsi2LnZgtivINi52YXZhCDZhdio',
  '2K/YptmKIjoi2LnZgtivINi52YXZhCDZhdio2K/YptmKXG5cbuiq2YUg2YfYsNinINin2YTYudmC2K8g2YHZiiDZitmI2YUge3t0',
  'b2RheX19INio2YrZhiDYqNmEINmF2YY6XG5cbtin2YTYt9ix2YEg2KfZhNij2YjZhDorbqNiv2KfZitin2Kkg2KfZhNiu2YrYsSDZhNiq2KzY',
  'p9ix2Kkg2KfZhNiz2YrYp9ix2KfYqiDYp9mE2YXZg9iq2LnZhdmE2Kkg2YjYudinm2YjYp9mG2YfYp9mEIDU4INmF2LHYu',
  'NmGINio2K/Yp9mK2Kkg2KfZhNiu2YrYs2Iwg2LPZiNmCINiz2YrYp9ix2KfYqiDYp9mE2K3YsdinYrCDYp9mE2LTYp9ix2YLY',
  'qSDYp9mE2LTYp9ix2YLYqSIsImZvcm1zIjoiZXhwbG9yZSIsInh4IjoiIn0=' 
].join('')

function decodePayload() {
  const binary = atob(RAW)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return JSON.parse(new TextDecoder('utf-8').decode(bytes))
}

function readDrafts() {
  try { return JSON.parse(localStorage.getItem(BADAYAT_TEMPLATE_DRAFTS_KEY) || '{}') || {} } catch { return {} }
}

export function installBadayatPortalTemplatePreset() {
  const payload = decodePayload()
  Object.assign(defaultBadayatPrintHeader, payload.printHeader || {})
  Object.assign(defaultBadayatTemplateBodies, payload.bodies || {})

  const targetGroup = badayatTemplateGroups.find((group) => group.group === payload.groupName)
  if (targetGroup && Array.isArray(payload.order)) {
    const current = Array.isArray(targetGroup.items) ? targetGroup.items : []
    targetGroup.items = [
      ...payload.order,
      ...current.filter((item) => !payload.order.includes(item)),
    ]
  }

  if (typeof window === 'undefined') return
  try {
    const drafts = readDrafts()
    const version = localStorage.getItem(VERSION_KEY)
    if (version !== payload.version) {
      Object.entries(payload.bodies || {}).forEach(([name, body]) => {
        drafts[name] = body
      })
      localStorage.setItem(BADAYAT_TEMPLATE_DRAFTS_KEY, JSON.stringify(drafts))
      localStorage.setItem(VERSION_KEY, payload.version)
    }
  } catch (error) {
    console.warn('[Badayat templates] preset install failed:', error)
  }
}
