import { api } from './client';
import {
  AuthResponse,
  BusinessPlan,
  ChatResponse,
  LoanResult,
  MarketAnalysisResult,
  PaymentMethod,
  PeriodSummary,
  StatsPeriod,
  TaxResult,
  TaxpayerType,
  Transaction,
  TransactionType,
  User,
} from './types';

// ---------- Auth ----------

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  businessType?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),
};

// ---------- Users ----------

export const usersApi = {
  me: () => api.get<User>('/users/me').then((r) => r.data),
  updateMe: (payload: Partial<RegisterPayload>) =>
    api.patch<User>('/users/me', payload).then((r) => r.data),
  removeMe: () => api.delete('/users/me').then((r) => r.data),
};

// ---------- Loan calculator ----------

export interface CalculateLoanPayload {
  loanAmount: number;
  annualRate: number;
  termMonths: number;
  paymentMethod?: PaymentMethod;
  downPayment?: number;
}

export const loanApi = {
  calculate: (payload: CalculateLoanPayload) =>
    api.post<LoanResult>('/loan-calculator/calculate', payload).then((r) => r.data),
  calculateAndSave: (payload: CalculateLoanPayload) =>
    api
      .post<LoanResult & { id: string; savedAt: string }>(
        '/loan-calculator/calculate-and-save',
        payload,
      )
      .then((r) => r.data),
  history: () =>
    api.get<(LoanResult & { id: string; createdAt: string })[]>(
      '/loan-calculator/history',
    ).then((r) => r.data),
};

// ---------- Tax calculator ----------

export interface CalculateTaxPayload {
  taxpayerType: TaxpayerType;
  annualRevenue: number;
  annualExpenses?: number;
  region?: string;
}

export const taxApi = {
  calculate: (payload: CalculateTaxPayload) =>
    api.post<TaxResult>('/tax-calculator/calculate', payload).then((r) => r.data),
};

// ---------- Business plan ----------

export interface GenerateBusinessPlanPayload {
  businessIdea: string;
  industry: string;
  location: string;
  initialInvestment: number;
  targetAudience?: string;
  competitiveAdvantage?: string;
}

export const businessPlanApi = {
  generate: (payload: GenerateBusinessPlanPayload) =>
    api.post<BusinessPlan>('/business-plan/generate', payload).then((r) => r.data),
  list: () => api.get<BusinessPlan[]>('/business-plan').then((r) => r.data),
  getOne: (id: string) =>
    api.get<BusinessPlan>(`/business-plan/${id}`).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/business-plan/${id}`).then((r) => r.data),
};

// ---------- Market analysis ----------

export interface AnalyzeMarketPayload {
  industry: string;
  location: string;
  productDescription?: string;
}

export const marketAnalysisApi = {
  analyze: (payload: AnalyzeMarketPayload) =>
    api
      .post<MarketAnalysisResult>('/market-analysis/analyze', payload)
      .then((r) => r.data),
};

// ---------- Chat ----------

export const chatApi = {
  sendMessage: (message: string, conversationId?: string) =>
    api
      .post<ChatResponse>('/chat/message', { message, conversationId })
      .then((r) => r.data),
  conversations: () =>
    api
      .get<{ conversationId: string; lastMessageAt: string }[]>(
        '/chat/conversations',
      )
      .then((r) => r.data),
  conversation: (conversationId: string) =>
    api
      .get(`/chat/conversations/${conversationId}`)
      .then((r) => r.data),
};

// ---------- Transactions ----------

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  occurredAt?: string;
}

export const transactionsApi = {
  create: (payload: CreateTransactionPayload) =>
    api.post<Transaction>('/transactions', payload).then((r) => r.data),
  summary: (period: StatsPeriod = 'month') =>
    api
      .get<PeriodSummary>('/transactions/summary', { params: { period } })
      .then((r) => r.data),
  recent: (limit = 10) =>
    api
      .get<Transaction[]>('/transactions/recent', { params: { limit } })
      .then((r) => r.data),
};
