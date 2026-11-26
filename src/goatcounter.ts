// GoatCounter (https://www.goatcounter.com): cookie-free visitor counts.
// count.js counts the first page load by itself. Docusaurus changes pages
// without a reload, so count those navigations here.
import type {ClientModule} from '@docusaurus/types';

declare global {
  interface Window {
    goatcounter?: {count?: (vars?: {path?: string}) => void};
  }
}

const clientModule: ClientModule = {
  onRouteDidUpdate({location, previousLocation}) {
    if (!previousLocation || location.pathname === previousLocation.pathname) return;
    window.goatcounter?.count?.({path: location.pathname});
  },
};

export default clientModule;
