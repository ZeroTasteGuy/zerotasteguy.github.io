import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Sponsors from '@site/src/components/Sponsors';
import * as I from '@site/src/components/home/Icons';
import styles from './index.module.css';

// "Latest" cards (like Betaflight's news row).
const latest = [
  {
    label: 'Tool',
    title: 'Video Lap Tracking Lab',
    text: 'Time your laps from goggle footage frame by frame and find your best 3 consecutive laps.',
    to: 'pathname:///vltl/',
    self: true,
  },
  {
    label: 'Guide',
    title: 'Lap timer overlay for DaVinci Resolve',
    text: 'Copy one script from the lap timer and get live lap timers on your footage, plus the OSD fonts.',
    to: '/docs/vltl/resolve-guide/',
  },
  {
    label: 'Coming soon',
    title: 'Race results',
    text: 'Results from MultiGP and the other races I fly, all in one place.',
    to: '/results/',
  },
];

// "About" boxes with a title tab on top (like Betaflight's About section).
const about: {icon: (p: {className?: string}) => ReactNode; title: string; text: ReactNode}[] = [
  {
    icon: I.Trophy,
    title: 'Racing',
    text: (
      <>
        I race FPV drones at MultiGP and other events. My results are collected on the{' '}
        <Link to="/results/">Race results</Link> page.
      </>
    ),
  },
  {
    icon: I.Wrench,
    title: 'Tools',
    text: (
      <>
        Free <Link to="/tools/">tools</Link> that run in your browser. Nothing is uploaded: your footage stays on your
        computer.
      </>
    ),
  },
  {
    icon: I.Stopwatch,
    title: 'Lap timing',
    text: (
      <>
        <a href="/vltl/">Video Lap Tracking Lab</a> times laps frame by frame from your DVR and puts live lap timers on
        your footage in DaVinci Resolve.
      </>
    ),
  },
  {
    icon: I.Goggles,
    title: 'OSD fonts',
    text: (
      <>
        The HDZero and Betaflight analog OSD fonts as real <code>.ttf</code> fonts, so your overlays look like your
        goggles. <Link to="/docs/vltl/resolve-guide/#font">Get them here</Link>.
      </>
    ),
  },
  {
    icon: I.Code,
    title: 'Open source',
    text: (
      <>
        The code for this site and its tools is on <a href="https://github.com/ZeroTasteGuy">GitHub</a>. Found a bug or
        have an idea? Open an issue.
      </>
    ),
  },
  {
    icon: I.People,
    title: 'Community',
    text: (
      <>
        Follow along on <a href="https://www.youtube.com/@maxdax_fpv">YouTube</a> and{' '}
        <a href="https://www.instagram.com/maxdax_fpv/">Instagram</a>, or find me on Discord as ZeroTasteGuy.
      </>
    ),
  },
];

// "Follow" cards (in the spot of Betaflight's Team grid).
const follow = [
  {icon: I.YouTube, name: 'YouTube', handle: '@maxdax_fpv', href: 'https://www.youtube.com/@maxdax_fpv'},
  {icon: I.Instagram, name: 'Instagram', handle: '@maxdax_fpv', href: 'https://www.instagram.com/maxdax_fpv/'},
  {icon: I.GitHub, name: 'GitHub', handle: 'ZeroTasteGuy', href: 'https://github.com/ZeroTasteGuy'},
  {icon: I.Discord, name: 'Discord', handle: 'ZeroTasteGuy'},
];

export default function Home(): ReactNode {
  return (
    <Layout description="FPV tools, documentation and race results by maxd.ax.">
      <div className={styles.heroBg} aria-hidden="true" />
      <main className={`container ${styles.page}`}>
        <header className={styles.hero}>
          <Heading as="h1" className={styles.wordmark}>
            <span className={styles.wmAccent}>maxd</span>.ax
          </Heading>
        </header>

        <div className={`glass ${styles.intro}`}>
          <Heading as="h2" className={styles.introTitle}>
            FPV tools, documentation and race results
          </Heading>
          <p>Free tools for FPV pilots that run right in your browser, with guides for each of them.</p>
          <p>From lap timing on your goggle footage to race results, everything I build and fly ends up here.</p>
        </div>

        <Sponsors />

        <section className={styles.block}>
          <Heading as="h2" className="section-title">
            Latest
          </Heading>
          <div className={styles.latest}>
            {latest.map(c => (
              <Link key={c.title} className={styles.latestCard} to={c.to} target={c.self ? '_self' : undefined}>
                <span className={styles.latestLabel}>{c.label}</span>
                <span className={styles.latestTitle}>{c.title}</span>
                <span className={styles.latestText}>{c.text}</span>
              </Link>
            ))}
          </div>
          <Link className={styles.more} to="/tools/">
            All tools →
          </Link>
        </section>

        <section className={styles.block}>
          <Heading as="h2" className="section-title">
            About
          </Heading>
          <div className={styles.about}>
            {about.map(({icon: Icon, title, text}) => (
              <div key={title} className={styles.tabBox}>
                <div className={styles.tab}>
                  <Icon className={styles.tabIcon} />
                  {title}
                </div>
                <div className={styles.tabPanel}>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.block}>
          <Heading as="h2" className="section-title">
            Follow
          </Heading>
          <div className={`glass ${styles.followBox}`}>
            {follow.map(({icon: Icon, name, handle, href}) => {
              const inner = (
                <>
                  <span className={styles.avatar}>
                    <Icon />
                  </span>
                  <span className={styles.followName}>{name}</span>
                  <span className={styles.followHandle}>{handle}</span>
                </>
              );
              return href ? (
                <a key={name} className={styles.followCard} href={href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={name} className={styles.followCard}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </Layout>
  );
}
