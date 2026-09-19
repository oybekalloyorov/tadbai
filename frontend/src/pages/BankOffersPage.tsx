import { useEffect, useMemo, useState } from 'react';
import { bankOffersApi } from '../api/endpoints';
import {
  BANK_OFFER_CATEGORY_LABELS,
  BankCreditOffer,
  BankOfferCategory,
} from '../api/types';
import { extractErrorMessage } from '../api/client';

const CATEGORY_OPTIONS: { value: BankOfferCategory | 'barchasi'; label: string }[] = [
  { value: 'barchasi', label: 'Barcha turlar' },
  { value: 'biznes', label: BANK_OFFER_CATEGORY_LABELS.biznes },
  { value: 'mikroqarz', label: BANK_OFFER_CATEGORY_LABELS.mikroqarz },
  { value: 'avtokredit', label: BANK_OFFER_CATEGORY_LABELS.avtokredit },
  { value: 'ipoteka', label: BANK_OFFER_CATEGORY_LABELS.ipoteka },
  { value: 'boshqa', label: BANK_OFFER_CATEGORY_LABELS.boshqa },
];

// "Bank yoki mahsulot nomi" tanlovi bitta <select> ichida ikkita guruhga
// bo'lingan holda saqlanadi: "bank:<nom>" yoki "product:<nom>". Shu tufayli
// foydalanuvchi ham bank, ham aniq mahsulot bo'yicha tanlab filtrlashi mumkin.
const NAME_FILTER_ALL = 'barchasi';

const EMPTY_FILTERS = {
  nameFilter: NAME_FILTER_ALL,
  category: 'barchasi' as BankOfferCategory | 'barchasi',
  minAmount: '',
  minTermMonths: '',
  onlineOnly: false,
};

