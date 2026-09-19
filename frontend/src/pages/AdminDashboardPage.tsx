import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/endpoints';
import { AdminDashboardStats, BUSINESS_TYPE_LABELS } from '../api/types';
import { formatSum } from '../utils/format';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch(() => setError("Statistikani yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state">Yuklanmoqda...</div>;
  if (error) return <div className="alert error">{error}</div>;
  if (!stats) return null;

  const maxBusinessType = Math.max(1, ...stats.businessTypeBreakdown.map((b) => b.count));
  const platformMax = Math.max(1, stats.users.webOnly, stats.users.telegramOnly, stats.users.both);

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">🛠️ Admin panel</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Platformaning umumiy holati va foydalanuvchilar statistikasi
          </p>
        </div>
        <Link to="/admin/users"><button>Foydalanuvchilarni boshqarish →</button></Link>
      </div>

      <div className="grid grid-3">
        <div className="stat-tile">
          <div className="label">Jami foydalanuvchilar</div>
          <div className="value">{stats.users.total}</div>
        </div>
        <div className="stat-tile income">
          <div className="label">Bugun ro'yxatdan o'tgan</div>
          <div className="value">{stats.users.newToday}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Bugun faol bo'lgan</div>
          <div className="value">{stats.users.activeToday}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Platforma bo'yicha foydalanuvchilar</h3>
          <div className="bar-chart">
            <div className="bar-row">
              <span>🌐 Faqat veb-sayt</span>
              <div className="bar-track">
                <div className="bar-fill income" style={{ width: `${(stats.users.webOnly / platformMax) * 100}%` }} />
              </div>
              <span>{stats.users.webOnly}</span>
            </div>
            <div className="bar-row">
              <span>🤖 Faqat Telegram</span>
              <div className="bar-track">
                <div className="bar-fill expense" style={{ width: `${(stats.users.telegramOnly / platformMax) * 100}%` }} />
              </div>
              <span>{stats.users.telegramOnly}</span>
            </div>
            <div className="bar-row">
              <span>🔗 Ikkalasi ham</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(stats.users.both / platformMax) * 100}%`, background: 'var(--primary)' }}
                />
              </div>
              <span>{stats.users.both}</span>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            Bu haftada faol: <b style={{ color: 'var(--text)' }}>{stats.users.activeThisWeek}</b> ·
            {' '}Bloklangan: <b style={{ color: 'var(--danger)' }}>{stats.users.blocked}</b> ·
            {' '}Adminlar: <b style={{ color: 'var(--text)' }}>{stats.users.admins}</b>
          </div>
        </div>

        <div className="card">
          <h3>Biznes turi bo'yicha</h3>
          <div className="bar-chart">
            {stats.businessTypeBreakdown.map((b) => (
              <div className="bar-row" key={b.businessType}>
                <span>{BUSINESS_TYPE_LABELS[b.businessType]}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(b.count / maxBusinessType) * 100}%`, background: 'var(--primary)' }}
                  />
                </div>
                <span>{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Platformadagi umumiy faoliyat</h3>
        <div className="grid grid-3">
          <div className="stat-tile income">
            <div className="label">Jami kirim (barcha foydalanuvchilar)</div>
            <div className="value">{formatSum(stats.activity.totalIncome)}</div>
          </div>
          <div className="stat-tile expense">
            <div className="label">Jami chiqim</div>
            <div className="value">{formatSum(stats.activity.totalExpense)}</div>
          </div>
          <div className="stat-tile">
            <div className="label">Jami operatsiyalar soni</div>
            <div className="value">{stats.activity.totalTransactions}</div>
          </div>
          <div className="stat-tile">
            <div className="label">Yaratilgan biznes-rejalar</div>
            <div className="value">{stats.activity.totalBusinessPlans}</div>
          </div>
          <div className="stat-tile">
            <div className="label">Kredit hisob-kitoblari</div>
            <div className="value">{stats.activity.totalLoanCalculations}</div>
          </div>
          <div className="stat-tile">
            <div className="label">AI suhbatlar soni</div>
            <div className="value">{stats.activity.totalChatConversations}</div>
          </div>
        </div>
      </div>
    </div>
  );
}