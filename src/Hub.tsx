import { useI18n } from './shared/i18n';
import { useTheme } from './shared/theme';
import { TOOLS } from './tools/registry';
import { navigate } from './router';

/** 工具中心首页：卡片来自工具注册表 */
export function Hub() {
  const { t, lang, setLang } = useI18n();
  const { theme, cycleTheme } = useTheme();
  const themeLabel = theme === 'auto' ? t.themeAuto : theme === 'light' ? t.themeLight : t.themeDark;

  return (
    <div className="page">
      <header className="page-header">
        <div className="hero-icon">聚</div>
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