export default function BankOffersPage() {
  const [offers, setOffers] = useState<BankCreditOffer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const loadPage = async (targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await bankOffersApi.credits(targetPage);
      setOffers(data.offers);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setFetchedAt(data.fetchedAt);
    } catch (err) {
      setError(extractErrorMessage(err));
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedFetchedAt = fetchedAt
    ? new Date(fetchedAt).toLocaleString('uz-UZ')
    : null;

  // Joriy yuklangan takliflardan bank va mahsulot nomlarining takrorlanmas
  // ro'yxatini chiqaramiz — select shu ro'yxat bilan to'ldiriladi.
  const bankNameOptions = useMemo(() => {
    const names = new Set(offers.map((o) => o.bankName).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const productNameOptions = useMemo(() => {
    const names = new Set(
      offers.map((o) => o.productName).filter((n) => n && n !== '-'),
    );
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  // MUHIM: filtr faqat KO'RSATISHNI cheklaydi — `offers` massivi (bank.uz'dan
  // olingan barcha ma'lumot) hech qachon o'zgartirilmaydi yoki qisqartirilmaydi.
  // "Filtrni tozalash" bosilsa hammasi darhol qaytadan ko'rinadi.
  const filteredOffers = useMemo(() => {
    const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
    const minTermMonths = filters.minTermMonths ? Number(filters.minTermMonths) : null;

    return offers.filter((offer) => {
      if (filters.nameFilter !== NAME_FILTER_ALL) {
        const [kind, ...rest] = filters.nameFilter.split(':');
        const value = rest.join(':');
        if (kind === 'bank' && offer.bankName !== value) return false;
        if (kind === 'product' && offer.productName !== value) return false;
      }

      if (filters.category !== 'barchasi' && offer.category !== filters.category) {
        return false;
      }

      // Summasi noma'lum takliflarni yashirmaymiz — ma'lumot yo'qligi
      // "mos kelmaydi" degani emas.
      if (
        minAmount &&
        offer.amountMaxSom !== null &&
        offer.amountMaxSom < minAmount
      ) {
        return false;
      }

      if (
        minTermMonths &&
        offer.termMaxMonths !== null &&
        offer.termMaxMonths < minTermMonths
      ) {
        return false;
      }

      if (filters.onlineOnly && !offer.badges.some((b) => b.toLowerCase().includes('onlayn'))) {
        return false;
      }

      return true;
    });
  }, [offers, filters]);

  const hasActiveFilters =
    filters.nameFilter !== NAME_FILTER_ALL ||
    filters.category !== 'barchasi' ||
    filters.minAmount !== '' ||
    filters.minTermMonths !== '' ||
    filters.onlineOnly;

  return (
    <div>
      <h1 className="page-title">🏦 Bank takliflari</h1>
      <p className="page-subtitle">
        bank.uz saytidagi kredit takliflari — har safar sahifa ochilganda jonli
        yangilanadi
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>🔍 Biznesingizga mos kreditni toping</h3>
        <div className="form-row">
          <label>
            Bank yoki mahsulot nomi
            <select
              value={filters.nameFilter}
              onChange={(e) =>
                setFilters((f) => ({ ...f, nameFilter: e.target.value }))
              }
            >
              <option value={NAME_FILTER_ALL}>Barcha banklar va mahsulotlar</option>
              <optgroup label="Bank nomi bo'yicha">
                {bankNameOptions.map((name) => (
                  <option key={`bank:${name}`} value={`bank:${name}`}>
                    {name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Mahsulot nomi bo'yicha">
                {productNameOptions.map((name) => (
                  <option key={`product:${name}`} value={`product:${name}`}>
                    {name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label>
            Kredit turi
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  category: e.target.value as BankOfferCategory | 'barchasi',
                }))
              }
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Kerakli summa (kamida, so'mda)
            <input
              type="number"
              min={0}
              placeholder="masalan: 50000000"
              value={filters.minAmount}
              onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
            />
          </label>
          <label>
            Kerakli muddat (kamida, oy)
            <input
              type="number"
              min={0}
              placeholder="masalan: 12"
              value={filters.minTermMonths}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minTermMonths: e.target.value }))
              }
            />
          </label>
        </div>
        <div className="form-row" style={{ alignItems: 'center' }}>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={filters.onlineOnly}
              onChange={(e) =>
                setFilters((f) => ({ ...f, onlineOnly: e.target.checked }))
              }
            />
            Faqat onlayn rasmiylashtiriladigan takliflar
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              className="secondary"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              ✕ Filtrni tozalash
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="top-bar">
          <div>
            <span style={{ fontSize: 13, color: '#888' }}>
              {filteredOffers.length} / {offers.length} ta taklif ko'rsatilmoqda
              {formattedFetchedAt && ` · Yangilangan: ${formattedFetchedAt}`}
            </span>
          </div>
          <button className="secondary" onClick={() => loadPage(page)} disabled={loading}>
            {loading ? 'Yuklanmoqda...' : "🔄 Yangilash"}
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        {loading && offers.length === 0 && !error && (
          <p>Bank takliflari yuklanmoqda, biroz kuting...</p>
        )}

        {!loading && !error && offers.length > 0 && filteredOffers.length === 0 && (
          <p>
            Filtrga mos taklif topilmadi. Shartlarni yumshating yoki "Filtrni
            tozalash"ni bosing — barcha {offers.length} ta taklif joyida turibdi.
          </p>
        )}

        {!loading && !error && offers.length === 0 && (
          <p>Hozircha takliflar topilmadi. Birozdan so'ng qaytadan urinib ko'ring.</p>
        )}

        <div className="grid grid-3">
          {filteredOffers.map((offer) => (
            <div className="stat-tile" key={offer.id} style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {offer.imageUrl && (
                  <img
                    src={offer.imageUrl}
                    alt={offer.bankName}
                    style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6 }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{offer.bankName}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{offer.productName}</div>
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <span className="badge">{BANK_OFFER_CATEGORY_LABELS[offer.category]}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13, marginBottom: 8 }}>
                <div>
                  <div className="label">Foiz stavkasi</div>
                  <div className="value" style={{ fontSize: 15 }}>{offer.interestRate}</div>
                </div>
                <div>
                  <div className="label">Muddat</div>
                  <div className="value" style={{ fontSize: 15 }}>{offer.term}</div>
                </div>
                <div>
                  <div className="label">Boshlang'ich to'lov</div>
                  <div className="value" style={{ fontSize: 15 }}>{offer.downPayment}</div>
                </div>
                <div>
                  <div className="label">Summa</div>
                  <div className="value" style={{ fontSize: 15 }}>{offer.amount}</div>
                </div>
              </div>

              {offer.badges.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {offer.badges.map((badge) => (
                    <span className="badge" key={badge}>
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {offer.detailUrl && (
                <div className="btn-row">
                  <a
                    className="secondary"
                    href={offer.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    Batafsil
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="btn-row" style={{ marginTop: 20, justifyContent: 'center' }}>
            <button
              className="secondary"
              disabled={loading || page <= 1}
              onClick={() => loadPage(page - 1)}
            >
              ← Oldingi
            </button>
            <span style={{ alignSelf: 'center' }}>
              {page} / {totalPages}
            </span>
            <button
              className="secondary"
              disabled={loading || page >= totalPages}
              onClick={() => loadPage(page + 1)}
            >
              Keyingi →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}