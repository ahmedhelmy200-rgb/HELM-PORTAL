import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ScanText, X } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import { FileText } from "lucide-react";
import CaseFolderView from "../components/documents/CaseFolderView";
import DocCard from "../components/documents/DocCard";
import DocFormDialog from "../components/documents/DocFormDialog";
import { useAuth } from "@/lib/AuthContext";
import { searchInFields } from "@/lib/search";
import PaginationControls from "@/components/shared/PaginationControls";
import { PageErrorState } from "@/components/app/AppStatusBar";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { createPageUrl } from "@/utils";

const FOLDER_MAP = {
  "صحيفة دعوى": "صحيفة دعوى",
  "مذكرة": "مذكرات",
  "حكم": "أحكام",
  "عقد": "عقود وتوكيلات",
  "توكيل": "عقود وتوكيلات",
  "شهادة": "شهادات",
  "مستند رسمي": "مستندات رسمية",
  "أخرى": "أخرى",
};

function getDocFolder(doc) {
  return doc.folder || FOLDER_MAP[doc.doc_type] || "أخرى";
}

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === "client";
  const [docs, setDocs] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [ocrSearch, setOcrSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [docRows, caseRows, clientRows] = await Promise.all([
        base44.entities.Document.list("-created_date", 5000),
        base44.entities.Case.list("title", 5000),
        base44.entities.Client.list("full_name", 5000),
      ]);
      const safeDocs = Array.isArray(docRows) ? docRows : [];
      setDocs(safeDocs);
      setCases(Array.isArray(caseRows) ? caseRows : []);
      setClients(Array.isArray(clientRows) ? clientRows : []);
      setTotal(safeDocs.length);
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل المستندات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ['documents', 'cases', 'clients']);

  useEffect(() => {
    const offNew    = subscribeAppEvent(APP_SHORTCUT_NEW,    ({ page: p }) => p === 'Documents' && openCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: p }) => p === 'Documents' && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, []);

  const openCreate = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (d) => { setEditing(d); setShowDialog(true); };

  const handleSelectCase = (caseId) => {
    setSelectedCase(prev => prev === caseId ? null : caseId);
    setSelectedFolder(null);
  };

  const clientLookup = useMemo(
    () => Object.fromEntries(clients.map((client) => [String(client.id), client])),
    [clients],
  );

  const filteredDocs = useMemo(() => docs.filter((doc) => {
    if (selectedCase === "__unlinked__") {
      if (doc.case_id) return false;
    } else if (selectedCase) {
      if (String(doc.case_id || "") !== String(selectedCase)) return false;
    }
    if (selectedFolder && getDocFolder(doc) !== selectedFolder) return false;

    if (search) {
      const client = clientLookup[String(doc.client_id || "")] || {};
      const searchable = {
        ...doc,
        client_name_ar: client.name_ar || "",
        client_name_en: client.name_en || "",
        client_aliases: client.name_aliases || [],
      };
      const inFields = searchInFields(
        searchable,
        ['title', 'case_title', 'case_number', 'client_name', 'client_name_ar', 'client_name_en', 'client_aliases', 'file_name', 'doc_type', 'folder'],
        search,
      );
      const inOcr = ocrSearch && searchInFields(doc, ['ocr_text'], search);
      if (!inFields && !inOcr) return false;
    }
    return true;
  }), [docs, selectedCase, selectedFolder, search, ocrSearch, clientLookup]);

  const pagedDocs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, page]);

  const ocrMatchCount = search && ocrSearch
    ? filteredDocs.filter(d => searchInFields(d, ['ocr_text'], search)).length
    : 0;

  useEffect(() => {
    setPage(1);
  }, [search, selectedCase, selectedFolder, ocrSearch]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filteredDocs.length, page]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={isClient ? "مستنداتي" : "أرشيف المستندات"}
        subtitle={`${filteredDocs.length} مستند ظاهر من أصل ${total || docs.length}${isClient ? " خاص بك" : ''}`}
        action={
          <Button onClick={openCreate} className="bg-primary text-white gap-2">
            <Plus className="h-4 w-4" />{isClient ? "رفع مستند" : "إضافة مستند"}
          </Button>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder={ocrSearch ? "بحث داخل نصوص المستندات (OCR)..." : "بحث بالاسم أو القضية..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={ocrSearch ? "default" : "outline"}
          size="sm"
          className={`gap-2 ${ocrSearch ? "bg-primary text-white" : ""}`}
          onClick={() => setOcrSearch(v => !v)}
        >
          <ScanText className="h-4 w-4" />
          بحث OCR
          {ocrSearch && <Badge className="bg-white/20 text-white text-[10px] mr-1">فعّال</Badge>}
        </Button>
      </div>

      {ocrSearch && search && ocrMatchCount > 0 && (
        <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary flex items-center gap-2">
          <ScanText className="h-4 w-4" />
          تم العثور على <strong>{ocrMatchCount}</strong> مستند يحتوي على «<strong>{search}</strong>» في نص المستند
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : (
        <div className="flex gap-5">
          <div className="hidden md:flex flex-col w-56 shrink-0">
            <div className="bg-card rounded-xl border border-border p-3 sticky top-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">مجلدات القضايا</p>
              <CaseFolderView
                cases={cases}
                docs={docs}
                selectedCase={selectedCase}
                selectedFolder={selectedFolder}
                onSelectCase={handleSelectCase}
                onSelectFolder={setSelectedFolder}
                onSelectDoc={openEdit}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {(selectedCase || selectedFolder) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <button onClick={() => { setSelectedCase(null); setSelectedFolder(null); }} className="text-primary hover:underline">
                  كل المستندات
                </button>
                {selectedCase && selectedCase !== "__unlinked__" && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">{cases.find(c => c.id === selectedCase)?.title || "قضية"}</span>
                  </>
                )}
                {selectedFolder && <><span>/</span><span className="text-foreground font-medium">{selectedFolder}</span></>}
                <Badge variant="secondary" className="text-xs mr-2">{filteredDocs.length} مستند</Badge>
              </div>
            )}

            {filteredDocs.length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد مستندات" description={search ? "لم يُعثر على نتائج للبحث" : "أضف مستندات وستظهر هنا منظمة حسب القضايا"} action={<Button onClick={openCreate}>إضافة مستند</Button>} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {pagedDocs.map(doc => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      onEdit={openEdit}
                      searchQuery={ocrSearch ? search : ""}
                      onOpenClient={(row) => row.client_id && navigate(createPageUrl("Client360") + `?id=${row.client_id}`)}
                    />
                  ))}
                </div>
                <PaginationControls page={page} pageSize={pageSize} total={filteredDocs.length} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      )}

      <DocFormDialog open={showDialog} onOpenChange={setShowDialog} editing={editing} cases={cases} clients={clients} onSaved={() => { setShowDialog(false); loadData(); }} />
    </div>
  );
}
