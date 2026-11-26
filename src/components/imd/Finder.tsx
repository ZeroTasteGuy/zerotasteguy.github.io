import {useEffect, useRef, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {SYSTEMS, POOLS, channelById, fullName, inEU} from './channels';
import {analyze, findings, noiseOf, WEIGHTS, type Mode, type SearchDone, type SearchInput} from './engine';
import {findingText, fmt} from './text';
import {BarsLegend, bandStyle, NoiseBars, ScoreBadge} from './Scores';
import styles from './styles.module.css';

// "Find the cleanest channels": pick the number of pilots and the allowed channels,
// get the 10 best sets. A result goes into the chart above with one click.

const ROWS = SYSTEMS.filter(s => s.id !== 'hz'); // HDZero's channels are the R, E, F and L rows

export default function Finder({
  bleedOffset,
  onShow,
  current,
  onBest,
}: {
  bleedOffset: number;
  onShow: (ids: string[]) => void;
  current: string[];
  onBest?: (best: {pilots: number; score: number} | null) => void;
}): ReactNode {
  const [pilots, setPilots] = useState(4);
  const [allowed, setAllowed] = useState<Set<string>>(() => new Set(POOLS.find(p => p.id === 'rf')!.ids));
  const [pool, setPool] = useState<string | null>('rf');
  const [euOnly, setEuOnly] = useState(false);
  const [minSep, setMinSep] = useState(30);
  const [mode, setMode] = useState<Mode>('balanced');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<SearchDone | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const usable = [...allowed].map(id => channelById(id)!).filter(c => c && (!euOnly || inEU(c.mhz)));
  const uniqueFreqs = new Set(usable.map(c => c.mhz)).size;

  const pickPool = (id: string) => {
    setPool(id);
    setAllowed(new Set(POOLS.find(p => p.id === id)!.ids));
  };
  const toggle = (id: string) => {
    setPool(null);
    setAllowed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = () => {
    worker.current?.terminate();
    const w = new Worker(new URL('./search.worker.ts', import.meta.url));
    worker.current = w;
    setRunning(true);
    setProgress(0);
    w.onmessage = (e: MessageEvent<{progress?: number; done?: SearchDone}>) => {
      if (e.data.progress !== undefined) setProgress(e.data.progress);
      if (e.data.done) {
        setDone(e.data.done);
        setRunning(false);
        w.terminate();
        worker.current = null;
      }
    };
    const input: SearchInput = {
      pool: usable.map(c => ({id: c.id, mhz: c.mhz})),
      pilots,
      minSep,
      bleedOffset,
      mode,
      top: 10,
      timeLimitMs: 8000,
    };
    w.postMessage(input);
  };
  // Search again whenever a setting changes (most searches take a few milliseconds).
  const poolKey = usable.map(c => c.id).join();
  useEffect(() => {
    if (uniqueFreqs < pilots) {
      worker.current?.terminate();
      setRunning(false);
      setDone(null);
      return;
    }
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [poolKey, pilots, minSep, mode, bleedOffset]);

  // The best score tells the chart above what is possible (only for the default weights,
  // which the chart's score uses too).
  useEffect(() => {
    const top = done?.results[0];
    onBest?.(top && done!.complete && mode === 'balanced' && !running ? {pilots: top.ids.length, score: top.score} : null);
  }, [done, mode, running]);

  const stop = () => {
    worker.current?.terminate();
    worker.current = null;
    setRunning(false);
  };

  const name = (id: string) => fullName(channelById(id)!);
  const asText = (ids: string[], mhz: number[]) => `${ids.map(name).join(' ')} (${mhz.map(fmt).join(' ')} MHz)`;
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <div className={styles.finder}>
      <div className={styles.finderControls}>
        <label className={styles.field}>
          <span>{translate({id: 'imd.find.pilots', message: 'Pilots'})}</span>
          <select value={pilots} onChange={e => setPilots(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>{translate({id: 'imd.find.mode', message: 'Your video transmitters'})}</span>
          <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
            <option value="balanced">{translate({id: 'imd.find.mode.balanced', message: 'Mixed or not sure'})}</option>
            <option value="imd">{translate({id: 'imd.find.mode.imd', message: 'All clean (only IMD matters)'})}</option>
            <option value="bleed">{translate({id: 'imd.find.mode.bleed', message: 'Some bleed into the next channel'})}</option>
          </select>
        </label>
      </div>

      <div className={styles.poolHead}>
        <strong>{translate({id: 'imd.find.allowed', message: 'Allowed channels'})}</strong>
        <div className={styles.poolButtons}>
          {POOLS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`${styles.pill} ${pool === p.id ? styles.pillOn : ''}`}
              onClick={() => pickPool(p.id)}>
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.pill}
            onClick={() => {
              setPool(null);
              setAllowed(new Set());
            }}>
            {translate({id: 'imd.find.clear', message: 'Clear'})}
          </button>
        </div>
      </div>
      <details className={styles.details}>
        <summary>{translate({id: 'imd.find.single', message: 'Pick single channels'})}</summary>
      <div className={styles.poolGrid}>
        {ROWS.map(s => (
          <div key={s.id} className={styles.poolRow} style={bandStyle(s.id)}>
            <span className={styles.poolRowName}>{s.name}</span>
            <div className={styles.poolChips}>
              {s.channels.map(c => {
                const on = allowed.has(c.id);
                const off = euOnly && !inEU(c.mhz);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.chip} ${on ? styles.chipOn : ''} ${off ? styles.chipOff : ''}`}
                    title={`${fmt(c.mhz)} MHz`}
                    aria-pressed={on}
                    onClick={() => toggle(c.id)}>
                    {c.name}
                    <small>{fmt(c.mhz)}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </details>
      <details className={styles.details}>
        <summary>{translate({id: 'imd.find.more', message: 'More options'})}</summary>
        <div className={styles.finderControls}>
        <label className={styles.check}>
          <input type="checkbox" checked={euOnly} onChange={e => setEuOnly(e.target.checked)} />
          {translate({id: 'imd.find.eu', message: 'Only EU-legal channels (5725–5875 MHz)'})}
        </label>
        <label className={styles.field}>
          <span>{translate({id: 'imd.find.minSep', message: 'Min. gap between channels'})}</span>
          <span className={styles.inputUnit}>
            <input type="number" min={0} max={100} step={1} value={minSep} onChange={e => setMinSep(Math.max(0, Number(e.target.value) || 0))} />
            MHz
          </span>
        </label>
        </div>
      </details>

      <div className={styles.runRow}>
        <span className={styles.muted}>
          {running
            ? translate({id: 'imd.find.running', message: 'Checking… {n} sets so far'}, {n: progress.toLocaleString()})
            : uniqueFreqs < pilots
              ? translate({id: 'imd.find.tooFew', message: 'Allow at least {n} different frequencies.'}, {n: pilots})
              : done && !done.complete
                ? translate({id: 'imd.find.doneTime', message: 'Stopped after {s} s: these are the best sets found so far (the first is usually already the best). Allow fewer channels for a full search.'}, {s: (done.ms / 1000).toFixed(1)})
                : done
                  ? translate({id: 'imd.find.doneAll2', message: 'Best {n} of all possible sets from {f} frequencies.'}, {n: done.results.length, f: uniqueFreqs})
                  : ''}
        </span>
        {running && (
          <button type="button" className="button button--sm button--secondary" onClick={stop}>
            {translate({id: 'imd.find.stop', message: 'Stop'})}
          </button>
        )}
      </div>

      {done && (
        <div className={styles.results}>
          {done.results.length === 0 ? (
            <p>{translate({id: 'imd.find.noResult', message: 'No set fits. Lower the minimum gap or allow more channels.'})}</p>
          ) : (
            <>
              <p className={styles.bestLine}>
                {translate(
                  {id: 'imd.find.best', message: 'Best possible with {n} pilots: {score}. More pilots always means more interference, so compare sets with the same number of pilots.'},
                  {n: pilots, score: done.results[0].score},
                )}
              </p>
              <ol className={styles.resultList}>
                {done.results.map(r => {
                  const shown = r.ids.length === current.length && r.ids.every(id => current.includes(id));
                  const set = r.ids.map(id => channelById(id)!);
                  const issues = findings(r.mhz, analyze(r.mhz, bleedOffset));
                  const noise = noiseOf(r.mhz, bleedOffset, WEIGHTS[mode]);
                  return (
                    <li key={r.ids.join()} className={`${styles.result} ${shown ? styles.resultShown : ''}`}>
                      <ScoreBadge score={r.score} />
                      <div className={styles.resultMain}>
                        <div className={styles.resultSet}>
                          <strong>
                            {r.ids.map((id, k) => (
                              <span key={id} className={styles.bandText} style={bandStyle(set[k].system)}>
                                {name(id)}
                              </span>
                            ))}
                          </strong>
                          <span className={styles.mhzLine}>{r.mhz.map(fmt).join(' ')} MHz</span>
                        </div>
                        <NoiseBars set={set} noise={noise} />
                        {r.twins.length > 0 && (
                          <div className={styles.twins}>
                            {translate({id: 'imd.find.twins', message: 'Works exactly the same:'})}{' '}
                            {r.twins.map((t, k) => (
                              <span key={t.ids.join()}>
                                {k > 0 && ', '}
                                <button type="button" className={styles.linkButton} onClick={() => onShow(t.ids)}>
                                  {t.ids.map(name).join(' ')}
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {issues.length === 0 ? (
                          <div className={styles.good}>{translate({id: 'imd.verdict.good', message: 'Clean: nothing lands on any of your channels.'})}</div>
                        ) : (
                          <ul className={styles.resultIssues}>
                            {issues.map((x, k) => (
                              <li key={k}>{findingText(x, set)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className={styles.actions}>
                        <button type="button" className="button button--sm button--primary" onClick={() => onShow(r.ids)}>
                          {translate({id: 'imd.find.show', message: 'Show'})}
                        </button>
                        <button type="button" className="button button--sm button--secondary" onClick={() => copy(asText(r.ids, r.mhz), r.ids.join())}>
                          {copied === r.ids.join() ? '✓' : translate({id: 'imd.find.copy', message: 'Copy'})}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <BarsLegend />
              <p className={styles.muted}>
                {translate({id: 'imd.find.scoreHelp2', message: 'The bars show how much interference lands on each channel (a full bar is about two direct hits). The score counts every channel, and one badly hit channel costs more than the same interference spread over several.'})}{' '}
                <button type="button" className={styles.linkButton} onClick={() => copy(done.results.map((r, i) => `${i + 1}. ${asText(r.ids, r.mhz)}`).join('\n'), 'all')}>
                  {copied === 'all' ? '✓' : translate({id: 'imd.find.copyAll', message: 'Copy all 10'})}
                </button>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
