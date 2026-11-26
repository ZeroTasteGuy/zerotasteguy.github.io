import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {translate} from '@docusaurus/Translate';
import ImdTool from '@site/src/components/imd/ImdTool';

export default function Imd(): ReactNode {
  return (
    <Layout
      title={translate({id: 'imd.title', message: 'IMD Channel Calculator'})}
      description={translate({
        id: 'imd.description',
        message: 'See where the IMD of your 5.8 GHz FPV channels lands, and find the cleanest channels for 2 to 8 pilots. Raceband, HDZero, Walksnail and DJI.',
      })}>
      <ImdTool />
    </Layout>
  );
}
