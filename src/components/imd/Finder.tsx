import {useEffect, useRef, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {SYSTEMS, POOLS, channelById, fullName, inEU} from './channels';
import {analyze, findings, noiseOf, DEFAULT_WEIGHTS, MODE_BLEED, type Mode, type SearchDone, type SearchInput, type Weights} from './engine';
import {findingText, fmt} from './text';
import {BarsLegend, NoiseBars, ScoreBadge} from './Scores';
import styles from './styles.module.css';

// "Find the cleanest channels": pick the number of pilots and the allowed channels,
// get the 10 best sets. A result goes into the chart above with one click.

const ROWS = SYSTEMS.filter(s => s.id !== 'hz'); // HDZero's channels are the R, E, F and L rows

export default function Finder({
  bleedOffset,
  onShow,
  current,
  onBest,
  weights,
  setWeights,
}: {
  bleedOffset: number;
  onShow: (ids: string[]) => void;
  current: string[];
  onBest?: (best: {pilots: number; score: number} | null) => void;
  weights: Weights;
  setWeights: (w: Weights) => void;
}): ReactNode {
  const [pilots, setPilots] = useState(4);
  const [allowed, setAllowed] = useState<Set<string>>(() => new Set(POOLS.find(p => p.id === 'hz')!.ids));
  // Pool buttons can be combined (HDZero + Walksnail): allowed = all their channels.
  const [pools, setPools] = useState<Set<string>>(() => new Set(['hz']));
  const [euOnly, setEuOnly] = useState(false);
  const [minSep, setMinSep] = useState(30);
  const mode = (Object.keys(MODE_BLEED) as Mode[]).find(m => MODE_BLEED[m] === weights.bleed) ?? 'custom';
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<SearchDone | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const usable = [...allowed].map(id => channelById(id)!).filter(c => c && (!euOnly || inEU(c.mhz)));
  const uniqueFreqs = new Set(usable.map(c => c.mhz)).size;

  const pickPool = (id: string) => {
    const next = new Set(pools);
    const ids = POOLS.find(p => p.id === id)!.ids;
    if (next.has(id)) {
      next.delete(id);
      const keep = new Set([...next].flatMap(k => POOLS.find(p => p.id === k)!.ids));
      setAllowed(prev => new Set([...prev].filter(c => !ids.includes(c) || keep.has(c))));
    } else {
      next.add(id);
      setAllowed(prev => new Set([...prev, ...ids]));
    }
    setPools(next);
  };
  const toggle = (id: string) => {
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
      weights,
      top: 10,
      timeLimitMs: 8000,
    };
    w.postMessage(input);
  };
  const weightsKey = JSON.stringify(weights);
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
  }, [poolKey, pilots, minSep, weightsKey, bleedOffset]);

  // The best score tells the chart above what is possible (only for the default weights,
  // which the chart's score uses too).
  useEffect(() => {
    const top = done?.results[0];
    onBest?.(top && done!.complete && !running ? {pilots: top.ids.length, score: top.score} : null);
  }, [done, running]);

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
          <select value={mode} onChange={e => e.target.value !== 'custom' && setWeights({...weights, bleed: MODE_BLEED[e.target.value as Mode]})}>
            <option value="balanced">{translate({id: 'imd.find.mode.balanced', message: 'Mixed or not sure'})}</option>
            <option value="imd">{translate({id: 'imd.find.mode.imd', message: 'All clean (only IMD matters)'})}</option>
            <option value="bleed">{translate({id: 'imd.find.mode.bleed', message: 'Some bleed into the next channel'})}</option>
            {mode === 'custom' && <option value="custom">{translate({id: 'imd.find.mode.custom', message: 'Own bleed priority (below)'})}</option>}
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
              aria-pressed={pools.has(p.id)}
              className={`${styles.pill} ${pools.has(p.id) ? styles.pillOn : ''}`}
              onClick={() => pickPool(p.id)}>
              {pools.has(p.id) ? '✓ ' : '+ '}
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={styles.pill}
            onClick={() => {
              setPools(new Set());
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
          <div key={s.id} className={styles.poolRow}>
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
        <summary>{translate({id: 'imd.find.prio', message: 'Priorities for the score'})}</summary>
        <Priorities weights={weights} setWeights={setWeights} />
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
                  const noise = noiseOf(r.mhz, bleedOffset, weights);
                  return (
                    <li key={r.ids.join()} className={`${styles.result} ${shown ? styles.resultShown : ''}`}>
                      <ScoreBadge score={r.score} />
                      <div className={styles.resultMain}>
                        <div className={styles.resultSet}>
                          <strong>{r.ids.map(name).join(' ')}</strong>
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

// Sliders for every weight of the score, so people can try what matters to them. The
// chart's score above uses the same priorities.
function Priorities({weights, setWeights}: {weights: Weights; setWeights: (w: Weights) => void}): ReactNode {
  const SLIDERS: {key: keyof Weights; label: string; help: string; max: number; step: number}[] = [
    {
      key: 'even',
      label: translate({id: 'imd.prio.even', message: 'Same interference on every channel'}),
      help: translate({id: 'imd.prio.even.help', message: 'Higher: one badly hit channel costs much more than the same interference spread over all. 0: only the total counts.'}),
      max: 5,
      step: 0.1,
    },
    {key: 'im3', label: translate({id: 'imd.type.im3', message: '2-pilot IMD'}), help: '2·A − B', max: 3, step: 0.1},
    {key: 'im3t', label: translate({id: 'imd.type.im3t', message: '3-pilot IMD'}), help: 'A + B − C', max: 3, step: 0.1},
    {key: 'im5', label: translate({id: 'imd.type.im5', message: '5th order IMD'}), help: '3·A − 2·B …', max: 1, step: 0.05},
    {
      key: 'bleed',
      label: translate({id: 'imd.type.bleed', message: 'VTX bleed'}),
      help: translate({id: 'imd.prio.bleed.help', message: 'Also set by "Your video transmitters".'}),
      max: 3,
      step: 0.1,
    },
    {
      key: 'gap',
      label: translate({id: 'imd.part.gap', message: 'Channel too close'}),
      help: translate({id: 'imd.prio.gap.help', message: 'Channels less than 60 MHz apart.'}),
      max: 6,
      step: 0.1,
    },
    {
      key: 'edge',
      label: translate({id: 'imd.part.edge', message: 'Antenna range'}),
      help: translate({id: 'imd.prio.edge.help', message: 'Channels outside 5600–6000 MHz.'}),
      max: 3,
      step: 0.1,
    },
  ];
  const changed = (Object.keys(DEFAULT_WEIGHTS) as (keyof Weights)[]).some(k => weights[k] !== DEFAULT_WEIGHTS[k]);
  return (
    <div className={styles.prio}>
      {SLIDERS.map(sl => (
        <label key={sl.key} className={styles.prioRow}>
          <span className={styles.prioLabel}>
            {sl.label}
            <small>{sl.help}</small>
          </span>
          <input
            type="range"
            min={0}
            max={sl.max}
            step={sl.step}
            value={weights[sl.key]}
            onChange={e => setWeights({...weights, [sl.key]: Number(e.target.value)})}
          />
          <output className={`${styles.prioValue} ${weights[sl.key] !== DEFAULT_WEIGHTS[sl.key] ? styles.prioChanged : ''}`}>
            {weights[sl.key].toFixed(sl.step < 0.1 ? 2 : 1)}
          </output>
        </label>
      ))}
      <div className={styles.prioFoot}>
        <span className={styles.muted}>
          {translate({id: 'imd.prio.note', message: '0 = does not count; 1 = one direct hit counts as 1. Scores with changed priorities can not be compared with the default ones.'})}
        </span>
        <button type="button" className="button button--sm button--secondary" disabled={!changed} onClick={() => setWeights(DEFAULT_WEIGHTS)}>
          {translate({id: 'imd.prio.reset', message: 'Reset'})}
        </button>
      </div>
    </div>
  );
}
