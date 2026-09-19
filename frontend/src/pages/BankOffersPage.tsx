import { useEffect, useState } from 'react';
import { bankOffersApi } from '../api/endpoints';
import { BankCreditOffer } from '../api/types';
import { extractErrorMessage } from '../api/client';

export default function BankOffersPage() {
  const [offers, setOffers] = useState<BankCreditOffer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div>
      <h1 className="page-title">🏦 Bank takliflari</h1>
      <p className="page-subtitle">
        bank.uz saytidagi kredit takliflari — har safar sahifa ochilganda jonli
        yangilanadi
      </p>

      <div className="card">
        <div className="top-bar">
          <div>
            {formattedFetchedAt && (
              <span style={{ fontSize: 13, color: '#888' }}>
                Yangilangan: {formattedFetchedAt}
              </span>
            )}
          </div>
          <button className="secondary" onClick={() => loadPage(page)} disabled={loading}>
            {loading ? 'Yuklanmoqda...' : "🔄 Yangilash"}
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        {loading && offers.length === 0 && !error && (
          <p>Bank takliflari yuklanmoqda, biroz kuting...</p>
        )}

        {!loading && !error && offers.length === 0 && (
          <p>Hozircha takliflar topilmadi. Birozdan so'ng qaytadan urinib ko'ring.</p>
        )}

        <div className="grid grid-3">
          {offers.map((offer) => (
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