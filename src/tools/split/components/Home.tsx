import { useRef, useState } from 'react';
import type { Trip } from '../core/types';
import { CURRENCIES, formatMoney } from '../core/money';
import { tripTotalCents } from '../core/balance';
import { useI18n } from '../../../shared/i18n';
import { useDialogs } from '../../../shared/Dialogs';
import { navigate } from '../../../router';

export function Home({
  trips,
  onCreate,
  onOpen,
  onDelete,
  onImport,
}: {
  trips: Trip[];
  onCreate: (name: string, currency: string) => void;
  onOpen: (tripId: string) => void;
  onDelete: (tripId: string) => void;
  onImport: (trips: Trip[]) => void;
}) {
  const { t } = useI18n();
  const { confirmDialog, toast } = useDialogs();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('CNY');
  const fileRef = useRef<HTMLInputElement>(null);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setName('');
    onCreate(trimmed, currency);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(trips, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `juhub-split-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Trip[];
      if (!Array.isArray(parsed) || parsed.some((x) => typeof x?.id !== 'string' || !Array.isArray(x?.expenses))) {
        throw new Error('bad format');
      }
      onImport(parsed);
      toast(t.importedN(parsed.length));
    } catch {
      toast(t.importFailed);
    }
  };

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="back">
          ‹
        </button>
        <h1>{t.toolSplit}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="card new-trip">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder={t.newTripPlaceholder}
          maxLength={20}
        />
        <select className="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={create} disabled={!name.trim()}>
          {t.create}
        </button>
      </div>

      {trips.length > 0 && <h2 className="section-title">{t.myTrips}</h2>}
      {trips.map((trip) => (
        <div key={trip.id} className="card trip-card" onClick={() => onOpen(trip.id)}>
          <div className="trip-card-main">
            <div className="trip-card-name">{trip.name}</div>
            <div className="trip-card-meta">
              {t.tripMeta(trip.members.length, trip.expenses.length, formatMoney(tripTotalCents(trip), trip.currency))}
            </div>
          </div>
          <button
            className="icon-btn"
            aria-label={t.delete}
            onClick={async (e) => {
              e.stopPropagation();
              if (await confirmDialog(t.deleteTripQ(trip.name))) onDelete(trip.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}

      <div className="home-footer">
        <button className="text-btn" onClick={exportAll} disabled={trips.length === 0}>
          {t.exportBackup}
        </button>
        <span className="dot">·</span>
        <button className="text-btn" onClick={() => fileRef.current?.click()}>
          {t.importBackup}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
