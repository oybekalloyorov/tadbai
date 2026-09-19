import { FormEvent, useEffect, useState } from 'react';
import { transactionsApi } from '../api/endpoints';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PeriodSummary,
  StatsPeriod,
  Transaction,
  TransactionType,
} from '../api/types';
import { formatDate, formatSum } from '../utils/format';
import { extractErrorMessage } from '../api/client';

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: 'Bu hafta' },
  { value: 'month', label: 'Bu oy' },
  { value: 'all', label: 'Barcha vaqt' },
];

export default function TransactionsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: TransactionType.INCOME,
    amount: '',
    category: INCOME_CATEGORIES[0],
    note: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([transactionsApi.summary(period), transactionsApi.recent(15)])
      .then(([s, r]) => {
        setSummary(s);
        setRecent(r);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const categories = form.type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (type: TransactionType) => {
    const cats = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm((f) => ({ ...f, type, category: cats[0] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await transactionsApi.create({
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        note: form.note || undefined,
      });
      setForm((f) => ({ ...f, amount: '', note: '' }));
      setShowForm(false);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const maxAmount = Math.max(
    1,
    ...(summary?.incomeByCategory || []).map((c) => c.amount),
    ...(summary?.expenseByCategory || []).map((c) => c.amount),
  );

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">💰 Kirim-chiqim</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Moliyaviy operatsiyalaringizni kuzatib boring</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Bekor qilish' : '+ Yangi yozuv'}</button>
      </div>

      {showForm && (
        <div className="card">
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="tabs">
              <button
                type="button"
                className={`tab-btn${form.type === TransactionType.INCOME ? ' active' : ''}`}
                onClick={() => handleTypeChange(TransactionType.INCOME)}
              >
                📈 Kirim
              </button>
              <button
                type="button"
                className={`tab-btn${form.type === TransactionType.EXPENSE ? ' active' : ''}`}
                onClick={() => handleTypeChange(TransactionType.EXPENSE)}
              >
                📉 Chiqim
              </button>
            </div>
            <div className="form-row">
              <label>
                Summasi (so'mda)
                <input
                  type="number"
                  required
                  min={1}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="500000"
                />
              </label>
              <label>
                Turkum
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Izoh (ixtiyoriy)
              <input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Noutbuk sotildi"
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </div>
      )}

      <div className="tabs">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`tab-btn${period === p.value ? ' active' : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid grid-3">
            <div className="stat-tile income">
              <div className="label">Kirim</div>
              <div className="value">{formatSum(summary?.totalIncome)}</div>
            </div>
            <div className="stat-tile expense">
              <div className="label">Chiqim</div>
              <div className="value">{formatSum(summary?.totalExpense)}</div>
            </div>
            <div className="stat-tile">
              <div className="label">Sof foyda</div>
              <div className="value" style={{ color: (summary?.net || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatSum(summary?.net)}
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Kirim turkumlari</h3>
              {summary?.incomeByCategory?.length ? (
                <div className="bar-chart">
                  {summary.incomeByCategory.map((c) => (
                    <div className="bar-row" key={c.category}>
                      <span>{c.category}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill income"
                          style={{ width: `${(c.amount / maxAmount) * 100}%` }}
                        />
                      </div>
                      <span>{formatSum(c.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">Bu davrda kirim yo'q</p>
              )}
            </div>
            <div className="card">
              <h3>Chiqim turkumlari</h3>
              {summary?.expenseByCategory?.length ? (
                <div className="bar-chart">
                  {summary.expenseByCategory.map((c) => (
                    <div className="bar-row" key={c.category}>
                      <span>{c.category}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill expense"
                          style={{ width: `${(c.amount / maxAmount) * 100}%` }}
                        />
                      </div>
                      <span>{formatSum(c.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">Bu davrda chiqim yo'q</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3>So'nggi yozuvlar</h3>
            {recent.length === 0 ? (
              <p className="empty-state">Hali yozuvlar yo'q</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Turi</th>
                    <th>Turkum</th>
                    <th>Summasi</th>
                    <th>Izoh</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className={`badge ${tx.type}`}>
                          {tx.type === 'income' ? 'Kirim' : 'Chiqim'}
                        </span>
                      </td>
                      <td>{tx.category}</td>
                      <td>{formatSum(Number(tx.amount))}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{tx.note || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(tx.occurredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
