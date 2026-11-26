import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';

// Add new tools here. They also need an entry in the "Tools" dropdown
// in docusaurus.config.ts. The German text goes in i18n/de/code.json.
function useTools() {
  return [
    {
      name: 'Video Lap Tracking Lab',
      to: 'pathname:///vltl/',
      docs: '/docs/vltl/',
      text: translate({
        id: 'tools.vltl.text',
        message:
          'Time laps from video frame by frame, find your best 3 consecutive laps, and put live lap timers on your footage in DaVinci Resolve.',
      }),
    },
    {
      name: 'IMD Channel Calculator',
      to: '/tools/imd/',
      docs: '/docs/imd/',
      text: translate({
        id: 'tools.imd.text',
        message:
          'See where the interference (IMD) of your 5.8 GHz channels lands, and find the cleanest channels for 2 to 8 pilots. Raceband, HDZero, Walksnail and DJI.',
      }),
    },
  ];
}

export default function Tools(): ReactNode {
  const tools = useTools();
  return (
    <Layout
      title={translate({id: 'tools.title', message: 'Tools'})}
      description={translate({id: 'tools.description', message: 'Free browser tools for FPV drone pilots.'})}>
      <main className="container margin-vert--xl">
        <Heading as="h1" className="section-title">
          <Translate id="tools.title">Tools</Translate>
        </Heading>
        <p className="site-muted">
          <Translate id="tools.intro">Free tools that run in your browser, made for FPV drone pilots.</Translate>
        </p>
        <div className="row">
          {tools.map(t => (
            <div key={t.name} className="col col--6 margin-bottom--md">
              <div className="site-card">
                <Heading as="h3">{t.name}</Heading>
                <p className="margin-bottom--md">{t.text}</p>
                <Link className="button button--primary button--sm margin-right--sm" to={t.to} target="_self">
                  <Translate id="tools.open">Open</Translate>
                </Link>
                <Link className="button button--secondary button--outline button--sm" to={t.docs}>
                  <Translate id="tools.docs">Docs</Translate>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
