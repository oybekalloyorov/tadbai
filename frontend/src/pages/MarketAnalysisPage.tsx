import { FormEvent, useState } from 'react';
import { marketAnalysisApi } from '../api/endpoints';
import { MarketAnalysisResult } from '../api/types';
import { extractErrorMessage } from '../api/client';

export default function MarketAnalysisPage() {
  const [form, setForm] = useState({
    industry: '',
    location: '',
    productDescription: '',
  });
  const [result, setResult] = useState<MarketAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await marketAnalysisApi.analyze({
        industry: form.industry,
        location: form.location,
        productDescription: form.productDescription || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">📈 Bozor tahlili</h1>
      <p className="page-subtitle">AI yordamida soha va joylashuv bo'yicha bozorni tahlil qiling</p>

      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Soha
              <input required value={form.industry} onChange={update('industry')} placeholder="Fitnes-klub xizmatlari" />
            </label>
            <label>
              Joylashuv
              <input required value={form.location} onChange={update('location')} placeholder="Toshkent shahri, Yunusobod tumani" />
            </label>
          </div>
          <label>
            Mahsulot/xizmat tavsifi (ixtiyoriy)
            <textarea
              value={form.productDescription}
              onChange={update('productDescription')}
              placeholder="Premium fitnes-klub, shaxsiy murabbiylar bilan"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Tahlil qilinmoqda...' : 'Tahlil qilish'}
          </button>
        </form>
      </div>

      {result && (
        <>
          <div className="card">
            <h3>Bozor umumiy holati</h3>
            <p>{result.marketOverview}</p>
            <p>
              <b>Taxminiy bozor hajmi:</b> {result.estimatedMarketSize}{' '}
              <span style={{ fontSize: 12, color: 'var(--warning)' }}>(🟡 AI taxmini)</span>
            </p>
          </div>

          {result.dataSources && result.dataSources.length > 0 && (
            <div className="card">
              <h3>✅ Tasdiqlangan manbalar</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -6 }}>
                Bu tahlilda quyidagi rasmiy manbalardagi haqiqiy raqamlar ishlatildi —
                bular AI taxmini emas.
              </p>
              <ul>
                {result.dataSources.map((ds, i) => (
                  <li key={i}>
                    <b>{ds.label}</b> — {ds.source}
                    {ds.sourceUrl && (
                      <>
                        {' '}
                        (
                        <a href={ds.sourceUrl} target="_blank" rel="noopener noreferrer">
                          {ds.sourceUrl}
                        </a>
                        )
                      </>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}> — {ds.dataAsOf} holatiga</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-2">
            <div className="card">
              <h3>Raqobatchilar</h3>
              <ul>{result.competitors?.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
            <div className="card">
              <h3>Mijozlar segmentlari</h3>
              <ul>{result.customerSegments?.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          </div>

          <div className="card">
            <h3>SWOT tahlili</h3>
            <div className="grid grid-2">
              <div>
                <b style={{ color: 'var(--success)' }}>💪 Kuchli tomonlar</b>
                <ul>{result.swot?.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div>
                <b style={{ color: 'var(--danger)' }}>⚠️ Zaif tomonlar</b>
                <ul>{result.swot?.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div>
                <b style={{ color: 'var(--primary)' }}>🚀 Imkoniyatlar</b>
                <ul>{result.swot?.opportunities?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div>
                <b style={{ color: 'var(--warning)' }}>🔥 Tahdidlar</b>
                <ul>{result.swot?.threats?.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Bozorga kirish to'siqlari</h3>
            <ul>{result.entryBarriers?.map((b, i) => <li key={i}>{b}</li>)}</ul>
          </div>

          <div className="card">
            <h3>Tavsiyalar</h3>
            <ul>{result.recommendations?.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>

          {result.disclaimer && <div className="disclaimer">⚠️ {result.disclaimer}</div>}
        </>
      )}
    </div>
  );
}