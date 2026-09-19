import { FormEvent, useEffect, useState } from 'react';
import { businessPlanApi } from '../api/endpoints';
import { BusinessPlan } from '../api/types';
import { formatDate, formatSum } from '../utils/format';
import { extractErrorMessage } from '../api/client';

export default function BusinessPlanPage() {
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [selected, setSelected] = useState<BusinessPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    businessIdea: '',
    industry: '',
    location: '',
    initialInvestment: '150000000',
    targetAudience: '',
    competitiveAdvantage: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const loadPlans = () => {
    setListLoading(true);
    businessPlanApi
      .list()
      .then(setPlans)
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const plan = await businessPlanApi.generate({
        businessIdea: form.businessIdea,
        industry: form.industry,
        location: form.location,
        initialInvestment: Number(form.initialInvestment),
        targetAudience: form.targetAudience || undefined,
        competitiveAdvantage: form.competitiveAdvantage || undefined,
      });
      setSelected(plan);
      setShowForm(false);
      loadPlans();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await businessPlanApi.remove(id);
    if (selected?.id === id) setSelected(null);
    loadPlans();
  };

  if (selected) {
    const c = selected.content;
    return (
      <div>
        <button className="secondary" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>
          ← Ro'yxatga qaytish
        </button>
        <h1 className="page-title">{selected.title}</h1>
        <p className="page-subtitle">{selected.industry} · {formatDate(selected.createdAt)}</p>

        <div className="card">
          <h3>Qisqa mazmun</h3>
          <p>{c.executiveSummary}</p>
        </div>
        <div className="card">
          <h3>Biznes tavsifi</h3>
          <p>{c.businessDescription}</p>
        </div>
        <div className="card">
          <h3>Bozor tahlili</h3>
          <p>{c.marketAnalysis}</p>
        </div>
        <div className="card">
          <h3>Maqsadli auditoriya</h3>
          <p>{c.targetAudience}</p>
        </div>
        <div className="card">
          <h3>Marketing strategiyasi</h3>
          <p>{c.marketingStrategy}</p>
        </div>
        <div className="card">
          <h3>Operatsion reja</h3>
          <p>{c.operationalPlan}</p>
        </div>
        <div className="card">
          <h3>💰 Moliyaviy reja <span style={{ fontSize: 12, color: 'var(--warning)' }}>(🟡 AI taxmini)</span></h3>
          <div className="grid grid-2">
            <div>Boshlang'ich investitsiya: <b>{formatSum(c.financialPlan?.initialInvestment)}</b></div>
            <div>Oylik xarajatlar: <b>{formatSum(c.financialPlan?.monthlyExpenses)}</b></div>
            <div>Kutilayotgan oylik daromad: <b>{formatSum(c.financialPlan?.expectedMonthlyRevenue)}</b></div>
            <div>O'zini oqlash muddati: <b>{c.financialPlan?.breakEvenMonths} oy</b></div>
          </div>
          {c.financialPlan?.notes && <p style={{ marginTop: 12 }}>{c.financialPlan.notes}</p>}
        </div>
        <div className="card">
          <h3>Risklar</h3>
          <ul>{c.risks?.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
        <div className="card">
          <h3>Tavsiyalar</h3>
          <ul>{c.recommendations?.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
        {c.disclaimer && <div className="disclaimer">⚠️ {c.disclaimer}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">📋 Biznes-reja generatori</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>AI yordamida biznes-g'oyangiz uchun to'liq reja tuzing</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Bekor qilish' : '+ Yangi biznes-reja'}</button>
      </div>

      {showForm && (
        <div className="card">
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                Biznes g'oyasi
                <input required value={form.businessIdea} onChange={update('businessIdea')} placeholder="Fast-food restorani" />
              </label>
              <label>
                Faoliyat sohasi
                <input required value={form.industry} onChange={update('industry')} placeholder="Oziq-ovqat va restoran xizmatlari" />
              </label>
            </div>
            <div className="form-row">
              <label>
                Joylashuv
                <input required value={form.location} onChange={update('location')} placeholder="Toshkent shahri, Chilonzor tumani" />
              </label>
              <label>
                Boshlang'ich investitsiya (so'mda)
                <input type="number" required min={0} value={form.initialInvestment} onChange={update('initialInvestment')} />
              </label>
            </div>
            <label>
              Maqsadli auditoriya (ixtiyoriy)
              <textarea value={form.targetAudience} onChange={update('targetAudience')} placeholder="Yosh oilalar va ofis xodimlari" />
            </label>
            <label>
              Raqobatdagi ustunlik (ixtiyoriy)
              <textarea value={form.competitiveAdvantage} onChange={update('competitiveAdvantage')} placeholder="Sifatli va tez xizmat, qulay narx" />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? '⏳ AI tayyorlamoqda (10-30 soniya)...' : 'Biznes-reja yaratish'}
            </button>
          </form>
        </div>
      )}

      {listLoading ? (
        <div className="empty-state">Yuklanmoqda...</div>
      ) : plans.length === 0 && !showForm ? (
        <div className="empty-state">Hali biznes-reja yaratilmagan. Yuqoridagi tugma orqali birinchisini yarating.</div>
      ) : (
        plans.map((plan) => (
          <div key={plan.id} className="list-item-card" onClick={() => setSelected(plan)}>
            <div className="top-bar" style={{ marginBottom: 0 }}>
              <div>
                <b>{plan.title}</b>
                <div className="meta">{plan.industry} · {formatDate(plan.createdAt)}</div>
              </div>
              <button
                className="secondary danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(plan.id);
                }}
              >
                O'chirish
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
