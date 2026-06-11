import type { Trip } from '../core/types';
import { formatMoney } from '../core/money';
import { tripTotalCents } from '../core/balance';
import { useI18n } from '../../../shared/i18n';
import { ExpenseList } from './ExpenseList';
import { SettleCards } from './SettlePage';

/** 只读分享视图：通过 #view= 链接打开，可一键保存为本地账本。 */
export function SharedView({ trip, onSave, onClose }: { trip: Trip; onSave: () => void; onClose: () => void }) {
  const { t } = useI18n();

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={onClose} aria-label="close">
          ✕
        </button>
        <h1>{trip.name}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="readonly-banner">{t.sharedReadonly}</div>

      <div className="card stat">
        {t.totalExpenses(trip.expenses.filter((e) => e.kind !== 'repayment').length)}{' '}
        <strong>{formatMoney(tripTotalCents(trip), trip.currency)}</strong>
      </div>

      <SettleCards trip={trip} />

      <h2 className="section-title">
        {t.expensesTitle(trip.expenses.length, formatMoney(tripTotalCents(trip), trip.currency))}
      </h2>
      <ExpenseList trip={trip} />

      <button className="btn primary block" onClick={onSave}>
        {t.saveToMine}
      </button>
    </div>
  );
}
