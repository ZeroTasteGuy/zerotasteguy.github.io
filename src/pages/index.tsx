import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const sections = [
  {
    title: 'Tools',
    to: '/tools/',
    text: 'Free browser tools for FPV pilots, like frame-by-frame lap timing from your goggle footage.',
  },
  {
    title: 'Docs',
    to: '/docs/',
    text: 'Guides for the tools, such as putting live lap timers on your footage in DaVinci Resolve.',
  },
  {
    title: 'Race results',
    to: '/results/',
    text: 'Results from the races I fly.',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout description="FPV tools, documentation and race results by maxd.ax.">
      <header className={`hex-bg ${styles.hero}`}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            maxd<span className={styles.dot}>.</span>ax
          </Heading>
          <p className={styles.tagline}>FPV tools, documentation and race results.</p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="pathname:///vltl/" target="_self">
              Open the lap timer
            </Link>
            <Link className="button button--secondary button--outline button--lg" to="/docs/">
              Read the docs
            </Link>
          </div>
        </div>
      </header>
      <main className="container margin-vert--xl">
        <div className="row">
          {sections.map(s => (
            <div key={s.title} className="col col--4 margin-bottom--md">
              <Link className="site-card" to={s.to}>
                <Heading as="h3">{s.title}</Heading>
                <p>{s.text}</p>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
