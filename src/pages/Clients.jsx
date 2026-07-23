import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Phone, Mail, MessageCircle, Briefcase, FileText, Clock3, Building2, Upload, UserCheck, Percent, AlertTriangle, Trophy } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import StatusBadge from "../components/helm/StatusBadge";
import EmptyState from "../components/helm/EmptyState";
import StatCard from "@/components/helm/StatCard";
import ChoiceInput from "@/components/shared/ChoiceInput";
import ActionButtons from "@/components/shared/ActionButtons";
import { searchInFields } from "@/lib/search";
import { PageErrorState } from "@/components/app/AppStatusBar";
import PaginationControls from "@/components/shared/PaginationControls";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";
import { importContactsCsvFile, importFormerEmployeesFromLocalData } from "@/lib/clientImport";
import { brokerNames, brokerPayloadFromName, isMissingBrokerSchema, listBrokers, stripBrokerFields } from "@/lib/brokerUtils";
import { buildClientDuplicateGroups, caseSuccessStats, findClientDuplicates, normalizeText } from "@/lib/dataIntegrity";

const emptyForm = {
  full_name:"",client_type:"فرد",id_number:"",phone:"",email:"",address:"",nationality:"",notes:"",status:"نشط",
  broker_id:null,broker_name:"",broker_commission_percent:""
};
const CLIENT_TYPES = ["فرد","شركة","مؤسسة","جهة حكومية","ورثة"];
const CLIENT_STATUSES = ["نشط","غير نشط","مهمل"];
const COMMON_NATS = ["الإمارات","مصر","السعودية","الهند","باكستان","سوريا","الأردن","السودان"];

function toDate(value){ if(!value)return null; const date=new Date(value); return Number.isNaN(date.getTime())?null:date; }
function daysSince(value){ const date=toDate(value); if(!date)return null; return Math.floor((new Date()-date)/86400000); }
function asPercent(value){ const number=Number(value); return Number.isFinite(number)?number:0; }
function cleanClientPayload(value = {}){
  const source = { ...emptyForm, ...(value || {}) };
  return {
    full_name: String(source.full_name || "").trim(),
    client_type: source.client_type || "فرد",
    id_number: String(source.id_number || "").trim(),
    phone: String(source.phone || "").trim(),
    email: String(source.email || "").trim().toLowerCase(),
    address: source.address || "",
    nationality: source.nationality || "",
    notes: source.notes || "",
    status: source.status || "نشط",
    broker_id: source.broker_id || null,
    broker_name: source.broker_name || "",
    broker_commission_percent: asPercent(source.broker_commission_percent),
  };
}
function belongsToClient(record, client) {
  if (record?.client_id && client?.id) return String(record.client_id) === String(client.id);
  return normalizeText(record?.client_name) === normalizeText(client?.full_name);
}

