import { useEffect, useState } from 'react';
import { adminApi, AdminUsersQuery } from '../api/endpoints';
import {
  AdminUser,
  AdminUserDetail,
  BUSINESS_TYPE_LABELS,
  BusinessType,
} from '../api/types';
import { formatDate, formatSum } from '../utils/format';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

function PlatformBadges({ user }: { user: AdminUser }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {user.hasWebLogin && (
        <span className="badge income" title="Veb-saytdan foydalangan">🌐 Web</span>
      )}
      {user.telegramChatId && (
        <span className="badge expense" title="Telegram botdan foydalangan">🤖 Bot</span>
      )}
      {!user.hasWebLogin && !user.telegramChatId && (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
      )}
    </span>
  );
}

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [filters, setFilters] = useState<AdminUsersQuery>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState<{ items: AdminUser[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = () => {
    setLoading(true);
    adminApi
      .users(filters)
      .then((res) => setData(res))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setActionError('');
    adminApi
      .userDetail(id)
      .then(setDetail)
      .catch((err) => setActionError(extractErrorMessage(err)))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleToggleStatus = async (u: AdminUser) => {
    setActionError('');
    try {
      await adminApi.updateStatus(u.id, !u.isActive);
      load();
      if (selectedId === u.id) openDetail(u.id);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const handleToggleRole = async (u: AdminUser) => {
    setActionError('');
    try {
      await adminApi.updateRole(u.id, u.role === 'admin' ? 'user' : 'admin');
      load();
      if (selectedId === u.id) openDetail(u.id);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`${u.fullName}ni butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) return;
    setActionError('');
    try {
      await adminApi.removeUser(u.id);
      closeDetail();
      load();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="page-title">👥 Foydalanuvchilar</h1>
      <p className="page-subtitle">Barcha ro'yxatdan o'tgan foydalanuvchilar — veb-sayt va Telegram bot orqali</p>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>
            Qidiruv
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ism, email, telefon yoki kompaniya"
            />
          </label>
          <label>
            Platforma
            <select
              value={filters.platform || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, platform: (e.target.value || undefined) as any, page: 1 }))
              }
            >
              <option value="">Barchasi</option>
              <option value="web">Faqat veb-sayt</option>
              <option value="telegram">Faqat Telegram</option>
              <option value="both">Ikkalasi ham</option>
              <option value="none">Hech biri</option>
            </select>
          </label>
          <label>
            Biznes turi
            <select
              value={filters.businessType || ''}
              onChange={(e) => setFilters((f) => ({ ...f, businessType: e.target.value || undefined, page: 1 }))}
            >
              <option value="">Barchasi</option>
              {Object.values(BusinessType).map((bt) => (
                <option key={bt} value={bt}>{BUSINESS_TYPE_LABELS[bt]}</option>
              ))}
            </select>
          </label>
          <label>
            Holati
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as any, page: 1 }))}
            >
              <option value="">Barchasi</option>
              <option value="active">Faol</option>
              <option value="blocked">Bloklangan</option>
            </select>
          </label>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {selectedId && (
        <div className="card" style={{ borderColor: 'var(--primary)' }}>
          <div className="top-bar">
            <h3 style={{ margin: 0 }}>Foydalanuvchi tafsilotlari</h3>
            <button className="secondary" onClick={closeDetail}>Yopish</button>
          </div>

          {detailLoading ? (
            <div className="empty-state">Yuklanmoqda...</div>
          ) : detail ? (
            <>
              {actionError && <div className="alert error">{actionError}</div>}
              <div className="grid grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div><b>{detail.user.fullName}</b></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{detail.user.email}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{detail.user.phone || 'Telefon kiritilmagan'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{detail.user.companyName || '—'}</div>
                  <div style={{ marginTop: 8 }}><PlatformBadges user={detail.user} /></div>
                </div>
                <div>
                  <div>Ro'yxatdan o'tgan: {formatDate(detail.user.createdAt)}</div>
                  <div>Oxirgi faollik: {detail.user.lastSeenAt ? formatDate(detail.user.lastSeenAt) : "Ma'lumot yo'q"}</div>
                  <div>Rol: <span className={`badge ${detail.user.role === 'admin' ? 'expense' : 'income'}`}>{detail.user.role}</span></div>
                  <div>Holati: <span className={`badge ${detail.user.isActive ? 'income' : 'expense'}`}>{detail.user.isActive ? 'Faol' : 'Bloklangan'}</span></div>
                </div>
              </div>

              <div className="grid grid-3" style={{ marginBottom: 16 }}>
                <div className="stat-tile income">
                  <div className="label">Jami kirim</div>
                  <div className="value">{formatSum(detail.stats.totalIncome)}</div>
                </div>
                <div className="stat-tile expense">
                  <div className="label">Jami chiqim</div>
                  <div className="value">{formatSum(detail.stats.totalExpense)}</div>
                </div>
                <div className="stat-tile">
                  <div className="label">Operatsiyalar</div>
                  <div className="value">{detail.stats.transactionCount}</div>
                </div>
                <div className="stat-tile">
                  <div className="label">Biznes-rejalar</div>
                  <div className="value">{detail.stats.businessPlansCount}</div>
                </div>
                <div className="stat-tile">
                  <div className="label">Kredit hisob-kitoblari</div>
                  <div className="value">{detail.stats.loanCalculationsCount}</div>
                </div>
                <div className="stat-tile">
                  <div className="label">AI suhbatlar</div>
                  <div className="value">{detail.stats.chatConversations}</div>
                </div>
              </div>

              {detail.recentTransactions.length > 0 && (
                <>
                  <h3>So'nggi operatsiyalar</h3>
                  <table style={{ marginBottom: 16 }}>
                    <tbody>
                      {detail.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td><span className={`badge ${tx.type}`}>{tx.type === 'income' ? 'Kirim' : 'Chiqim'}</span></td>
                          <td>{tx.category}</td>
                          <td>{formatSum(Number(tx.amount))}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(tx.occurredAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <div className="btn-row">
                <button className="secondary" onClick={() => handleToggleStatus(detail.user)}>
                  {detail.user.isActive ? '🚫 Bloklash' : '✅ Blokdan chiqarish'}
                </button>
                <button className="secondary" onClick={() => handleToggleRole(detail.user)}>
                  {detail.user.role === 'admin' ? 'Admin huquqini olish' : 'Admin qilish'}
                </button>
                <button className="danger" onClick={() => handleDelete(detail.user)}>
                  O'chirish
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="empty-state">Yuklanmoqda...</div>
      ) : !data || data.items.length === 0 ? (
        <div className="empty-state">Hech qanday foydalanuvchi topilmadi</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Platforma</th>
                <th>Biznes turi</th>
                <th>Ro'yxatdan o'tgan</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(u.id)}>
                  <td>
                    {u.fullName}
                    {u.role === 'admin' && <span className="badge expense" style={{ marginLeft: 8 }}>admin</span>}
                    {u.id === currentAdmin?.id && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> (siz)</span>}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><PlatformBadges user={u} /></td>
                  <td>{BUSINESS_TYPE_LABELS[u.businessType]}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'income' : 'expense'}`}>
                      {u.isActive ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(u.id);
                      }}
                    >
                      Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="top-bar" style={{ marginTop: 16, marginBottom: 0 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Jami {data.total} ta foydalanuvchi — {filters.page || 1}/{data.totalPages}-sahifa
            </span>
            <div className="btn-row">
              <button
                className="secondary"
                disabled={(filters.page || 1) <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              >
                ← Oldingi
              </button>
              <button
                className="secondary"
                disabled={(filters.page || 1) >= data.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              >
                Keyingi →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}