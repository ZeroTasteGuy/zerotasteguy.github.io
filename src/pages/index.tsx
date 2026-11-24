import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import Sponsors from '@site/src/components/Sponsors';
import * as I from '@site/src/components/home/Icons';
import styles from './index.module.css';

// "Latest" cards (like Betaflight's news row).
// The English text is written here; the German text is in i18n/de/code.json.
function useLatest() {
  return [
    {
      label: translate({id: 'home.latest.vltl.label', message: 'Tool'}),
      title: 'Video Lap Tracking Lab',
      text: translate({
        id: 'home.latest.vltl.text',
        message: 'Time your laps from goggle footage frame by frame and find your best 3 consecutive laps.',
      }),
      to: 'pathname:///vltl/',
      self: true,
    },
    {
      label: translate({id: 'home.latest.guide.label', message: 'Guide'}),
      title: translate({id: 'home.latest.guide.title', message: 'Lap timer overlay for DaVinci Resolve'}),
      text: translate({
        id: 'home.latest.guide.text',
        message: 'Copy one script from the lap timer and get live lap timers on your footage, plus the OSD fonts.',
      }),
      to: '/docs/vltl/resolve-guide/',
    },
    {
      label: translate({id: 'home.latest.results.label', message: 'Coming soon'}),
      title: translate({id: 'home.latest.results.title', message: 'Race results'}),
      text: translate({
        id: 'home.latest.results.text',
        message: 'Results from MultiGP and the other races I fly, all in one place.',
      }),
      to: '/results/',
    },
  ];
}

// "About" boxes with a title tab on top (like Betaflight's About section).
type AboutBox = {key: string; icon: (p: {className?: string}) => ReactNode; title: string; text: ReactNode};

function useAbout(): AboutBox[] {
  return [
    {
      key: 'racing',
      icon: I.Trophy,
      title: translate({id: 'home.about.racing.title', message: 'Racing'}),
      text: (
        <Translate
          id="home.about.racing.text"
          values={{
            link: (
              <Link to="/results/">
                <Translate id="home.about.racing.link">Race results</Translate>
              </Link>
            ),
          }}>
          {'I race FPV drones at MultiGP and other events. My results are collected on the {link} page.'}
        </Translate>
      ),
    },
    {
      key: 'tools',
      icon: I.Wrench,
      title: translate({id: 'home.about.tools.title', message: 'Tools'}),
      text: (
        <Translate
          id="home.about.tools.text"
          values={{
            link: (
              <Link to="/tools/">
                <Translate id="home.about.tools.link">tools</Translate>
              </Link>
            ),
          }}>
          {'Free {link} that run in your browser. Nothing is uploaded: your footage stays on your computer.'}
        </Translate>
      ),
    },
    {
      key: 'laps',
      icon: I.Stopwatch,
      title: translate({id: 'home.about.laps.title', message: 'Lap timing'}),
      text: (
        <Translate id="home.about.laps.text" values={{link: <a href="/vltl/">Video Lap Tracking Lab</a>}}>
          {'{link} times laps frame by frame from your DVR and puts live lap timers on your footage in DaVinci Resolve.'}
        </Translate>
      ),
    },
    {
      key: 'fonts',
      icon: I.Goggles,
      title: translate({id: 'home.about.fonts.title', message: 'OSD fonts'}),
      text: (
        <Translate
          id="home.about.fonts.text"
          values={{
            ttf: <code>.ttf</code>,
            link: (
              <Link to="/docs/vltl/resolve-guide/#font">
                <Translate id="home.about.fonts.link">Get them here</Translate>
              </Link>
            ),
          }}>
          {'The HDZero and Betaflight analog OSD fonts as real {ttf} fonts, so your overlays look like your goggles. {link}.'}
        </Translate>
      ),
    },
    {
      key: 'code',
      icon: I.Code,
      title: translate({id: 'home.about.code.title', message: 'Open source'}),
      text: (
        <Translate id="home.about.code.text" values={{link: <a href="https://github.com/ZeroTasteGuy">GitHub</a>}}>
          {'The code for this site and its tools is on {link}. Found a bug or have an idea? Open an issue.'}
        </Translate>
      ),
    },
    {
      key: 'community',
      icon: I.People,
      title: translate({id: 'home.about.community.title', message: 'Community'}),
      text: (
        <Translate
          id="home.about.community.text"
          values={{
            youtube: <a href="https://www.youtube.com/@maxdax_fpv">YouTube</a>,
            instagram: <a href="https://www.instagram.com/maxdax_fpv/">Instagram</a>,
          }}>
          {'Follow along on {youtube} and {instagram}, or find me on Discord as ZeroTasteGuy.'}
        </Translate>
      ),
    },
  ];
}

// "Follow" cards (in the spot of Betaflight's Team grid).
const follow = [
  {icon: I.YouTube, name: 'YouTube', handle: '@maxdax_fpv', href: 'https://www.youtube.com/@maxdax_fpv'},
  {icon: I.Instagram, name: 'Instagram', handle: '@maxdax_fpv', href: 'https://www.instagram.com/maxdax_fpv/'},
  {icon: I.GitHub, name: 'GitHub', handle: 'ZeroTasteGuy', href: 'https://github.com/ZeroTasteGuy'},
  {icon: I.Discord, name: 'Discord', handle: 'ZeroTasteGuy'},
];

export default function Home(): ReactNode {
  const latest = useLatest();
  const about = useAbout();
  return (
    <Layout
      description={translate({
        id: 'home.description',
        message: 'FPV tools, documentation and race results by maxd.ax.',
      })}>
      <div className={styles.heroBg} aria-hidden="true" />
      <main className={`container ${styles.page}`}>
        <header className={styles.hero}>
          <Heading as="h1" className={styles.wordmark}>
            <span className={styles.wmAccent}>maxd</span>.ax
          </Heading>
        </header>

        <div className={`glass ${styles.intro}`}>
          <Heading as="h2" className={styles.introTitle}>
            <Translate id="home.intro.title">FPV tools, documentation and race results</Translate>
          </Heading>
          <p>
            <Translate id="home.intro.p1">
              Free tools for FPV pilots that run right in your browser, with guides for each of them.
            </Translate>
          </p>
          <p>
            <Translate id="home.intro.p2">
              From lap timing on your goggle footage to race results, everything I build and fly ends up here.
            </Translate>
          </p>
        </div>

        <Sponsors />

        <section className={styles.block}>
          <Heading as="h2" className="section-title">
            <Translate id="home.latest.heading">Latest</Translate>
          </Heading>
          <div className={styles.latest}>
            {latest.map(c => (
              <Link key={c.to} className={styles.latestCard} to={c.to} target={c.self ? '_self' : undefined}>
                <span className={styles.latestLabel}>{c.label}</span>
                <span className={styles.latestTitle}>{c.title}</span>
                <span className={styles.latestText}>{c.text}</span>
              </Link>
            ))}
          </div>
          <Link className={styles.more} to="/tools/">
            <Translate id="home.latest.allTools">All tools →</Translate>
          </Link>
        </section>

        <section className={styles.block}>
          <Heading as="h2" className="section-title">
            <Translate id="home.about.heading">About</Translate>
          </Heading>
          <div className={styles.about}>
            {about.map(({key, icon: Icon, title, text}) => (
              <div key={key} className={styles.tabBox}>
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
            <Translate id="home.follow.heading">Follow</Translate>
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
