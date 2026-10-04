import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckSquare,
  FileText,
  Loader2,
  Receipt,
  Search,
  Users,
  X,
} from 'lucide-react'

import { base44 } from '@/api/base44Client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { APP_DATA_CHANGED } from '@/lib/app-events'
import { normalizeArabicText } from '@/lib/search'
import { createPageUrl } from '@/utils'

const SEARCH_CACHE_TTL = 60_000
const ENTITY_CONFIG = [
  { key: 'cases', entity: 'Case', label: 'القضايا', icon: Briefcase, page: 'Cases', fields: ['title', 'client_name', 'case_number', 'court'] },
  { key: 'clients', entity: 'Client', label: 'الموكلون', icon: Users, page: 'Clients', fields: ['name_ar', 'name_en', 'full_name', 'name_aliases', 'client_role', 'phone', 'email', 'id_number'] },
  { key: 'sessions', entity: 'Session', label: 'الجلسات', icon: CalendarDays, page: 'Sessions', fields: ['case_title', 'client_name', 'court'] },
  { key: 'documents', entity: 'Document', label: 'المستندات', icon: FileText, page: 'Documents', fields: ['title', 'file_name', 'client_name', 'case_title'] },
  { key: 'invoices', entity: 'Invoice', label: 'الفواتير', icon: Receipt, page: 'Invoices', fields: ['invoice_number', 'client_name', 'case_title'] },
  { key: 'tasks', entity: 'Task', label: 'المهام', icon: CheckSquare, page: 'Tasks', fields: ['title', 'client_name', 'case_title'] },
]

function fieldValue(value) {
  return Array.isArray(value) ? value.join(' ') : String(value || '')
}

function highlight(text, query) {
  if (!text || !query) return text
  const normalizedQuery = normalizeArabicText(query)
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = String(text).split(new RegExp(`(${escapedQuery})`, 'gi'))
  return parts.map((part, index) => (
    normalizeArabicText(part) === normalizedQuery
      ? <mark key={`${part}-${index}`} className="rounded bg-primary/20 px-0.5 font-semibold not-italic text-primary">{part}</mark>
      : part
  ))
}

