import { useI18n } from './shared/i18n';
import { useTheme } from './shared/theme';
import { TOOLS } from './tools/registry';
import { navigate } from './router';

/** 品牌标记：朋友（点）经辐条汇聚到中心节点 —— Ju·Hub + 聚。与 public/ 下的 PWA 图标同形。 */
function HubMark() {
  const k = 25.5; // 中心到外点的对角偏移（viewBox 100，与图标脚本同比例）
  const dots = [
    [50 + k, 50 - k],
    [50 - k, 50 - k],
    [50 - k, 50 + k],
    [50 + k, 50 + k],
  ];
  return (
    <svg viewBox="0 0 100 100" width="60%" height="60%" aria-hidden="true">
      {dots.map(([x, y], i) => (
        <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="#fff" strokeWidth="2.7" strokeLinecap="round" opacity="0.5" />
      ))}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7.2" fill="#fff" opacity="0.92" />
      ))}
      <circle cx="50" cy="50" r="11.5" fill="#fff" />
    </svg>
  );
}

/** 工具中心首页：卡片来自工具注册表 */
export function Hub() {
  const { t, lang, setLang } = useI18n();
  const { theme, cycleTheme } = useTheme();
  const themeLabel = theme === 'auto' ? t.themeAuto : theme === 'light' ? t.themeLight : t.themeDark;

  return (
    <div className="page">
      <header className="page-header">
        <div className="hero-icon">
          <HubMark />
        </div>
        <h1 className="logo">JuHub</h1>
        <p className="tagline">{t.tagline}</p>
      </header>

      {TOOLS.map((tool) => (
        <button key={tool.id} className="card tool-card" onClick={() => navigate(tool.path)}>
          <span className="tool-card-icon">{tool.icon}</span>
          <span className="tool-card-main">
            <span className="tool-card-title">{tool.title(t)}</span>
            <span className="tool-card-desc">{tool.desc(t)}</span>
          </span>
          <span className="tool-card-arrow">›</span>
        </button>
      ))}

      <div className="home-footer">
        <button className="text-btn" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
          {t.langSwitch}
        </button>
        <span className="dot">·</span>
        <button className="text-btn" onClick={cycleTheme}>
          {themeLabel}
        </button>
      </div>

      <p className="made-by">Made by Howard</p>
    </div>
  );
}
