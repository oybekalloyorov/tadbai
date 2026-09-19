import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/client';
import { BUSINESS_TYPE_LABELS, BusinessType } from '../api/types';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    companyName: '',
    businessType: BusinessType.YATT,
  });
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
      await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone || undefined,
        companyName: form.companyName || undefined,
        businessType: form.businessType,
      });
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1>Ro'yxatdan o'tish</h1>
        <p className="subtitle">Bir necha daqiqada boshlang</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            To'liq ism
            <input required value={form.fullName} onChange={update('fullName')} placeholder="Aliyev Vali" />
          </label>
          <label>
            Elektron pochta
            <input type="email" required value={form.email} onChange={update('email')} placeholder="tadbirkor@mail.uz" />
          </label>
          <label>
            Parol
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update('password')}
              placeholder="Kamida 6 belgi"
            />
          </label>
          <label>
            Telefon raqam (ixtiyoriy)
            <input value={form.phone} onChange={update('phone')} placeholder="+998901234567" />
          </label>
          <label>
            Kompaniya nomi (ixtiyoriy)
            <input value={form.companyName} onChange={update('companyName')} placeholder="Tezkor Savdo MCHJ" />
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
          <button type="submit" disabled={loading}>
            {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Hisobingiz bormi? <Link to="/login">Kirish</Link>
        </p>
      </div>
    </div>
  );
}
