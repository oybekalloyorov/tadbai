import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../api/endpoints';
import { PeriodSummary, Transaction } from '../api/types';
import { formatDate, formatSum } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      transactionsApi.summary('month'),
      transactionsApi.recent(5),
    ])
      .then(([s, r]) => {
        setSummary(s);
        setRecent(r);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Xush kelibsiz, {user?.fullName?.split(' ')[0]}!</h1>
      <p className="page-subtitle">Biznesingizning umumiy holati — {summary?.periodLabel || 'bu oy'}</p>

      {loading ? (
        <div className="empty-state">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid grid-3" style={{ marginBottom: 8 }}>
            <div className="stat-tile income">
              <div className="label">Kirim (bu oy)</div>
              <div className="value">{formatSum(summary?.totalIncome)}</div>
            </div>
            <div className="stat-tile expense">
              <div className="label">Chiqim (bu oy)</div>
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
              <h3>So'nggi operatsiyalar</h3>
              {recent.length === 0 ? (
                <p className="empty-state">Hali yozuvlar yo'q. <Link to="/transactions">Birinchi yozuvni qo'shing</Link>.</p>
              ) : (
                <table>
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
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {formatDate(tx.occurredAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: 16 }}>
                <Link to="/transactions">Barchasini ko'rish →</Link>
              </div>
            </div>

            <div className="card">
              <h3>Tezkor amallar</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/transactions" className="nav-link" style={{ background: 'var(--surface-2)' }}>
                  💰 Kirim/chiqim qo'shish
                </Link>
                <Link to="/loan-calculator" className="nav-link" style={{ background: 'var(--surface-2)' }}>
                  🏦 Kredit hisoblash
                </Link>
                <Link to="/tax-calculator" className="nav-link" style={{ background: 'var(--surface-2)' }}>
                  🧾 Soliqni hisoblash
                </Link>
                <Link to="/business-plan" className="nav-link" style={{ background: 'var(--surface-2)' }}>
                  📋 Biznes-reja yaratish
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
