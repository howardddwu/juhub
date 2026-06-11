import { useEffect, useState } from 'react';
import type { Trip } from './core/types';
import { decodeTrip } from './core/backup';
import { loadTrips, saveTrips, uid } from './storage';
import { useI18n } from '../../shared/i18n';
import { useDialogs } from '../../shared/Dialogs';
import { navigate, redirect } from '../../router';
import type { ToolProps } from '../registry';
import { Home } from './components/Home';
import { TripPage } from './components/TripPage';
import { SettlePage } from './components/SettlePage';
import { SharedView } from './components/SharedView';

/**
 * 分账工具。子路由：
 *   ''                  账本列表
 *   ':tripId'           账本页
 *   ':tripId/settle'    结算页
 *   'restore/:payload'  从备份链接导入（旧 #restore= 由 router 重定向至此）
 *   'view/:payload'     只读分享视图（旧 #view= 同上）
 */
export default function SplitApp({ subpath }: ToolProps) {
  const [trips, setTrips] = useState<Trip[]>(loadTrips);
  const { t } = useI18n();
  const { confirmDialog } = useDialogs();

  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  /** 导入单个账本：同 id 询问后覆盖，新 id 追加；成功后跳转到该账本 */
  const addTrip = async (trip: Trip) => {
    const exists = trips.some((x) => x.id === trip.id);
    if (exists && !(await confirmDialog(t.overwriteQ(trip.name)))) {
      redirect('/split');
      return;
    }
    setTrips((prev) =>
      prev.some((x) => x.id === trip.id) ? prev.map((x) => (x.id === trip.id ? trip : x)) : [trip, ...prev],
    );
    redirect(`/split/${trip.id}`);
  };

  const updateTrip = (tripId: string, update: (trip: Trip) => Trip) => {
    setTrips((prev) => prev.map((x) => (x.id === tripId ? update(x) : x)));
  };

  const createTrip = (name: string, currency: string) => {
    const trip: Trip = { id: uid(), name, members: [], expenses: [], currency, createdAt: Date.now() };
    setTrips((prev) => [trip, ...prev]);
    navigate(`/split/${trip.id}`);
  };

  const deleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((x) => x.id !== tripId));
  };

  const importTrips = (imported: Trip[]) => {
    setTrips((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      for (const trip of imported) byId.set(trip.id, trip);
      return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
    });
  };

  const [seg1, seg2] = subpath.split('/');

  if (seg1 === 'restore' && seg2) return <RestoreRoute payload={seg2} onDecoded={addTrip} />;
  if (seg1 === 'view' && seg2) return <ViewRoute payload={seg2} onSave={addTrip} />;

  if (!seg1) {
    return (
      <Home
        trips={trips}
        onCreate={createTrip}
        onOpen={(id) => navigate(`/split/${id}`)}
        onDelete={deleteTrip}
        onImport={importTrips}
      />
    );
  }

  const trip = trips.find((x) => x.id === seg1);
  if (!trip) return <Redirect to="/split" />;

  if (seg2 === 'settle') {
    return <SettlePage trip={trip} onBack={() => navigate(`/split/${trip.id}`)} />;
  }

  return (
    <TripPage
      trip={trip}
      onBack={() => navigate('/split')}
      onUpdate={(update) => updateTrip(trip.id, update)}
      onSettle={() => navigate(`/split/${trip.id}/settle`)}
    />
  );
}

function Redirect({ to }: { to: string }) {
  useEffect(() => {
    redirect(to);
  }, [to]);
  return null;
}

/** 备份链接导入：解码 → 导入并跳转账本页 */
function RestoreRoute({ payload, onDecoded }: { payload: string; onDecoded: (trip: Trip) => void }) {
  const { t } = useI18n();
  const { toast } = useDialogs();

  useEffect(() => {
    decodeTrip(payload)
      .then(onDecoded)
      .catch(() => {
        toast(t.invalidLink);
        redirect('/split');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  return <div className="page" />;
}

/** 只读分享视图：解码后展示，可一键保存为本地账本 */
function ViewRoute({ payload, onSave }: { payload: string; onSave: (trip: Trip) => void }) {
  const { t } = useI18n();
  const { toast } = useDialogs();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    decodeTrip(payload)
      .then(setTrip)
      .catch(() => {
        toast(t.invalidLink);
        redirect('/split');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  if (!trip) return <div className="page" />;
  return <SharedView trip={trip} onSave={() => onSave(trip)} onClose={() => navigate('/')} />;
}
