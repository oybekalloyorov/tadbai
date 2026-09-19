import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_TYPE_LABELS, BusinessType } from '../api/types';
import { extractErrorMessage } from '../api/client';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    companyName: '',
    businessType: BusinessType.YATT,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        businessType: user.businessType,
      });
    }
  }, [user]);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await usersApi.updateMe(form);
      await refreshUser();
      setMessage("Profil muvaffaqiyatli yangilandi");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Akkauntingizni butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
      return;
    }
    await usersApi.removeMe();
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h1 className="page-title">👤 Profil</h1>
      <p className="page-subtitle">Hisobingiz ma'lumotlarini boshqaring</p>

      <div className="card" style={{ maxWidth: 480 }}>
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Elektron pochta
            <input value={user?.email || ''} disabled />
          </label>
          <label>
            To'liq ism
            <input required value={form.fullName} onChange={update('fullName')} />
          </label>
          <label>
            Telefon raqam
            <input value={form.phone} onChange={update('phone')} placeholder="+998901234567" />
          </label>
          <label>
            Kompaniya nomi
            <input value={form.companyName} onChange={update('companyName')} />
          </label>
          <label>
            Biznes turi
            <select value={form.businessType} onChange={update('businessType')}>
              {Object.values(BusinessType).map((bt) => (
                <option key={bt} value={bt}>
                  {BUSINESS_TYPE_LABELS[bt]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : "Saqlash"}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 480, borderColor: 'var(--danger)' }}>
        <h3 style={{ color: 'var(--danger)' }}>Xavfli hudud</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Akkauntingizni o'chirish barcha ma'lumotlaringizni (kredit hisob-kitoblari, biznes-rejalar,
          kirim-chiqim yozuvlari) butunlay o'chirib tashlaydi.
        </p>
        <button className="danger" onClick={handleDeleteAccount}>
          Akkauntni o'chirish
        </button>
      </div>
    </div>
  );
}
