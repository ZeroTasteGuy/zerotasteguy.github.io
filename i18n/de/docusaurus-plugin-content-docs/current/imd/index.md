---
sidebar_position: 1
title: "IMD-Kanalrechner"
description: "Was IMD ist, wie der IMD-Kanalrechner eine Gruppe von 5,8-GHz-Kanälen bewertet und wie man Kanäle für eine Gruppe von Piloten auswählt."
translated_from: en
---

# IMD-Kanalrechner

Der [IMD-Kanalrechner](/tools/imd/) zeigt an, wo die Interferenzen der 5,8-GHz-Videokanäle auftreten, und ermittelt die störungsfreiesten Kanäle für 2 bis 8 Piloten.

<a className="button button--primary" href="/tools/imd/">Rechner öffnen</a>

## Was ist IMD?

Wenn zwei oder mehr Videosender nahe beieinander liegen, vermischen sich ihre Signale in den Sendern und Empfängern. Durch diese Vermischung entstehen neue Signale auf anderen Frequenzen: Intermodulationsverzerrungen (IMD). Wenn eines dieser Signale auf einem Kanal landet, den ein anderer Pilot nutzt, sieht dieser Pilot Bildstörungen oder Streifen im Bild, obwohl niemand auf seinem Kanal sendet.

Der Rechner berücksichtigt folgende Arten:

| Art | Formel | Beispiel |
|---|---|---|
| 2-Pilot-IMD | 2·A − B | 2·R3 − R1 = 5806 = R5 |
| 3-Pilot-IMD | A + B − C | R1 + R8 − R3 = 5843 = R6 |
| 5. Ordnung | 3·A − 2·B, 3·A − B − C, 2·A + B − 2·C, 2·A + B − C − D, A + B + C − 2·D, A + B + C − D − E | 3·R3 − 2·R1 = 5880 = R7 (deutlich schwächer) |

Die 3-Pilot-IMD tritt nur auf, wenn drei Piloten gleichzeitig in der Luft sind, wirkt jedoch häufig am stärksten, weshalb viele ältere Tools sie ignorieren.

Es gibt kein separates „4-Pilot“- oder „6-Pilot“-IMD. Die starken Arten vermischen immer zwei oder drei Sender; bei mehr Piloten gibt es einfach viel mehr Kombinationen: 24 bei 4 Piloten, 90 bei 6, 224 bei 8. Der Rechner überprüft sie alle. Nur die schwachen Arten 5. Ordnung können bis zu fünf Sender vermischen.

**VTX-Bleed** ist kein IMD: Einige analoge VTX geben ebenfalls Leistung einen Kanal höher und einen Kanal tiefer ab (±37 MHz auf dem Raceband). *Show VTX bleed* aktivieren, um zu sehen, wo diese Leistung landet.

## Lesen der Tabelle

- **Die eigenen Kanäle** werden als rote Blöcke oben angezeigt. Durch Klicken auf einen Block oder einen Kanal in einer beliebigen Zeile lässt sich dieser entfernen oder hinzufügen.
- **Die Interferenzanzeige** stellt jedes Produkt als Linie dar: Dreieck für 2-Pilot, Raute für 3-Pilot, Punkt für 5. Ordnung (wird nur gezeichnet, wenn es innerhalb von 20 MHz eines Ihrer Kanäle liegt, da es Hunderte davon mit vielen Piloten gibt).
- Die Linien verlaufen durch die Zeilen von Raceband, Fatshark und HDZero, sodass man sieht, welchen Kanal jeweils welcher trifft. **Zusätzlich werden** Zeilen für das Lowband, die Bänder E, B und A, Walksnail und DJI, die VTX-Überlauf-Linien sowie den EU-Bereich (5725 bis 5875 MHz) hinzugefügt.
- **Orange** bedeutet, dass der Wert auf einem Kanal landet (Abstand < 10 MHz), **Gelb** bedeutet „nahe“ (10 bis 20 MHz).

