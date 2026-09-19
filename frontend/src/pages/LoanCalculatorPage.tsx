import { FormEvent, useState } from 'react';
import { loanApi } from '../api/endpoints';
import { LoanResult, PaymentMethod } from '../api/types';
import { formatSum } from '../utils/format';
import { extractErrorMessage } from '../api/client';

export default function LoanCalculatorPage() {
  const [form, setForm] = useState({
    loanAmount: '50000000',
    annualRate: '24',
    termMonths: '12',
    paymentMethod: PaymentMethod.ANNUITET,
    downPayment: '0',
  });
  const [result, setResult] = useState<LoanResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const data = await loanApi.calculate({
        loanAmount: Number(form.loanAmount),
        annualRate: Number(form.annualRate),
        termMonths: Number(form.termMonths),
        paymentMethod: form.paymentMethod,
        downPayment: Number(form.downPayment) || 0,
      });
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await loanApi.calculateAndSave({
        loanAmount: Number(form.loanAmount),
        annualRate: Number(form.annualRate),
        termMonths: Number(form.termMonths),
        paymentMethod: form.paymentMethod,
        downPayment: Number(form.downPayment) || 0,
      });
      setSaved(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="page-title">🏦 Kredit kalkulyatori</h1>
      <p className="page-subtitle">Annuitet yoki differensial usulda oylik to'lovlarni hisoblang</p>

      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Kredit summasi (so'mda)
              <input type="number" required min={100000} value={form.loanAmount} onChange={update('loanAmount')} />
            </label>
            <label>
              Yillik foiz stavkasi (%)
              <input type="number" required min={0} max={100} step="0.1" value={form.annualRate} onChange={update('annualRate')} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Muddat (oy)
              <input type="number" required min={1} max={360} value={form.termMonths} onChange={update('termMonths')} />
            </label>
            <label>
              Boshlang'ich to'lov (ixtiyoriy)
              <input type="number" min={0} value={form.downPayment} onChange={update('downPayment')} />
            </label>
          </div>
          <label>
            To'lov usuli
            <select value={form.paymentMethod} onChange={update('paymentMethod')}>
              <option value={PaymentMethod.ANNUITET}>Annuitet (teng to'lovlar)</option>
              <option value={PaymentMethod.DIFFERENSIAL}>Differensial (kamayib boruvchi)</option>
            </select>
          </label>
          <div className="btn-row">
            <button type="submit" disabled={loading}>
              {loading ? 'Hisoblanmoqda...' : 'Hisoblash'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card">
          <div className="top-bar">
            <h3 style={{ margin: 0 }}>Natija</h3>
            <button className="secondary" onClick={handleSave}>
              {saved ? '✅ Saqlandi' : 'Profilga saqlash'}
            </button>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            {result.monthlyPayment !== null ? (
              <div className="stat-tile">
                <div className="label">Oylik to'lov</div>
                <div className="value">{formatSum(result.monthlyPayment)}</div>
              </div>
            ) : (
              <>
                <div className="stat-tile">
                  <div className="label">Birinchi to'lov</div>
                  <div className="value">{formatSum(result.firstPayment)}</div>
                </div>
                <div className="stat-tile">
                  <div className="label">Oxirgi to'lov</div>
                  <div className="value">{formatSum(result.lastPayment)}</div>
                </div>
              </>
            )}
            <div className="stat-tile">
              <div className="label">Jami to'lov</div>
              <div className="value">{formatSum(result.totalPayment)}</div>
            </div>
            <div className="stat-tile expense">
              <div className="label">Jami foiz</div>
              <div className="value">{formatSum(result.totalInterest)}</div>
            </div>
          </div>

          <h3>To'lovlar jadvali</h3>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Oy</th>
                  <th>To'lov</th>
                  <th>Asosiy qarz</th>
                  <th>Foiz</th>
                  <th>Qolgan qarz</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatSum(row.payment)}</td>
                    <td>{formatSum(row.principal)}</td>
                    <td>{formatSum(row.interest)}</td>
                    <td>{formatSum(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