export default function Clients() {
  const [clients,setClients] = useState([]);
  const [allClients,setAllClients] = useState([]);
  const [brokers,setBrokers] = useState([]);
  const [cases,setCases] = useState([]);
  const [sessions,setSessions] = useState([]);
  const [documents,setDocs] = useState([]);
  const [invoices,setInvoices] = useState([]);
  const [loading,setLoading] = useState(true);
  const [loadError,setError] = useState("");
  const [search,setSearch] = useState("");
  const [showDialog,setDialog] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(emptyForm);
  const [saving,setSaving] = useState(false);
  const [activeTab,setTab] = useState("all");
  const [page,setPage] = useState(1);
  const [total,setTotal] = useState(0);
  const [importing,setImporting] = useState(false);
  const [importSummary,setImportSummary] = useState("");
  const pageSize = 12;
  const searchRef = useRef(null);
  const csvInputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [{data:pageRows,total:totalRows},allRows,brokerRows,caseRows,sessionRows,docRows,invoiceRows] = await Promise.all([
        base44.entities.Client.listPage("-created_date",{page,pageSize}),
        base44.entities.Client.list("-created_date",2000),
        listBrokers(),
        base44.entities.Case.list("-created_date",2000),
        base44.entities.Session.list("-session_date",2000),
        base44.entities.Document.list("-created_date",2000),
        base44.entities.Invoice.list("-created_date",2000),
      ]);
      setClients(pageRows || []);
      setAllClients(allRows || []);
      setTotal(totalRows || 0);
      setBrokers(brokerRows || []);
      setCases(caseRows || []);
      setSessions(sessionRows || []);
      setDocs(docRows || []);
      setInvoices(invoiceRows || []);
    } catch(error){ setError(error.message || "تعذر تحميل الموكلين."); }
    finally { setLoading(false); }
  },[page]);

  useEffect(()=>{loadData();},[loadData]);
  usePageRefresh(loadData,['clients','cases','sessions','documents','invoices']);

  useEffect(()=>{
    const offNew=subscribeAppEvent(APP_SHORTCUT_NEW,({page:current})=>current==='Clients'&&openCreate());
    const offSearch=subscribeAppEvent(APP_SHORTCUT_SEARCH,({page:current})=>current==='Clients'&&searchRef.current?.focus());
    return()=>{offNew();offSearch();};
  },[]);

  const brokerNameOptions = useMemo(()=>brokerNames(brokers),[brokers]);
  const duplicateGroups = useMemo(()=>buildClientDuplicateGroups(allClients),[allClients]);
  const duplicateClientIds = useMemo(()=>new Set(duplicateGroups.flatMap(group=>group.records.map(record=>record.id))),[duplicateGroups]);
  const applyBroker = (name) => setForm((previous)=>({ ...previous, ...brokerPayloadFromName(name, brokers) }));
  const openCreate=()=>{setEditing(null);setForm(emptyForm);setDialog(true);};
  const openEdit=(client)=>{setEditing(client);setForm({...cleanClientPayload(client),broker_commission_percent:client.broker_commission_percent??""});setDialog(true);};

  const handleSave=async()=>{
    const payload=cleanClientPayload(form);
    const duplicates=findClientDuplicates(payload,allClients,editing?.id);
    if(duplicates.length){
      const details=duplicates.slice(0,4).map(match=>`${match.record.full_name} — تطابق: ${match.matchedFields.join('، ')}`).join('\n');
      alert(`تم منع الحفظ لوجود موكل مطابق أو محتمل التكرار:\n\n${details}\n\nافتح السجل الموجود وعدّل بياناته بدل إنشاء سجل جديد.`);
      return;
    }
    setSaving(true);
    try{
      try{
        if(editing)await base44.entities.Client.update(editing.id,payload);
        else await base44.entities.Client.create(payload);
      }catch(error){
        if(!isMissingBrokerSchema(error))throw error;
        const legacyPayload=stripBrokerFields(payload);
        if(editing)await base44.entities.Client.update(editing.id,legacyPayload);
        else await base44.entities.Client.create(legacyPayload);
        alert("تم حفظ الموكل، لكن بيانات البروكر لم تُحفظ لأن أعمدة البروكر لم تُفعّل في Supabase بعد. شغّل Migration رقم 022.");
      }
      setDialog(false); await loadData();
    }catch(error){ alert(error.message||"تعذر حفظ الموكل."); }
    finally{setSaving(false);}
  };

  const runImport = async (work, successPrefix) => {
    setImporting(true); setImportSummary("جاري الاستيراد...");
    try {
      const result = await work((progress) => setImportSummary(`جاري الاستيراد: ${progress.current}/${progress.total} — تمت الإضافة ${progress.created} / تخطي ${progress.skipped} / فشل ${progress.failed}`));
      setImportSummary(`${successPrefix}: تمت إضافة ${result.created}، تخطي ${result.skipped} مكرر/ناقص، فشل ${result.failed}.`);
      await loadData();
    } catch (error) { setImportSummary(error?.message || "تعذر تنفيذ الاستيراد."); }
    finally { setImporting(false); if (csvInputRef.current) csvInputRef.current.value = ""; }
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runImport((onProgress) => importContactsCsvFile({ file, base44, existingClients: allClients, onProgress }),"تم استيراد جهات الاتصال");
  };

  const handleFormerEmployeesImport = async () => {
    if (!confirm("سيتم نقل ملفات الموظفين المحلية السابقة إلى الموكلين مع منع السجلات المكررة. هل تريد الاستمرار؟")) return;
    await runImport((onProgress) => importFormerEmployeesFromLocalData({ base44, existingClients: allClients, onProgress }),"تم نقل ملفات الموظفين السابقة إلى الموكلين");
  };

  const metrics = useMemo(()=>clients.map(client=>{
    const clientCases=cases.filter(item=>belongsToClient(item,client));
    const clientSessions=sessions.filter(item=>belongsToClient(item,client));
    const clientDocuments=documents.filter(item=>belongsToClient(item,client));
    const clientInvoices=invoices.filter(item=>belongsToClient(item,client));
    const dates=[client.created_date,...clientCases.map(item=>item.updated_date||item.created_date),...clientSessions.map(item=>item.updated_date||item.session_date),...clientDocuments.map(item=>item.updated_date||item.created_date),...clientInvoices.map(item=>item.updated_date||item.created_date)].map(toDate).filter(Boolean).sort((a,b)=>b-a);
    const lastActivity=dates[0]||null;
    const inactivityDays=lastActivity?daysSince(lastActivity.toISOString()):null;
    const success=caseSuccessStats(clientCases);
    const overdueInvoices=clientInvoices.filter(item=>item.status==='متأخرة').length;
    const activeCases=clientCases.filter(item=>item.status==='جارية').length;
    const isNeglected=(inactivityDays!==null&&inactivityDays>45)||(client.status==='غير نشط'&&activeCases===0&&clientDocuments.length===0);
    return {...client,activeCases,totalCases:clientCases.length,sessionsCount:clientSessions.length,documentsCount:clientDocuments.length,invoicesCount:clientInvoices.length,overdueInvoices,lastActivity,inactivityDays,isNeglected,successRate:success.rate,decidedCases:success.decided,isDuplicate:duplicateClientIds.has(client.id)};
  }),[clients,cases,sessions,documents,invoices,duplicateClientIds]);

  const ratedMetrics=metrics.filter(client=>client.successRate!==null);
  const stats=useMemo(()=>({
    total,
    active:metrics.filter(client=>client.status==='نشط').length,
    neglected:metrics.filter(client=>client.isNeglected).length,
    duplicates:duplicateClientIds.size,
    averageSuccess:ratedMetrics.length?Math.round((ratedMetrics.reduce((sum,client)=>sum+client.successRate,0)/ratedMetrics.length)*10)/10:null,
  }),[metrics,total,duplicateClientIds,ratedMetrics]);

  const filtered=useMemo(()=>metrics.filter(client=>{
    if(!searchInFields(client,['full_name','phone','email','id_number','address','nationality','broker_name'],search))return false;
    if(activeTab==='active')return client.status==='نشط';
    if(activeTab==='neglected')return client.isNeglected;
    if(activeTab==='duplicates')return client.isDuplicate;
    return true;
  }),[metrics,search,activeTab]);

  const sendWhatsApp=(client)=>{
    const message=encodeURIComponent(`مرحباً ${client.full_name}، نود متابعة ملفكم القانوني.`);
    if(client.phone)window.open(`https://wa.me/${client.phone.replace(/\D+/g,'')}?text=${message}`,'_blank');
  };

  const tabs=[
    {key:'all',label:'الكل',count:stats.total},
    {key:'active',label:'النشطون',count:stats.active},
    {key:'neglected',label:'المهملون',count:stats.neglected},
    {key:'duplicates',label:'المكررات',count:stats.duplicates},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="الموكلون" subtitle={`${total} موكل — ربط موحد بالقضايا والمستندات والفواتير`}
        action={<div className="flex flex-wrap gap-2 justify-end">
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
          <Button variant="outline" onClick={handleFormerEmployeesImport} disabled={importing} className="gap-2"><UserCheck className="h-4 w-4"/>نقل الموظفين</Button>
          <Button variant="outline" onClick={()=>csvInputRef.current?.click()} disabled={importing} className="gap-2"><Upload className="h-4 w-4"/>استيراد CSV</Button>
          <Button onClick={openCreate} className="bg-primary text-white gap-2"><Plus className="h-4 w-4"/>إضافة موكل</Button>
        </div>} />

      {importSummary&&<Card className="p-3 border-primary/10 bg-primary/5 text-sm font-bold text-primary">{importSummary}</Card>}

      {duplicateGroups.length>0&&(
        <Card className="border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/>
            <div className="flex-1"><h3 className="font-black text-amber-950">تنبيه سلامة البيانات: {duplicateGroups.length} مجموعة موكلين محتملة التكرار</h3><p className="mt-1 text-sm font-bold leading-7 text-amber-800">لن يتم حذف أو دمج أي سجل تلقائيًا. راجع المكررات واعتمد سجلًا واحدًا ثم انقل ارتباطات القضايا والفواتير إليه قبل حذف الزائد.</p><div className="mt-2 flex flex-wrap gap-2">{duplicateGroups.slice(0,5).map(group=><Badge key={group.key} className="bg-white text-amber-900 border border-amber-200">{group.records.map(record=>record.full_name).join(' / ')}</Badge>)}</div></div>
            <Button variant="outline" onClick={()=>setTab('duplicates')}>عرض المكررات</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الموكلين" value={stats.total} icon={Users} color="primary"/>
        <StatCard title="النشطون" value={stats.active} icon={Briefcase} color="success"/>
        <StatCard title="متوسط نجاح القضايا" value={stats.averageSuccess===null?'—':`${stats.averageSuccess}%`} icon={Trophy} color="accent"/>
        <StatCard title="سجلات محتملة التكرار" value={stats.duplicates} icon={AlertTriangle} color="warning"/>
      </div>

      <Card className="p-4 space-y-3 border-primary/10">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input ref={searchRef} placeholder="بحث بالاسم أو الهاتف أو الهوية أو البريد أو البروكر..." value={search} onChange={event=>setSearch(event.target.value)} className="pr-10 h-11"/></div>
          <div className="flex flex-wrap gap-2">{tabs.map(tab=><Button key={tab.key} variant={activeTab===tab.key?'default':'outline'} className="rounded-full h-9 gap-1.5" onClick={()=>setTab(tab.key)}>{tab.label}<span className="opacity-70 text-xs">{tab.count}</span></Button>)}</div>
        </div>
      </Card>

      {loading?<div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"/></div>:loadError?<PageErrorState message={loadError} onRetry={loadData}/>:filtered.length===0?<EmptyState icon={Users} title="لا توجد نتائج" description="غيّر الفلتر أو أضف موكلًا جديدًا." action={<Button onClick={openCreate}>إضافة موكل</Button>}/>:<>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(client=><Card key={client.id} className={`p-5 transition-all hover:shadow-md ${client.isDuplicate?'border-amber-300 bg-amber-50/30':'border-primary/10 hover:border-primary/25'}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0"><div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-lg">{(client.full_name||'?')[0]}</div><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-foreground">{client.full_name}</h3><StatusBadge status={client.status}/>{client.isNeglected&&<Badge className="bg-warning/15 text-warning border-warning/20 text-[10px]">مهمل</Badge>}{client.isDuplicate&&<Badge className="bg-amber-200 text-amber-900 border-0 text-[10px]">محتمل التكرار</Badge>}</div><p className="text-xs text-muted-foreground mt-0.5">{client.client_type}{client.nationality?` · ${client.nationality}`:''}</p>{client.broker_name&&<p className="text-xs text-primary mt-1 flex items-center gap-1"><Percent className="h-3 w-3"/>البروكر: {client.broker_name} · {asPercent(client.broker_commission_percent)}%</p>}</div></div>
              <ActionButtons entityName="Client" record={client} onEdit={openEdit} onDeleted={loadData} size="sm"/>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[{label:'كل القضايا',value:client.totalCases},{label:'النشطة',value:client.activeCases},{label:'المستندات',value:client.documentsCount},{label:'الفواتير',value:client.invoicesCount},{label:'النجاح',value:client.successRate===null?'—':`${client.successRate}%`}].map(item=><div key={item.label} className="rounded-xl bg-muted/40 p-2.5 text-center"><p className="font-black text-foreground text-lg leading-none">{item.value}</p><p className="text-[10px] text-muted-foreground mt-1">{item.label}</p></div>)}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">{client.phone&&<span className="flex items-center gap-1"><Phone className="h-3 w-3"/>{client.phone}</span>}{client.email&&<span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3"/>{client.email}</span>}{client.inactivityDays!==null&&<span className="flex items-center gap-1"><Clock3 className="h-3 w-3"/>آخر نشاط {client.inactivityDays} يوم</span>}{client.overdueInvoices>0&&<Badge className="text-[10px] bg-destructive/10 text-destructive border-0">{client.overdueInvoices} فاتورة متأخرة</Badge>}</div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border"><Button variant="outline" size="sm" onClick={()=>openEdit(client)} className="gap-1.5 h-8"><FileText className="h-3.5 w-3.5"/>فتح الملف</Button>{client.phone&&<Button variant="outline" size="sm" onClick={()=>sendWhatsApp(client)} className="gap-1.5 h-8"><MessageCircle className="h-3.5 w-3.5"/>واتساب</Button>}{client.email&&<Button variant="outline" size="sm" onClick={()=>window.location.href=`mailto:${client.email}`} className="gap-1.5 h-8"><Mail className="h-3.5 w-3.5"/>بريد</Button>}</div>
          </Card>)}
        </div>
        <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage}/>
      </>}

      <Dialog open={showDialog} onOpenChange={setDialog}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl"><DialogHeader><DialogTitle>{editing?"تعديل بيانات الموكل":"إضافة موكل جديد"}</DialogTitle></DialogHeader><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="space-y-1 md:col-span-2"><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={event=>setForm({...form,full_name:event.target.value})} className="h-11"/></div>
        <div className="space-y-1"><Label>الصفة</Label><ChoiceInput value={form.client_type} onChange={value=>setForm({...form,client_type:value})} options={CLIENT_TYPES} listId="cl-types"/></div>
        <div className="space-y-1"><Label>الحالة</Label><ChoiceInput value={form.status} onChange={value=>setForm({...form,status:value})} options={CLIENT_STATUSES} listId="cl-status"/></div>
        <div className="space-y-1"><Label>الهاتف</Label><Input value={form.phone} onChange={event=>setForm({...form,phone:event.target.value})} className="h-11"/></div>
        <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={event=>setForm({...form,email:event.target.value})} className="h-11"/></div>
        <div className="space-y-1"><Label>رقم الهوية</Label><Input value={form.id_number} onChange={event=>setForm({...form,id_number:event.target.value})} className="h-11"/></div>
        <div className="space-y-1"><Label>الجنسية</Label><ChoiceInput value={form.nationality} onChange={value=>setForm({...form,nationality:value})} options={COMMON_NATS} listId="cl-nat"/></div>
        <div className="space-y-1 md:col-span-2"><Label>البروكر / مصدر الموكل</Label><ChoiceInput value={form.broker_name} onChange={applyBroker} options={brokerNameOptions} listId="client-brokers" placeholder="اختر أو اكتب اسم البروكر"/></div>
        <div className="space-y-1"><Label>نسبة البروكر الافتراضية %</Label><Input type="number" min="0" max="100" step="0.01" value={form.broker_commission_percent} onChange={event=>setForm({...form,broker_commission_percent:event.target.value})} className="h-11"/></div>
        <div className="space-y-1"><Label>سلامة البيانات</Label><p className="text-xs text-muted-foreground pt-3">سيتم فحص الهاتف والبريد والهوية والاسم قبل الحفظ، ويُمنع إنشاء سجل مكرر.</p></div>
        <div className="space-y-1 md:col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={event=>setForm({...form,address:event.target.value})} className="h-11"/></div>
        <div className="space-y-1 md:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={event=>setForm({...form,notes:event.target.value})} className="min-h-[100px]"/></div>
      </div><div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={()=>setDialog(false)}>إلغاء</Button><Button onClick={handleSave} disabled={saving||!form.full_name} className="bg-primary text-white">{saving?"جارٍ الفحص والحفظ...":editing?"حفظ التعديلات":"إضافة"}</Button></div></DialogContent></Dialog>
    </div>
  );
}
