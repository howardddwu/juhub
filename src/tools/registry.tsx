import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { Texts } from '../shared/i18n';

export interface ToolProps {
  /** 工具内子路径：'#/split/abc/settle' → 'abc/settle'，工具首页为 '' */
  subpath: string;
}

export interface ToolMeta {
  id: string;
  icon: string;
  title: (t: Texts) => string;
  desc: (t: Texts) => string;
  path: string;
  component: LazyExoticComponent<ComponentType<ToolProps>>;
}

/** 工具注册表：新增工具 = tools/ 下一个目录 + 这里一行，hub 自动出卡片，lazy 保首屏 */
export const TOOLS: ToolMeta[] = [
  {
    id: 'split',
    icon: '💸',
    title: (t) => t.toolSplit,
    desc: (t) => t.toolSplitDesc,
    path: '/split',
    component: lazy(() => import('./split/SplitApp')),
  },
  {
    id: 'teams',
    icon: '🎲',
    title: (t) => t.toolTeams,
    desc: (t) => t.toolTeamsDesc,
    path: '/teams',
    component: lazy(() => import('./teams/TeamsApp')),
  },
  {
    id: 'vote',
    icon: '🗳️',
    title: (t) => t.toolVote,
    desc: (t) => t.toolVoteDesc,
    path: '/vote',
    component: lazy(() => import('./vote/VoteApp')),
  },
];
