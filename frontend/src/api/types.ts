// Backend'dagi enum va DTO shakllariga mos keladigan turlar
// (src/*/entities/*.ts va src/*/dto/*.ts fayllariga qarang).

export enum BusinessType {
  YATT = 'yakka_tartibdagi_tadbirkor',
  MCHJ = 'mchj',
  FERMER = 'fermer_xojaligi',
  BOSHQA = 'boshqa',
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.YATT]: 'Yakka tartibdagi tadbirkor',
  [BusinessType.MCHJ]: 'MCHJ',
  [BusinessType.FERMER]: 'Fermer xo‘jaligi',
  [BusinessType.BOSHQA]: 'Boshqa',
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  companyName?: string | null;
  businessType: BusinessType;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export enum PaymentMethod {
  ANNUITET = 'annuitet',
  DIFFERENSIAL = 'differensial',
}

export interface ScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface LoanResult {
  loanAmount: number;
  annualRate: number;
  termMonths: number;
  paymentMethod: PaymentMethod;
  monthlyPayment: number | null;
  firstPayment?: number;
  lastPayment?: number;
  totalPayment: number;
  totalInterest: number;
  schedule: ScheduleRow[];
}

export enum TaxpayerType {
  YAGONA_SOLIQ = 'yagona_soliq',
  QQS_TOLOVCHI = 'qqs_tolovchi',
  YATT_QATIY = 'yatt_qatiy_belgilangan',
}

export const TAXPAYER_TYPE_LABELS: Record<TaxpayerType, string> = {
  [TaxpayerType.YAGONA_SOLIQ]: 'Yagona soliq (aylanmadan)',
  [TaxpayerType.QQS_TOLOVCHI]: "Umumbelgilangan tartib (QQS + foyda solig'i)",
  [TaxpayerType.YATT_QATIY]: "YATT — qat'iy belgilangan soliq",
};

export interface TaxResult {
  taxpayerType: TaxpayerType;
  annualRevenue: number;
  breakdown: Record<string, number>;
  totalAnnualTax: number;
  totalMonthlyTax: number;
  effectiveRate: number;
  notes: string[];
  disclaimer: string;
}

export interface BusinessPlanFinancials {
  initialInvestment: number;
  monthlyExpenses: number;
  expectedMonthlyRevenue: number;
  breakEvenMonths: number;
  notes: string;
}

export interface BusinessPlanContent {
  executiveSummary: string;
  businessDescription: string;
  marketAnalysis: string;
  targetAudience: string;
  marketingStrategy: string;
  operationalPlan: string;
  financialPlan: BusinessPlanFinancials;
  risks: string[];
  recommendations: string[];
  disclaimer?: string;
}

export interface BusinessPlan {
  id: string;
  title: string;
  industry: string;
  content: BusinessPlanContent;
  initialInvestment: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketAnalysisResult {
  industry: string;
  location: string;
  generatedAt: string;
  marketOverview: string;
  estimatedMarketSize: string;
  competitors: string[];
  customerSegments: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  entryBarriers: string[];
  recommendations: string[];
  disclaimer?: string;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export const INCOME_CATEGORIES = [
  'Savdo daromadi',
  "Xizmat ko‘rsatish",
  'Ijara daromadi',
  'Boshqa daromad',
];

export const EXPENSE_CATEGORIES = [
  "Ijara to‘lovi",
  'Xodimlar maoshi',
  'Tovar-xomashyo',
  'Kommunal xizmatlar',
  'Transport',
  'Reklama',
  "Soliq to‘lovi",
  'Boshqa xarajat',
];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note?: string | null;
  occurredAt: string;
  createdAt: string;
}

export type StatsPeriod = 'today' | 'week' | 'month' | 'all';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
}

export interface PeriodSummary {
  period: StatsPeriod;
  periodLabel: string;
  from: string;
  to: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
}

// ---------- Admin panel ----------

export type PlatformFilter = 'web' | 'telegram' | 'both' | 'none';

export interface AdminUser extends User {
  hasWebLogin: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  lastPlatform: 'web' | 'telegram' | null;
  lastSeenAt: string | null;
}

export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    web: number;
    telegram: number;
    both: number;
    webOnly: number;
    telegramOnly: number;
    blocked: number;
    admins: number;
    newToday: number;
    newThisWeek: number;
    activeToday: number;
    activeThisWeek: number;
  };
  businessTypeBreakdown: { businessType: BusinessType; count: number }[];
  activity: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    totalBusinessPlans: number;
    totalLoanCalculations: number;
    totalChatConversations: number;
  };
  generatedAt: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  stats: {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    businessPlansCount: number;
    loanCalculationsCount: number;
    chatConversations: number;
    chatMessages: number;
  };
  recentTransactions: Transaction[];
}

// ---------- Bank takliflari (bank.uz) ----------

export type BankOfferCategory =
  | 'biznes'
  | 'avtokredit'
  | 'ipoteka'
  | 'mikroqarz'
  | 'boshqa';

export const BANK_OFFER_CATEGORY_LABELS: Record<BankOfferCategory, string> = {
  biznes: 'Biznes uchun',
  avtokredit: 'Avtokredit',
  ipoteka: 'Ipoteka',
  mikroqarz: "Mikroqarz / naqd kredit",
  boshqa: 'Boshqa',
};

export interface BankCreditOffer {
  id: string;
  bankName: string;
  productName: string;
  imageUrl: string | null;
  interestRate: string;
  term: string;
  downPayment: string;
  amount: string;
  badges: string[];
  detailUrl: string | null;
  category: BankOfferCategory;
  amountMaxSom: number | null;
  termMaxMonths: number | null;
  interestRateValue: number | null;
}

export interface BankCreditOffersResult {
  offers: BankCreditOffer[];
  page: number;
  totalPages: number;
  fetchedAt: string;
}