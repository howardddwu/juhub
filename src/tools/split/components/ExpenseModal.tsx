import { useState } from 'react';
import type { Expense, SplitMode, Trip } from '../core/types';
import { CURRENCIES, currencySymbol, formatMoney, parseShareToCents, parseYuanToCents } from '../core/money';
import { uid } from '../storage';
import { useI18n } from '../../../shared/i18n';
import { useDialogs } from '../../../shared/Dialogs';
import { Avatar } from '../../../shared/Avatar';

type SplitType = SplitMode['type'];

function centsToYuanInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function ExpenseModal({
  trip,
  editing,
  onSave,
  onDelete,
  onClose,
}: {
  trip: Trip;
  editing?: Expense;
  onSave: (expense: Expense) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useDialogs();

  const [kind, setKind] = useState<'expense' | 'repayment'>(editing?.kind ?? 'expense');
  const [amount, setAmount] = useState(editing ? centsToYuanInput(editing.amountCents) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [currency, setCurrency] = useState(editing?.currency ?? trip.currency);
  const [rate, setRate] = useState(editing?.rateToBase ? String(editing.rateToBase) : '');
  // 默认付款人：沿用上一笔的付款人，减少高频场景的点击
  const [payerId, setPayerId] = useState(editing?.payerId ?? trip.expenses[0]?.payerId ?? trip.members[0]?.id ?? '');
  const [recipientId, setRecipientId] = useState(
    editing?.kind === 'repayment' ? editing.participantIds[0] : trip.members.find((m) => m.id !== payerId)?.id ?? '',
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    editing && editing.kind !== 'repayment' ? editing.participantIds : trip.members.map((m) => m.id),
  );
  const [splitType, setSplitType] = useState<SplitType>(
    editing && editing.kind !== 'repayment' ? editing.split.type : 'equal',
  );
  const [weights, setWeights] = useState<Record<string, string>>(() =>
    editing?.split.type === 'weighted'
      ? Object.fromEntries(Object.entries(editing.split.weights).map(([id, w]) => [id, String(w)]))
      : {},
  );
  const [exacts, setExacts] = useState<Record<string, string>>(() =>
    editing?.split.type === 'exact' && editing.kind !== 'repayment'
      ? Object.fromEntries(Object.entries(editing.split.amounts).map(([id, c]) => [id, centsToYuanInput(c)]))
      : {},
  );

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const amountCents = parseYuanToCents(amount);
  const participants = trip.members.filter((m) => participantIds.includes(m.id));
  const foreign = kind === 'expense' && currency !== trip.currency;
  const rateNum = parseFloat(rate);
  const rateValid = !foreign || (Number.isFinite(rateNum) && rateNum > 0);

  // 按当前分法组装 split 并校验；非法时返回 null
  const buildSplit = (): SplitMode | null => {
    if (splitType === 'equal') return { type: 'equal' };
    if (splitType === 'weighted') {
      const parsed: Record<string, number> = {};
      let total = 0;
      for (const m of participants) {
        const w = parseFloat(weights[m.id] ?? '1');
        if (!Number.isFinite(w) || w < 0) return null;
        parsed[m.id] = w;
        total += w;
      }
      return total > 0 ? { type: 'weighted', weights: parsed } : null;
    }
    const parsed: Record<string, number> = {};
    let sum = 0;
    for (const m of participants) {
      const c = parseShareToCents(exacts[m.id] ?? '');
      if (c === null) return null;
      parsed[m.id] = c;
      sum += c;
    }
    return amountCents !== null && sum === amountCents ? { type: 'exact', amounts: parsed } : null;
  };

  const split = kind === 'expense' ? buildSplit() : null;
  const valid =
    amountCents !== null &&
    (kind === 'repayment'
      ? payerId && recipientId && payerId !== recipientId
      : payerId && participants.length > 0 && split !== null && rateValid);

  const exactRemaining =
    splitType === 'exact' && amountCents !== null
      ? amountCents - participants.reduce((a, m) => a + (parseShareToCents(exacts[m.id] ?? '') ?? 0), 0)
      : 0;

  const buildExpense = (): Expense => {
    if (kind === 'repayment') {
      return {
        id: editing?.id ?? uid(),
        description: description.trim(),
        amountCents: amountCents!,
        kind: 'repayment',
        payerId,
        participantIds: [recipientId],
        split: { type: 'exact', amounts: { [recipientId]: amountCents! } },
        createdAt: editing?.createdAt ?? Date.now(),
      };
    }
    return {
      id: editing?.id ?? uid(),
      description: description.trim(),
      amountCents: amountCents!,
      currency: foreign ? currency : undefined,
      rateToBase: foreign ? rateNum : undefined,
      payerId,
      participantIds: trip.members.map((m) => m.id).filter((id) => participantIds.includes(id)),
      split: split!,
      createdAt: editing?.createdAt ?? Date.now(),
    };
  };

  const save = (andNext: boolean) => {
    if (!valid) return;
    onSave(buildExpense());
    if (!andNext) {
      onClose();
      return;
    }
    toast(t.saved);
    setAmount('');
    setDescription('');
    setExacts({});
  };

  const memberChip = (m: { id: string; name: string }, selected: boolean, onClick: () => void) => (
    <button key={m.id} className={`select-chip ${selected ? 'on' : ''}`} onClick={onClick}>
      <Avatar name={m.name} size={22} />
      {m.name}
    </button>
  );

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editing ? t.modalEditTitle : t.modalAddTitle}</h2>

        {!editing && (
          <div className="segmented kind-switch">
            <button className={`segmented-item ${kind === 'expense' ? 'on' : ''}`} onClick={() => setKind('expense')}>
              {t.typeExpense}
            </button>
            <button
              className={`segmented-item ${kind === 'repayment' ? 'on' : ''}`}
              onClick={() => setKind('repayment')}
            >
              {t.typeRepay}
            </button>
          </div>
        )}

        <label className="field-label">
          {t.amountLabel(currencySymbol(kind === 'expense' ? currency : trip.currency))}
        </label>
        <div className="amount-row">
          <input
            className="amount-input"
            inputMode="decimal"
            autoFocus={!editing}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          {kind === 'expense' && (
            <select className="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {[trip.currency, ...CURRENCIES.filter((c) => c !== trip.currency)].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {foreign && (
          <>
            <label className="field-label">{t.rateLabel(currency, trip.currency)}</label>
            <div className="rate-row">
              <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="7.20" />
              {rateValid && amountCents !== null && (
                <span className="rate-approx">
                  {t.approx(formatMoney(Math.round(amountCents * rateNum), trip.currency))}
                </span>
              )}
            </div>
          </>
        )}

        {kind === 'repayment' ? (
          <>
            <label className="field-label">{t.repayFromLabel}</label>
            <div className="member-select">
              {trip.members.map((m) => memberChip(m, payerId === m.id, () => setPayerId(m.id)))}
            </div>
            <label className="field-label">{t.repayToLabel}</label>
            <div className="member-select">
              {trip.members
                .filter((m) => m.id !== payerId)
                .map((m) => memberChip(m, recipientId === m.id, () => setRecipientId(m.id)))}
            </div>
          </>
        ) : (
          <>
            <label className="field-label">{t.payerLabel}</label>
            <div className="member-select">
              {trip.members.map((m) => memberChip(m, payerId === m.id, () => setPayerId(m.id)))}
            </div>

            <label className="field-label">{t.participantsLabel}</label>
            <div className="member-select">
              {trip.members.map((m) => memberChip(m, participantIds.includes(m.id), () => toggleParticipant(m.id)))}
            </div>

            <label className="field-label">{t.splitLabel}</label>
            <div className="segmented">
              {(['equal', 'weighted', 'exact'] as const).map((type) => (
                <button
                  key={type}
                  className={`segmented-item ${splitType === type ? 'on' : ''}`}
                  onClick={() => setSplitType(type)}
                >
                  {type === 'equal' ? t.splitEqual : type === 'weighted' ? t.splitWeighted : t.splitExact}
                </button>
              ))}
            </div>

            {splitType === 'weighted' && (
              <div className="split-rows">
                {participants.map((m) => (
                  <div key={m.id} className="split-row">
                    <Avatar name={m.name} size={22} />
                    <span className="split-name">{m.name}</span>
                    <input
                      className="split-input"
                      inputMode="decimal"
                      value={weights[m.id] ?? '1'}
                      onChange={(e) => setWeights((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    />
                    <span className="split-unit">{t.shareUnit}</span>
                  </div>
                ))}
              </div>
            )}

            {splitType === 'exact' && (
              <div className="split-rows">
                {participants.map((m) => (
                  <div key={m.id} className="split-row">
                    <Avatar name={m.name} size={22} />
                    <span className="split-name">{m.name}</span>
                    <input
                      className="split-input"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={exacts[m.id] ?? ''}
                      onChange={(e) => setExacts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    />
                    <span className="split-unit">{currencySymbol(currency)}</span>
                  </div>
                ))}
                {amountCents !== null && exactRemaining !== 0 && (
                  <div className={`split-hint ${exactRemaining > 0 ? '' : 'over'}`}>
                    {exactRemaining > 0
                      ? t.remaining(formatMoney(exactRemaining, currency))
                      : t.over(formatMoney(-exactRemaining, currency))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <label className="field-label">{t.noteLabel}</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.notePlaceholder}
          maxLength={30}
        />

        <div className="modal-actions">
          {onDelete && (
            <button className="btn danger" onClick={onDelete}>
              {t.delete}
            </button>
          )}
          <button className="btn grow" onClick={onClose}>
            {t.cancel}
          </button>
          {!editing && (
            <button className="btn grow" onClick={() => save(true)} disabled={!valid}>
              {t.saveAndNext}
            </button>
          )}
          <button className="btn primary grow" onClick={() => save(false)} disabled={!valid}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
