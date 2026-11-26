import {useEffect, useRef, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import {SYSTEMS, POOLS, channelById, fullName, inEU} from './channels';
import {level, type Priority, type SearchDone, type SearchInput} from './engine';
import {fmt} from './text';
import styles from './styles.module.css';

// "Find the cleanest channels": pick the number of pilots and the allowed channels,
// get the 10 best sets. A result goes into the chart above with one click.

const ROWS = SYSTEMS.filter(s => s.id !== 'hz'); // HDZero's channels are the R, E, F and L rows

export default function Finder({
  bleedOffset,
  onShow,
  current,
}: {
  bleedOffset: number;
  onShow: (ids: string[]) => void;
  current: string[];
}): ReactNode {
  const [pilots, setPilots] = useState(4);
  const [allowed, setAllowed] = useState<Set<string>>(() => new Set(POOLS.find(p => p.id === 'rf')!.ids));
  const [pool, setPool] = useState<string | null>('rf');
  const [euOnly, setEuOnly] = useState(false);
  const [minSep, setMinSep] = useState(35);
  const [priority, setPriority] = useState<Priority>('imd');
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
    setDone(null);
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
      priority,
      must: [],
      top: 10,
      timeLimitMs: 20000,
    };
    w.postMessage(input);
  };
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
  const dist = (d: number) => (d === Infinity ? '–' : fmt(d));
  const cell = (d: number) => <td className={styles[`c_${level(d)}`]}>{dist(d)}</td>;

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
          <button type="button" className={`${styles.pill} ${euOnly ? styles.pillOn : ''}`} onClick={() => setEuOnly(v => !v)}>
            {translate({id: 'imd.find.eu', message: 'EU only (5725–5875)'})}
          </button>
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
        <summary>{translate({id: 'imd.find.more', message: 'More options'})}</summary>
        <div className={styles.finderControls}>
        <label className={styles.field}>
          <span>{translate({id: 'imd.find.minSep', message: 'Min. gap between channels'})}</span>
          <span className={styles.inputUnit}>
            <input type="number" min={0} max={100} step={1} value={minSep} onChange={e => setMinSep(Math.max(0, Number(e.target.value) || 0))} />
            MHz
          </span>
        </label>
        <label className={styles.field}>
          <span>{translate({id: 'imd.find.priority', message: 'Rank by'})}</span>
          <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            <option value="imd">{translate({id: 'imd.find.pri.imd', message: 'Least IMD first'})}</option>
            <option value="bleed">{translate({id: 'imd.find.pri.bleed', message: 'Safe from VTX bleed first'})}</option>
            <option value="et">{translate({id: 'imd.find.pri.et', message: 'ET rating (like FreqSetGen)'})}</option>
          </select>
        </label>
        </div>
      </details>

      <div className={styles.runRow}>
        {running ? (
          <button type="button" className="button button--secondary" onClick={stop}>
            {translate({id: 'imd.find.stop', message: 'Stop'})}
          </button>
        ) : (
          <button type="button" className="button button--primary" disabled={uniqueFreqs < pilots} onClick={run}>
            {translate({id: 'imd.find.run', message: 'Find the cleanest channels'})}
          </button>
        )}
        <span className={styles.muted}>
          {running
            ? translate({id: 'imd.find.running', message: 'Checking… {n} sets so far'}, {n: progress.toLocaleString()})
            : uniqueFreqs < pilots
              ? translate({id: 'imd.find.tooFew', message: 'Allow at least {n} different frequencies.'}, {n: pilots})
              : translate({id: 'imd.find.count', message: '{n} different frequencies allowed'}, {n: uniqueFreqs})}
        </span>
      </div>

      {done && (
        <div className={styles.results}>
          <p className={styles.muted}>
            {done.complete
              ? translate({id: 'imd.find.doneAll', message: 'Checked every set in {s} s.'}, {s: (done.ms / 1000).toFixed(1)})
              : translate({id: 'imd.find.doneTime', message: 'Stopped after {s} s: these are the best sets found so far. Allow fewer channels for a full search.'}, {s: (done.ms / 1000).toFixed(1)})}
          </p>
          {done.results.length === 0 ? (
            <p>{translate({id: 'imd.find.noResult', message: 'No set fits. Lower the minimum gap or allow more channels.'})}</p>
          ) : (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.resultTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{translate({id: 'imd.find.col.set', message: 'Channels'})}</th>
                      <th title={translate({id: 'imd.find.col.etHelp', message: 'ET rating, 100 = best'})}>ET</th>
                      <th>{translate({id: 'imd.find.col.gap', message: 'Gap'})}</th>
                      <th>{translate({id: 'imd.find.col.im3', message: '2-pilot'})}</th>
                      <th>{translate({id: 'imd.find.col.im3t', message: '3-pilot'})}</th>
                      <th>{translate({id: 'imd.find.col.im5', message: '5th'})}</th>
                      <th>{translate({id: 'imd.find.col.bleed', message: 'Bleed'})}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {done.results.map((r, i) => {
                      const shown = r.ids.length === current.length && r.ids.every(id => current.includes(id));
                      return (
                        <tr key={r.ids.join()} className={shown ? styles.rowShown : ''}>
                          <td>{i + 1}</td>
                          <td>
                            <strong>{r.ids.map(name).join(' ')}</strong>
                            <div className={styles.mhzLine}>{r.mhz.map(fmt).join(' ')}</div>
                          </td>
                          <td className={r.m.et >= 100 ? styles.c_ok : r.m.et >= 80 ? styles.c_warn : styles.c_bad}>{r.m.et}</td>
                          <td>{fmt(r.m.minSep)}</td>
                          {cell(r.m.im3)}
                          {cell(r.m.im3t)}
                          {cell(r.m.im5)}
                          {cell(r.m.bleed)}
                          <td className={styles.actions}>
                            <button type="button" className="button button--sm button--primary" onClick={() => onShow(r.ids)}>
                              {translate({id: 'imd.find.show', message: 'Show'})}
                            </button>
                            <button type="button" className="button button--sm button--secondary" onClick={() => copy(asText(r.ids, r.mhz), r.ids.join())}>
                              {copied === r.ids.join() ? '✓' : translate({id: 'imd.find.copy', message: 'Copy'})}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className={styles.muted}>
                {translate({id: 'imd.find.cols', message: 'Numbers are the distance in MHz from the closest product to a channel: bigger is better.'})}{' '}
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
