import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Sponsors from '@site/src/components/Sponsors';
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
      <main className="container">
        <header className={styles.hero}>
          <Heading as="h1" className={styles.title}>
            maxd<span className={styles.dot}>.</span>ax
          </Heading>
        </header>

        <div className={`glass ${styles.intro}`}>
          <Heading as="h2" className={styles.introTitle}>
            FPV tools, documentation and race results
          </Heading>
          <p className={styles.introText}>
            Free tools that run in your browser, guides to get the most out of them, and results from the races I fly.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="pathname:///vltl/" target="_self">
              Open the lap timer
            </Link>
            <Link className="button button--secondary button--outline button--lg" to="/docs/">
              Read the docs
            </Link>
          </div>
        </div>

        <section className={styles.block}>
          <Heading as="h2" className="section-title">
            Explore
          </Heading>
          <div className={styles.cards}>
            {sections.map(s => (
              <Link key={s.title} className="site-card" to={s.to}>
                <Heading as="h3">{s.title}</Heading>
                <p>{s.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <Sponsors />
      </main>
    </Layout>
  );
}
