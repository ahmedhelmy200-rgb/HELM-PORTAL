import { supabase } from '@/integrations/supabase/client'

export function numberOrZero(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function calcBrokerCommission(fees, percent) {
  const amount = numberOrZero(fees) * numberOrZero(percent) / 100
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0
}

export function isMissingBrokerSchema(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return message.includes('broker_') || message.includes('brokers') || message.includes('contacts') || message.includes('schema cache') || message.includes('does not exist') || message.includes('could not find')
}

export function stripBrokerFields(payload = {}) {
  const {
    broker_id,
    broker_name,
    broker_commission_percent,
    broker_commission_amount,
    ...rest
  } = payload || {}
  return rest
}

export async function listBrokers() {
  try {
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) {
      if (isMissingBrokerSchema(error)) return []
      throw error
    }
    return data || []
  } catch (error) {
    if (isMissingBrokerSchema(error)) return []
    throw error
  }
}

export function brokerNames(brokers = []) {
  return [...new Set((brokers || []).map((broker) => broker.full_name).filter(Boolean))]
}

export function brokerPayloadFromName(name, brokers = []) {
  const selected = (brokers || []).find((broker) => broker.full_name === name)
  if (!name) {
    return { broker_id: null, broker_name: '', broker_commission_percent: 0 }
  }
  return {
    broker_id: selected?.id || null,
    broker_name: name,
    broker_commission_percent: selected?.default_commission_percent ?? 0,
  }
}

export function brokerSummaryForCase(record = {}) {
  const percent = numberOrZero(record.broker_commission_percent)
  const amount = record.broker_commission_amount !== undefined && record.broker_commission_amount !== null && record.broker_commission_amount !== ''
    ? numberOrZero(record.broker_commission_amount)
    : calcBrokerCommission(record.fees, percent)
  return { percent, amount }
}
