# Race results

Each race is one `.yml` file in this folder. Subfolders (for example one per year) are fine.
The site builds the [Race results](https://maxd.ax/results/) page, the year summaries
and one page per race from these files.

## Add a race

1. On GitHub, open this folder and click **Add file → Create new file**.
2. Name it like `2026/2026-05-17-chapter-race.yml`. The name becomes the page address.
3. Paste the contents of [`_template.yml`](./_template.yml), fill it in, and delete the lines you don't need.
4. Commit. The site rebuilds in about two minutes.

If a file has a mistake (a missing date, a typo in `source`, a place that is not a number),
the build stops with a message naming the file and field, and the live site stays as it was.
You can see the message under the repository's **Actions** tab.

## Fields

| Field | Required | Example |
| --- | --- | --- |
| `event` | yes | `Chapter Race 3` |
| `date` | yes | `2026-05-17` |
| `location`, `country` | no | `Hamburg`, `Germany` |
| `series` | no | `MultiGP Global Qualifier` |
| `class` | no | `Open` |
| `position`, `pilots` | no | `3`, `24` |
| `best_lap`, `best_3_laps` | no | `18.432` or `1:02.345` |
| `source` | no (default `manual`) | `livetime`, `multigp`, `fpvscores`, `fpvtrackside`, `copterrace`, `fpvgg`, `f9u`, `manual`, `other` |
| `url` | no | link to the full results |
| `notes` | no | free text |

New sources are added in `plugins/race-results/sources.ts`.
