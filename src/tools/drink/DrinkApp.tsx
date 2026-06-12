import { useI18n } from '../../shared/i18n';
import { navigate } from '../../router';
import type { ToolProps } from '../registry';
import { Likely } from './Likely';
import { Bomb } from './Bomb';
import { King } from './King';

const GAMES = [
  { id: 'likely', icon: '🫵', title: (t: ReturnType<typeof useI18n>['t']) => t.gameLikely, desc: (t: ReturnType<typeof useI18n>['t']) => t.gameLikelyDesc },
  { id: 'bomb', icon: '💣', title: (t: ReturnType<typeof useI18n>['t']) => t.gameBomb, desc: (t: ReturnType<typeof useI18n>['t']) => t.gameBombDesc },
  { id: 'king', icon: '👑', title: (t: ReturnType<typeof useI18n>['t']) => t.gameKing, desc: (t: ReturnType<typeof useI18n>['t']) => t.gameKingDesc },
];

/** 喝酒游戏容器：落地页（含理性饮酒提示）+ 按子路由分发到三个游戏。 */
export default function DrinkApp({ subpath }: ToolProps) {
  const { t } = useI18n();
  const [game] = subpath.split('/');

  if (game === 'likely') return <Likely />;
  if (game === 'bomb') return <Bomb />;
  if (game === 'king') return <King />;

  return (
    <div className="page">
      <header className="nav">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="back">
          ‹
        </button>
        <h1>{t.toolDrink}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="drink-disclaimer">{t.drinkDisclaimer}</div>

      {GAMES.map((g) => (
        <button key={g.id} className="card tool-card" onClick={() => navigate(`/drink/${g.id}`)}>
          <span className="tool-card-icon">{g.icon}</span>
          <span className="tool-card-main">
            <span className="tool-card-title">{g.title(t)}</span>
            <span className="tool-card-desc">{g.desc(t)}</span>
          </span>
          <span className="tool-card-arrow">›</span>
        </button>
      ))}
    </div>
  );
}
