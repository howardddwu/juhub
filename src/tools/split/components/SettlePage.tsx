import { useMemo, useState } from 'react';
import type { Trip } from '../core/types';
import { computeBalances, computeStats, tripTotalCents } from '../core/balance';
import { settleOptimal } from '../core/settle';
import { settlementText } from '../core/summary';
import { formatMoney } from '../core/money';
import { copyText } from '../../../shared/clipboard';
import { useI18n } from '../../../shared/i18n';
import { Avatar } from '../../../shared/Avatar';

/** 余额 + 转账方案两张卡片，结算页和只读分享视图共用。 */
export function SettleCards({ trip }: { trip: Trip }) {
  const { t } = useI18n();
  const { balances, transfers } = useMemo(
    () => {
      const balances = computeBalances(trip);
      return { balances, transfers: settleOptimal(balances) };
    },
    [trip],
  );
  const nameOf = (id: string) => trip.members.find((m) => m.id === id)?.name ?? '?';
  const maxAbs = Math.max(1, ...Object.values(balances).map(Math.abs));

  return (
    <>
      <h2 className="section-title">{t.balancesTitle}</h2>
      <div className="card">
        {trip.members.map((m) => {
          const v = balances[m.id] ?? 0;
          return (
            <div key={m.id} className="balance-row">
              <Avatar name={m.name} size={26} />
              <span className="balance-name">{m.name}</span>
              <div className="balance-bar-track">
                <div
                  className={`balance-bar ${v >= 0 ? 'pos' : 'neg'}`}
                  style={{ width: `${(Math.abs(v) / maxAbs) * 100}%` }}
                />
              </div>
              <span className={`balance-amount ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}`}>
                {v === 0
                  ? t.even
                  : v > 0
                    ? t.recv(formatMoney(v, trip.currency))
                    : t.pay(formatMoney(-v, trip.currency))}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">{t.transfersTitle(transfers.length)}</h2>
      <div className="card">
        {transfers.length === 0 ? (
          <div className="empty">{t.noTransfers}</div>
        ) : (
          transfers.map((tr, i) => (
            <div key={i} className="transfer-row">
              <span className="transfer-people">
                <Avatar name={nameOf(tr.from)} size={24} />
                {nameOf(tr.from)}
                <span className="transfer-arrow">→</span>
                <Avatar name={nameOf(tr.to)} size={24} />
                {nameOf(tr.to)}
              </span>
              <strong>{formatMoney(tr.amountCents, trip.currency)}</strong>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export function SettlePage({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => computeStats(trip), [trip]);
  const total = tripTotalCents(trip);
  const expenseCount = trip.expenses.filter((e) => e.kind !== 'repayment').length;

  const copy = async () => {
    const transfers = settleOptimal(computeBalances(trip));
    if (await copyText(settlementText(trip, transfers, lang))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={onBack} aria-label="back">
          ‹
        </button>
        <h1>{t.settleTitle}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="card stat">
        {t.totalExpenses(expenseCount)} <strong>{formatMoney(total, trip.currency)}</strong>
      </div>

      <SettleCards trip={trip} />

      <h2 className="section-title">{t.statsTitle}</h2>
      <div className="card">
        {trip.members.map((m) => {
          const s = stats[m.id] ?? { paidCents: 0, shareCents: 0 };
          return (
            <div key={m.id} className="stat-row">
              <Avatar name={m.name} size={26} />
              <span className="balance-name">{m.name}</span>
              <span className="stat-detail">
                {t.statPaid(formatMoney(s.paidCents, trip.currency))} ·{' '}
                {t.statShare(formatMoney(s.shareCents, trip.currency))}
              </span>
            </div>
          );
        })}
      </div>

      <button className="btn primary block" onClick={copy}>
        {copied ? t.copied : t.copySummary}
      </button>
    </div>
  );
}
