import { base44 } from '@/api/base44Client'
import { isMissingCaseResultSchema, stripCaseResultFields } from '@/lib/caseResultSchema'

const INSTALL_FLAG = Symbol.for('helm.case-result-schema-fallback')

function wrapPayloadMethod(entity, methodName, payloadIndex) {
  const original = entity?.[methodName]
  if (typeof original !== 'function') return

  entity[methodName] = async (...args) => {
    try {
      return await original.apply(entity, args)
    } catch (error) {
      if (!isMissingCaseResultSchema(error)) throw error
      const payload = args[payloadIndex]
      args[payloadIndex] = stripCaseResultFields(payload)
      console.warn(`[HELM] Retrying Case.${methodName} without result fields until migration 026 is applied.`)
      return original.apply(entity, args)
    }
  }
}

function wrapBulkPayloadMethod(entity, methodName, payloadIndex) {
  const original = entity?.[methodName]
  if (typeof original !== 'function') return

  entity[methodName] = async (...args) => {
    try {
      return await original.apply(entity, args)
    } catch (error) {
      if (!isMissingCaseResultSchema(error)) throw error
      const payloads = Array.isArray(args[payloadIndex]) ? args[payloadIndex] : []
      args[payloadIndex] = payloads.map(stripCaseResultFields)
      console.warn(`[HELM] Retrying Case.${methodName} without result fields until migration 026 is applied.`)
      return original.apply(entity, args)
    }
  }
}

export function installCaseResultSchemaFallback() {
  const entity = base44.entities?.Case
  if (!entity || entity[INSTALL_FLAG]) return

  Object.defineProperty(entity, INSTALL_FLAG, { value: true })
  wrapPayloadMethod(entity, 'create', 0)
  wrapPayloadMethod(entity, 'update', 1)
  wrapPayloadMethod(entity, 'upsert', 0)
  wrapBulkPayloadMethod(entity, 'bulkCreate', 0)
  wrapBulkPayloadMethod(entity, 'bulkUpsert', 0)
}
