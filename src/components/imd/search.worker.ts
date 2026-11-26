// Runs the channel search off the main thread, so the page stays responsive.
import {search, type SearchInput} from './engine';

self.onmessage = (e: MessageEvent<SearchInput>) => {
  const done = search(e.data, checked => self.postMessage({progress: checked}));
  self.postMessage({done});
};
