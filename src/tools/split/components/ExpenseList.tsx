import type { Expense, Trip } from '../core/types';
import { formatMoney } from '../core/money';
import { baseAmountCents } from '../core/balance';
import { formatDay, useI18n } from '../../../shared/i18n';
import { Avatar } from '../../../shared/Avatar';

/** 账目列表：按天分组倒序展示，还款行特殊呈现。onSelect 缺省时为只读。 */
export function ExpenseList({ trip, onSelect }: { trip: Trip; onSelect?: (expense: Expense) => void }) {
  const { t, lang } = useI18n();
  const nameOf = (id: string) => trip.members.find((m) => m.id === id)?.name ?? '?';

  const sorted = [...trip.expenses].sort((a, b) => b.createdAt - a.createdAt);
  const groups: { day: string; items: Expense[] }[] = [];
  for (const e of sorted) {
    const day = formatDay(e.createdAt, lang);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  const splitSuffix = (e: Expense) =>
    e.split.type === 'weighted' ? t.splitSuffixWeighted : e.split.type === 'exact' ? t.splitSuffixExact : t.splitSuffixEqual;

  return (
    <>
      {groups.map((group) => (
        <div key={group.day}>
          <div className="day-header">{group.day}</div>
          {group.items.map((e) => {
            const isRepay = e.kind === 'repayment';
            const foreign = e.currency && e.currency !== trip.currency;
            return (
              <div
                key={e.id}
                className={`card expense-card ${isRepay ? 'repay' : ''} ${onSelect ? '' : 'readonly'}`}
                onClick={onSelect ? () => onSelect(e) : undefined}
              >
                <Avatar name={nameOf(e.payerId)} />
                <div className="expense-main">
                  <div className="expense-desc">
                    {isRepay && <span className="repay-tag">{t.repayment}</span>}
                    {e.description || (isRepay ? t.repayment : t.expenseFallback)}
                  </div>
                  <div className="expense-meta">
                    {isRepay
                      ? t.repaidMeta(nameOf(e.payerId), nameOf(e.participantIds[0]))
                      : t.expenseMeta(
                          nameOf(e.payerId),
                          e.participantIds.length === trip.members.length
                            ? t.allMembers
                            : t.nPeople(e.participantIds.length),
                          splitSuffix(e),
                        )}
                  </div>
                </div>
                <div className="expense-right">
                  <div className="expense-amount">{formatMoney(e.amountCents, e.currency ?? trip.currency)}</div>
                  {foreign && (
                    <div className="expense-approx">
                      {t.approx(formatMoney(baseAmountCents(e, trip.currency), trip.currency))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
