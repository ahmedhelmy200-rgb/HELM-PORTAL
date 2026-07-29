export const CASE_RESULT_SCHEMA_FIELDS = ['case_result', 'success_percentage', 'result_notes']

export function isMissingCaseResultSchema(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const mentionsField = CASE_RESULT_SCHEMA_FIELDS.some((field) => message.includes(field))
  const mentionsSchema = message.includes('schema cache') || message.includes('does not exist') || message.includes('could not find') || message.includes('column')
  return mentionsField && mentionsSchema
}

export function stripCaseResultFields(payload = {}) {
  const { case_result, success_percentage, result_notes, ...rest } = payload || {}
  return rest
}
