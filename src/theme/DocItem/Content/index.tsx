import type {ReactNode} from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';

type Props = WrapperProps<typeof ContentType>;

// Shows a small note on pages that are machine translated (translated_from in the
// front matter, set by scripts/translate.mjs) or only exist in the other language
// (lang in the front matter).
export default function ContentWrapper(props: Props): ReactNode {
  const {frontMatter} = useDoc();
  const locale = useDocusaurusContext().i18n.currentLocale;
  const fm = frontMatter as {translated_from?: string; lang?: string};
  let note: string | undefined;
  if (fm.translated_from === 'de') {
    note = translate({id: 'doc.translatedFromGerman', message: 'Automatically translated from German.'});
  } else if (fm.translated_from === 'en') {
    note = translate({id: 'doc.translatedFromEnglish', message: 'Automatically translated from English.'});
  } else if (fm.lang && fm.lang !== locale) {
    note =
      fm.lang === 'de'
        ? translate({id: 'doc.onlyGerman', message: 'This page is only available in German so far.'})
        : translate({id: 'doc.onlyEnglish', message: 'This page is only available in English so far.'});
  }
  return (
    <>
      {note && <p className="site-muted translation-note">{note}</p>}
      <Content {...props} />
    </>
  );
}
