

export type UserRole = 'admin' | 'visitor' | 'client' | 'staff';
export type AppLanguage = 'ar' | 'en';

export enum CaseStatus {
  WON = 'ربح',
  PREP = 'قيد التحضير',
  ACTIVE = 'متداولة',
  LOST = 'خسارة',
  ARCHIVED = 'مؤرشف',
  JUDGMENT = 'حكم',
  APPEAL = 'استئناف',
  CLOSED = 'مغلق',
  LITIGATION = 'تقاضي',
  PENDING = 'معلق'
}

export enum CaseCategory {
  CIVIL = 'مدني',
  CRIMINAL = 'جزائي',
  LABOR = 'عمالي',
  COMMERCIAL = 'تجاري',
  FAMILY = 'أحوال شخصية',
  RENTAL = 'إيجاري',
  ADMINISTRATIVE = 'إداري',
  EXECUTION = 'تنفيذ',
  ARCHIVED = 'أرشيف'
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  image?: string;
  video?: string;
  links?: GroundingLink[];
  isAudio?: boolean;
}

// Added missing CaseComment interface
export interface CaseComment {
  id: string;
  authorRole: UserRole;
  authorName: string;
  text: string;
  date: string;
}

// Added missing CaseActivity interface
export interface CaseActivity {
  id: string;
  type: 'status_change' | 'comment_added' | 'info_update' | 'document_added'; // Added 'document_added'
  description: string;
  userRole: UserRole;
  userName: string;
  timestamp: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: 'Contract' | 'Judgment' | 'Memo' | 'Receipt' | 'Other' | 'EmiratesID' | 'Passport' | 'License';
  uri: string; // Base64 or URL
  uploadDate: string;
  caseId?: string;
  clientId: string;
  fileName?: string; // Original file name
  mimeType?: string; // e.g., 'application/pdf', 'image/jpeg'
  // Added for display convenience in components
  clientName?: string; 
  caseTitle?: string;
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  category: CaseCategory;
  subCategory?: string; // Added subCategory field
  clientId: string;
  clientName: string;
  opponentName: string;
  court: string;
  status: CaseStatus;
  totalFee: number;
  paidAmount: number;
  createdAt: string;
  nextHearingDate?: string; // Added nextHearingDate field
  isArchived: boolean;
  documents: string[]; // Stores IDs of LegalDocuments
  comments?: CaseComment[]; // Updated to use CaseComment interface
  activities?: CaseActivity[]; // Updated to use CaseActivity interface
  assignedLawyer?: string; // Added assignedLawyer field
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  emiratesId: string;
  address: string;
  type: 'Individual' | 'Corporate';
  createdAt: string;
  documents: string[]; // Stores IDs of LegalDocuments
  totalCases?: number; // Added totalCases field
  profileImage?: string; // Added profileImage field
  balance?: number; // Added for financial summary
}

// Updated Invoice interface for partial payments and optional caseId/branch
export interface Invoice {
  id: string;
  clientId: string;
  caseId?: string; // Optional: Link to a specific case
  amount: number;
  paidAmount: number; // Added to track partial payments
  status: 'Paid' | 'Unpaid' | 'Partially Paid'; // Added Partially Paid
  date: string;
  description?: string;
  branch?: string; // For multi-branch support
}

// Added missing ExpenseCategory enum
export enum ExpenseCategory {
  OFFICE = 'مكتبي',
  PERSONAL = 'شخصي',
  CASE_RELATED = 'خاص بقضية', // Added for case-related expenses
  GENERAL_OPERATIONAL = 'تشغيل عام' // For generic office expenses
}

// Added missing Expense interface
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  caseId?: string; // Optional: Link to a specific case
  branch?: string;
}

// Added missing PaymentReceipt interface (currently not used explicitly but good to have)
export interface PaymentReceipt {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  invoiceId?: string; // Link to an invoice
}

// Added missing FutureDebt interface
export interface FutureDebt {
  id: string;
  clientName: string;
  clientId?: string; // Optional: Link to a client
  amount: number;
  dueDate: string;
  description: string;
  isReminded?: boolean; // To track if a reminder has been sent
}

// Added missing SystemSettings interface, with added signature
export interface SystemSettings {
  logo?: string;
  stamp?: string;
  signature?: string; // Added signature field
  language: AppLanguage;
  primaryColor: string;
}