Durch Berühren einer Linie oder eines Kanals (auf dem Smartphone tippen) lässt sich die Herkunft anzeigen.

## Die Punktzahl

Unter der Tabelle befindet sich eine **Bewertung** von 0 bis 100, ein kleiner Balken für jeden Kanal sowie eine kurze Beschreibung der Probleme, zum Beispiel „3-Pilot-IMD liegt auf R6“ oder „Nachbarn R6/R7: Bei VTX-Bleed wird der andere Pilot beeinträchtigt“.

Die Bewertung erfolgt pro Kanal, da es darauf ankommt, welches Bild jeder Pilot empfängt:

1. Jedes Produkt fügt den benachbarten Kanälen Rauschen hinzu: vollständig, wenn es auf dem Kanal landet, etwa die Hälfte bei 20 MHz, ein Zehntel bei 37 MHz (ein Raceband-Kanal entfernt) und nichts ab 60 MHz. Ein Beinahetreffer zählt also immer noch ein wenig.
2. 2-Pilot- und 3-Pilot-IMD werden voll angerechnet, VTX-Bleed etwa zur Hälfte, jedes Produkt fünfter Ordnung zu einem Zehntel. Zwei Kanäle, die näher als 60 MHz beieinander liegen, verstärken das Rauschen auf die gleiche Weise gegenseitig.
3. Ein stark beeinträchtigter Kanal wiegt schwerer als gleiches Rauschen, das auf mehrere Kanäle verteilt ist: Das Rauschen eines Kanals zählt als Rauschen + Rauschen². Ein Pilot ohne Bild ist kritischer als alle anderen mit leicht verschlechtertem Bild.
4. Kanäle außerhalb des Bereichs von 5600 bis 6000 MHz liefern ein schwächeres Bild, sodass ihr Rauschen stärker ins Gewicht fällt und sie zusätzliche Punkteabzüge erhalten. In diesem Bereich liegen alle gängigen 5,8-GHz-Antennen innerhalb ihrer Spezifikationen (Foxeer Lollipop 4: 5500 bis 6000 MHz, Pagoda-2: 5550 bis 6050, RushFPV Cherry 2: 5600 bis 6000). L8 kostet nichts, L6 ein wenig, L1 viel. Der Bereich von 5470 bis 5725 MHz wird auch von 5-GHz-WLAN genutzt.

Die Bewertung geht davon aus, dass alle Piloten gleichzeitig in der Luft sind. 100 bedeutet keinerlei Rauschen; Rauschen durch einen direkten Treffer auf jedem Kanal ergibt etwa 70. Mehr Piloten bedeuten stets mehr Interferenzen; daher sollten stets Gruppen mit derselben Pilotenanzahl verglichen werden: 4 Piloten auf Raceband erreichen etwa 80, 8 Piloten auf allen analogen Kanälen nur etwa 25. Die **Balken** zeigen an, wo das Rauschen auftritt, aufgeschlüsselt nach Art (ein Punkt entspricht einem direkten Treffer; ein voller Balken entspricht etwa zwei direkten Treffern).

- **Die ET-Bewertung** entspricht der Punktzahl aus dem IMDTabler von ET, die ebenfalls in RotorHazard angezeigt wird; dort wird jedoch nur der 2-Pilot-IMD berücksichtigt, weshalb die Kombination R1 R3 R6 R8 dort 100 Punkte erhält, obwohl ihr 3-Pilot-IMD genau auf den anderen Kanälen liegt.
- **Kleine Änderungen, die die Darstellung übersichtlicher machen**, legen nahe, einen Kanal zu vertauschen, wie in der neuen Partitur dargestellt.

## Kanäle finden

