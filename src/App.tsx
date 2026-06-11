import { Suspense } from 'react';
import { useRoute } from './router';
import { TOOLS } from './tools/registry';
import { Hub } from './Hub';

export default function App() {
  const route = useRoute();
  const tool = TOOLS.find((x) => route === x.path || route.startsWith(x.path + '/'));
  if (!tool) return <Hub />;

  const ToolComponent = tool.component;
  const subpath = route.slice(tool.path.length).replace(/^\//, '');
  return (
    <Suspense fallback={<div className="page" />}>
      <ToolComponent subpath={subpath} />
    </Suspense>
  );
}
