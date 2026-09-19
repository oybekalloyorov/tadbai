import { FormEvent, useState } from 'react';
import { taxApi } from '../api/endpoints';
import { TAXPAYER_TYPE_LABELS, TaxResult, TaxpayerType } from '../api/types';
import { formatSum } from '../utils/format';
import { extractErrorMessage } from '../api/client';

const REGIONS = [
  { value: 'toshkent_shahar', label: 'Toshkent shahri' },
  { value: 'toshkent_viloyat', label: 'Toshkent viloyati' },
  { value: 'boshqa_viloyatlar', label: 'Boshqa viloyatlar' },
];

export default function TaxCalculatorPage() {
  const [form, setForm] = useState({
    taxpayerType: TaxpayerType.YAGONA_SOLIQ,
    annualRevenue: '500000000',
    annualExpenses: '350000000',
    region: 'toshkent_shahar',
  });
  const [result, setResult] = useState<TaxResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await taxApi.calculate({
        taxpayerType: form.taxpayerType,
        annualRevenue: Number(form.annualRevenue),
        annualExpenses:
          form.taxpayerType === TaxpayerType.QQS_TOLOVCHI
            ? Number(form.annualExpenses)
            : undefined,
        region: form.taxpayerType === TaxpayerType.YATT_QATIY ? form.region : undefined,
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
      <h1 className="page-title">🧾 Soliq kalkulyatori</h1>
      <p className="page-subtitle">Soliq to'lovchi turingizga mos yillik/oylik soliqni hisoblang</p>

      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Soliq to'lovchi turi
            <select value={form.taxpayerType} onChange={update('taxpayerType')}>
              {Object.values(TaxpayerType).map((t) => (
                <option key={t} value={t}>
                  {TAXPAYER_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Yillik yalpi aylanma (so'mda)
            <input
              type="number"
              required
              min={0}
              value={form.annualRevenue}
              onChange={update('annualRevenue')}
            />
          </label>

          {form.taxpayerType === TaxpayerType.QQS_TOLOVCHI && (
            <label>
              Yillik xarajatlar (so'mda)
              <input type="number" min={0} value={form.annualExpenses} onChange={update('annualExpenses')} />
            </label>
          )}

          {form.taxpayerType === TaxpayerType.YATT_QATIY && (
            <label>
              Hudud
              <select value={form.region} onChange={update('region')}>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Hisoblanmoqda...' : 'Hisoblash'}
          </button>
        </form>
      </div>

      {result && (
        <div className="card">
          <h3>Natija</h3>
          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            <div className="stat-tile expense">
              <div className="label">Yillik soliq</div>
              <div className="value">{formatSum(result.totalAnnualTax)}</div>
            </div>
            <div className="stat-tile expense">
              <div className="label">Oylik soliq</div>
              <div className="value">{formatSum(result.totalMonthlyTax)}</div>
            </div>
            <div className="stat-tile">
              <div className="label">Effektiv stavka</div>
              <div className="value">{result.effectiveRate}%</div>
            </div>
          </div>

          <table style={{ marginBottom: 16 }}>
            <tbody>
              {Object.entries(result.breakdown).map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td style={{ textAlign: 'right' }}>{formatSum(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.notes.length > 0 && (
            <div className="alert warning">
              {result.notes.map((n, i) => (
                <div key={i}>{n}</div>
              ))}
            </div>
          )}

          <div className="disclaimer">⚠️ {result.disclaimer}</div>
        </div>
      )}
    </div>
  );
}
