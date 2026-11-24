import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

// Add new tools here. They also need an entry in the "Tools" dropdown
// in docusaurus.config.ts.
const tools = [
  {
    name: 'Video Lap Tracking Lab',
    to: 'pathname:///vltl/',
    docs: '/docs/vltl/',
    text: 'Time laps from video frame by frame, find your best 3 consecutive laps, and put live lap timers on your footage in DaVinci Resolve.',
  },
];

export default function Tools(): ReactNode {
  return (
    <Layout title="Tools" description="Free browser tools for FPV drone pilots.">
      <main className="container margin-vert--xl">
        <Heading as="h1">Tools</Heading>
        <p className="site-muted">Free tools that run in your browser, made for FPV drone pilots.</p>
        <div className="row">
          {tools.map(t => (
            <div key={t.name} className="col col--6 margin-bottom--md">
              <div className="site-card">
                <Heading as="h3">{t.name}</Heading>
                <p className="margin-bottom--md">{t.text}</p>
                <Link className="button button--primary button--sm margin-right--sm" to={t.to} target="_self">
                  Open
                </Link>
                <Link className="button button--secondary button--outline button--sm" to={t.docs}>
                  Docs
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