function ResultItem({ item, config, query, onClick, selected, itemKey }) {
  const Icon = config.icon
  const primary = config.key === 'clients'
    ? (item.name_ar || item.full_name || item.name_en || '—')
    : (item[config.fields[0]] || '—')
  const secondary = config.key === 'clients'
    ? [item.name_en && item.name_en !== primary ? item.name_en : null, item.phone, item.id_number].filter(Boolean).join(' · ')
    : config.fields.slice(1).map((field) => fieldValue(item[field])).filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      data-search-result={itemKey}
      data-search-active={selected ? 'true' : 'false'}
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right transition-colors ${selected ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/60'}`}
      role="option"
      aria-selected={selected}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${selected ? 'bg-primary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{highlight(primary, query)}</span>
        {secondary && <span className="block truncate text-xs text-muted-foreground">{highlight(secondary, query)}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className="h-5 py-0 text-[10px]">{config.label}</Badge>
        <ArrowLeft className={`h-3.5 w-3.5 text-muted-foreground transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
      </span>
    </button>
  )
}

export const GLOBAL_SEARCH_EVENT = 'helm:global-search'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const corpusRef = useRef({ loadedAt: 0, groups: null })
  const requestRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const loadCorpus = useCallback(async () => {
    const cached = corpusRef.current
    if (cached.groups && Date.now() - cached.loadedAt < SEARCH_CACHE_TTL) return cached.groups

    const groups = await Promise.all(ENTITY_CONFIG.map(async (config) => {
      try {
        const entity = base44.entities[config.entity]
        const rows = entity
          ? await entity.list('-created_date', config.key === 'clients' ? 5000 : 500)
          : []
        return { config, rows: Array.isArray(rows) ? rows : [] }
      } catch {
        return { config, rows: [] }
      }
    }))
    corpusRef.current = { loadedAt: Date.now(), groups }
    return groups
  }, [])

  useEffect(() => {
    const handleGlobalKeys = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    const handleOpen = () => setOpen(true)
    const invalidateCorpus = () => { corpusRef.current = { loadedAt: 0, groups: null } }
    window.addEventListener('keydown', handleGlobalKeys)
    window.addEventListener(GLOBAL_SEARCH_EVENT, handleOpen)
    window.addEventListener(APP_DATA_CHANGED, invalidateCorpus)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeys)
      window.removeEventListener(GLOBAL_SEARCH_EVENT, handleOpen)
      window.removeEventListener(APP_DATA_CHANGED, invalidateCorpus)
    }
  }, [])

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
      return
    }
    requestRef.current += 1
    setQuery('')
    setResults([])
    setLoadError('')
    setActiveIndex(0)
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (!open || trimmed.length < 2) {
      setResults([])
      setLoading(false)
      setLoadError('')
      setActiveIndex(0)
      return undefined
    }

    const requestId = ++requestRef.current
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setLoadError('')
      try {
        const groups = await loadCorpus()
        if (requestRef.current !== requestId) return
        const normalizedQuery = normalizeArabicText(trimmed)
        const groupedResults = groups.flatMap(({ config, rows }) => {
          const items = rows.filter((row) => config.fields.some((field) => (
            normalizeArabicText(fieldValue(row[field])).includes(normalizedQuery)
          ))).slice(0, 5)
          return items.length ? [{ config, items }] : []
        })
        setResults(groupedResults)
        setActiveIndex(0)
      } catch {
        if (requestRef.current === requestId) {
          setResults([])
          setLoadError('تعذّر تجهيز البحث الآن. تحقق من الاتصال وحاول مجددًا.')
        }
      } finally {
        if (requestRef.current === requestId) setLoading(false)
      }
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [loadCorpus, open, query])

  const flatResults = useMemo(() => results.flatMap(({ config, items }) => (
    items.map((item) => ({ config, item, key: `${config.key}:${item.id || item[config.fields[0]]}` }))
  )), [results])
  const resultIndexes = useMemo(() => new Map(flatResults.map((entry, index) => [entry.key, index])), [flatResults])

  useEffect(() => {
    if (!flatResults[activeIndex]) return
    const element = document.querySelector('[data-search-active="true"]')
    element?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, flatResults])

  const handleSelect = useCallback((config, item) => {
    if (config.key === 'clients' && item?.id) navigate(`${createPageUrl('Client360')}?id=${item.id}`)
    else navigate(createPageUrl(config.page))
    setOpen(false)
  }, [navigate])

  const handleInputKeyDown = (event) => {
    if (!flatResults.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % flatResults.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const active = flatResults[activeIndex]
      if (active) handleSelect(active.config, active.item)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]" dir="rtl" role="dialog" aria-modal="true" aria-label="البحث الشامل">
      <button type="button" className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="إغلاق البحث" />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          {loading
            ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
            : <Search className="h-5 w-5 shrink-0 text-muted-foreground" />}
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="ابحث في كل البيانات…"
            className="h-8 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            aria-label="عبارة البحث"
            aria-controls="global-search-results"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground" aria-label="مسح البحث">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden h-6 shrink-0 items-center rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">Esc</kbd>
        </div>

        <div id="global-search-results" className="max-h-[55vh] overflow-y-auto p-2" role="listbox">
          {!query && (
            <div className="space-y-2 py-10 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">بحث موحّد في القضايا والموكلين والجلسات والمستندات والفواتير والمهام</p>
              <p className="text-xs text-muted-foreground opacity-60">يدعم العربية والإنجليزية والأسماء البديلة بدون تشكيل</p>
            </div>
          )}

          {query.trim().length === 1 && <p className="py-6 text-center text-sm text-muted-foreground">اكتب حرفين على الأقل…</p>}
          {loadError && <p className="m-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-5 text-center text-sm text-destructive">{loadError}</p>}
          {query.trim().length >= 2 && !loading && !loadError && flatResults.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">لا توجد نتائج لـ «<strong>{query}</strong>»</p>
            </div>
          )}

          {results.map(({ config, items }) => (
            <div key={config.key} className="mb-3">
              <div className="mb-1 flex items-center gap-2 px-3 py-1.5">
                <config.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold tracking-wider text-muted-foreground">{config.label}</span>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              {items.map((item) => {
                const key = `${config.key}:${item.id || item[config.fields[0]]}`
                const index = resultIndexes.get(key)
                return (
                  <ResultItem
                    key={key}
                    itemKey={key}
                    item={item}
                    config={config}
                    query={query}
                    selected={index === activeIndex}
                    onClick={() => handleSelect(config, item)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="h-5 rounded border border-border bg-card px-1.5 font-mono text-[10px]">↑↓</kbd>تنقل</span>
            <span className="flex items-center gap-1"><kbd className="h-5 rounded border border-border bg-card px-1.5 font-mono text-[10px]">↵</kbd>فتح</span>
          </div>
          {flatResults.length > 0 && <span className="text-xs text-muted-foreground">{flatResults.length} نتيجة</span>}
        </div>
      </div>
    </div>
  )
}