Pick the number of pilots, what your video transmitters are like, and the allowed channels (one click for HDZero (Raceband, F2 and F4), HDZero + low band, Raceband, Fatshark, all analog, Walksnail, DJI V1 / Vista or DJI O4). The list updates right away with the 10 best sets, each with its score, the bars per channel and what to watch out for. **Show** puts a set into the chart. Above the list is the best possible score for that number of pilots, and the chart's score panel shows it too when your set has the same number of pilots.

Sätze, die Spiegelbilder oder verschobene Kopien voneinander sind (R1 R3 R6 R7 und R2 R3 R6 R8) und exakt dieselbe Punktzahl erzielen, werden als ein Ergebnis angezeigt; die übrigen Varianten erscheinen unter *Funktioniert genau gleich*.

*Die Videosender* beeinflussen, wie stark der VTX-Bleed ins Gewicht fällt:

- Bei *gemischten oder ungewissen Bedingungen* zählt VTX-Bleed etwa halb so viel wie IMD.
- *Alles sauber*: VTX-Bleed zählt kaum, benachbarte Kanäle sind daher unproblematisch.
- *Ein Teil der Leistung fließt in den nächsten Kanal über*: Da diese Überlagerung doppelt zählt, behalten die Sets einen freien Kanal zwischen den Piloten bei.

Über *Weitere Optionen* lässt sich die Suche auf EU-konforme Kanäle beschränken und der Mindestabstand zwischen den Kanälen festlegen (standardmäßig 30 MHz).

## Beispiel: 4 Piloten auf dem Raceband

Es gibt keinen perfekten Satz von 4 Raceband-Kanälen: Raceband ist ein gerades 37-MHz-Raster, daher liegen die Produkte ebenfalls auf dem Raster.

- **R1 R3 R6 R7** (Standard bei RotorHazard) weist auf keinem Kanal eine 2-Pilot- oder 3-Pilot-IMD auf. Da R6 und R7 jedoch benachbart sind, trifft ein VTX mit Bleed den anderen Piloten.
- **R1 R3 R6 R8** hält jeden Piloten zwei Kanäle voneinander entfernt, sodass der VTX-Bleed auf leeren Kanälen landet. Da die Konfiguration jedoch symmetrisch ist (R1 + R8 = R3 + R6), liegt ihr 3-Pilot-IMD genau auf den anderen Kanälen: R1 + R8 − R3 = R6.

- **R1 R3 R5 R8** hält ebenfalls einen freien Kanal zwischen den Piloten frei und weist kein 3-Pilot-IMD auf, aber sein 2-Pilot-IMD fällt auf zwei Kanäle: 2·R3 − R1 = R5 und 2·R3 − R5 = R1. Die Bewertung geht davon aus, dass alle Piloten gleichzeitig in der Luft sind, und bewertet die 2-Piloten- und 3-Piloten-IMD gleich, sodass ihre zwei Treffer die vier von R1 R3 R6 R8 übertreffen. Daher liegt sie bei *Some bleed into the next channel* vorn, obwohl ihre ET-Bewertung bei −22 liegt (ET berücksichtigt nur 2-Piloten-IMD).

- **R1 R2 R6 R8** liegt bei *Gemischt oder unsicher* an erster Stelle. Wie R1 R3 R6 R7 weist es kein IMD auf einem Kanal und ein Nachbarpaar auf, doch seine Produkte liegen etwas weiter von den anderen Kanälen entfernt.

Treten Bildstörungen nur auf, wenn alle vier Piloten gleichzeitig in der Luft und nahe beieinander sind, ist IMD die wahrscheinlichste Ursache; in diesem Fall ist R1 R3 R6 R7 die bessere Wahl. Überlagert hingegen ein Pilot ständig einen Nachbarn, liegt das Problem im VTX-Bleed, und R1 R3 R6 R8 ist die bessere Option.

Folgende Maßnahmen helfen in beiden Fällen: geringe Leistung in den Boxen (25 mW), nicht mehr Leistung als nötig in der Luft und Piloten, die sich verteilen, anstatt in einer Reihe zu stehen.
