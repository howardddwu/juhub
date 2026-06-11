import { useState } from 'react';
import type { Expense, Trip } from '../core/types';
import { formatMoney } from '../core/money';
import { tripTotalCents } from '../core/balance';
import { encodeTrip } from '../core/backup';
import { copyText } from '../../../shared/clipboard';
import { uid } from '../storage';
import { useI18n } from '../../../shared/i18n';
import { useDialogs } from '../../../shared/Dialogs';
import { Avatar } from '../../../shared/Avatar';
import { rememberNames } from '../../../shared/namePool';
import { NameSuggestions } from '../../../shared/NameSuggestions';
import { ExpenseList } from './ExpenseList';
import { ExpenseModal } from './ExpenseModal';

export function TripPage({
  trip,
  onBack,
  onUpdate,
  onSettle,
}: {
  trip: Trip;
  onBack: () => void;
  onUpdate: (update: (trip: Trip) => Trip) => void;
  onSettle: () => void;
}) {
  const { t } = useI18n();
  const { confirmDialog, toast } = useDialogs();
  const [memberName, setMemberName] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing?: Expense }>({ open: false });
  const [shareOpen, setShareOpen] = useState(false);

  const addMemberByName = (name: string) => {
    if (trip.members.some((m) => m.name === name)) {
      toast(t.sameNameExists);
      return;
    }
    rememberNames([name]);
    onUpdate((x) => ({ ...x, members: [...x.members, { id: uid(), name }] }));
  };

  const addMember = () => {
    const name = memberName.trim();
    if (!name) return;
    setMemberName('');
    addMemberByName(name);
  };

  const removeMember = (id: string) => {
    const used = trip.expenses.some((e) => e.payerId === id || e.participantIds.includes(id));
    if (used) {
      toast(t.memberInUse);
      return;
    }
    onUpdate((x) => ({ ...x, members: x.members.filter((m) => m.id !== id) }));
  };

  const saveExpense = (expense: Expense) => {
    onUpdate((x) => {
      const exists = x.expenses.some((e) => e.id === expense.id);
      return {
        ...x,
        expenses: exists ? x.expenses.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...x.expenses],
      };
    });
  };

  const deleteExpense = (id: string) => {
    onUpdate((x) => ({ ...x, expenses: x.expenses.filter((e) => e.id !== id) }));
    setModal({ open: false });
  };

  const copyLink = async (kind: 'view' | 'restore') => {
    const payload = await encodeTrip(trip);
    const url = `${location.origin}${location.pathname}#/split/${kind}/${payload}`;
    toast((await copyText(url)) ? t.linkCopied : t.copyFailed);
    setShareOpen(false);
  };

  return (
    <div className="page has-bottom-bar">
      <header className="nav">
        <button className="icon-btn" onClick={onBack} aria-label="back">
          ‹
        </button>
        <h1>{trip.name}</h1>
        <button className="text-btn" onClick={() => setShareOpen(true)}>
          {t.share}
        </button>
      </header>

      <h2 className="section-title">{t.membersTitle(trip.members.length)}</h2>
      <div className="card">
        <div className="member-chips">
          {trip.members.map((m) => (
            <span key={m.id} className="chip">
              <Avatar name={m.name} size={22} />
              {m.name}
              <button className="chip-x" aria-label={`remove ${m.name}`} onClick={() => removeMember(m.id)}>
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="member-add">
          <input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            placeholder={t.memberPlaceholder}
            maxLength={12}
          />
          <button className="btn" onClick={addMember} disabled={!memberName.trim()}>
            {t.add}
          </button>
        </div>
        <NameSuggestions exclude={trip.members.map((m) => m.name)} onPick={addMemberByName} />
      </div>

      <h2 className="section-title">
        {t.expensesTitle(trip.expenses.length, formatMoney(tripTotalCents(trip), trip.currency))}
      </h2>
      {trip.expenses.length === 0 ? (
        <div className="card empty">{t.emptyExpenses}</div>
      ) : (
        <ExpenseList trip={trip} onSelect={(e) => setModal({ open: true, editing: e })} />
      )}

      <div className="bottom-bar">
        <button
          className="btn primary grow"
          onClick={() => {
            if (trip.members.length < 2) {
              toast(t.needTwoMembers);
              return;
            }
            setModal({ open: true });
          }}
        >
          {t.addExpense}
        </button>
        <button className="btn grow" onClick={onSettle} disabled={trip.expenses.length === 0}>
          {t.settleUp}
        </button>
      </div>

      {modal.open && (
        <ExpenseModal
          trip={trip}
          editing={modal.editing}
          onSave={saveExpense}
          onDelete={
            modal.editing
              ? async () => {
                  if (await confirmDialog(t.deleteExpenseQ)) deleteExpense(modal.editing!.id);
                }
              : undefined
          }
          onClose={() => setModal({ open: false })}
        />
      )}

      {shareOpen && (
        <div className="modal-mask" onClick={() => setShareOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.share}</h2>
            <button className="share-option" onClick={() => copyLink('view')}>
              <span className="share-option-icon">👀</span>
              <span className="share-option-main">
                <span className="share-option-title">{t.shareReadonly}</span>
                <span className="share-option-desc">{t.shareReadonlyDesc}</span>
              </span>
            </button>
            <button className="share-option" onClick={() => copyLink('restore')}>
              <span className="share-option-icon">☁️</span>
              <span className="share-option-main">
                <span className="share-option-title">{t.backupLink}</span>
                <span className="share-option-desc">{t.backupLinkDesc}</span>
              </span>
            </button>
            <div className="modal-actions">
              <button className="btn grow" onClick={() => setShareOpen(false)}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
