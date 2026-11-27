---
sidebar_position: 1
title: "IMD-Kanalrechner"
description: "Was IMD ist, wie der IMD-Kanalrechner eine Gruppe von 5,8-GHz-Kanälen bewertet und wie man Kanäle für eine Gruppe von Piloten auswählt."
translated_from: en
---

# IMD-Kanalrechner

Der [IMD-Kanalrechner](/tools/imd/) zeigt an, wo die Störungen der 5,8-GHz-Videokanäle auftreten, und ermittelt die störungsfreiesten Kanäle für 2 bis 8 Piloten.

<a className="button button--primary" href="/tools/imd/">IMD-Kanalrechner öffnen</a>

## Was ist IMD?

Liegt die Frequenz zweier oder mehrerer Videosender dicht beieinander, überlagern sich ihre Signale in Sender und Empfänger. Aus dieser Überlagerung entstehen neue Frequenzen: Intermodulationsprodukte (IMD). Trifft eines dieser Produkte auf den Kanal eines anderen Piloten, treten bei diesem Bildstörungen oder Streifen auf, obwohl der Kanal selbst nicht belegt ist.

Der Rechner berücksichtigt folgende Arten:

| Art | Formel | Beispiel |
|---|---|---|
| IMD bei 2 Piloten | 2·A − B | 2·R3 − R1 = 5806 = R5 |
| IMD bei 3 Piloten | A + B − C | R1 + R8 − R3 = 5843 = R6 |
| 5. Ordnung | 3·A − 2·B, 3·A − B − C, 2·A + B − 2·C, 2·A + B − C − D, A + B + C − 2·D, A + B + C − D − E | 3·R3 − 2·R1 = 5880 = R7 (deutlich schwächer) |

IMD bei 3 Piloten erfordert drei Piloten in der Luft, ist jedoch oft am stärksten, und viele ältere Tools ignorieren dies.

Es gibt keine separaten „4-Pilot“- oder „6-Pilot“-IMD-Werte. Die starken Arten vermischen immer zwei oder drei Sender; bei mehr Piloten gibt es einfach viel mehr Kombinationen: 24 bei 4 Piloten, 90 bei 6, 224 bei 8. Der Rechner prüft sie alle. Nur die schwachen Arten fünfter Ordnung können bis zu fünf Sender miteinander vermischen.

**VTX-Bleed** ist kein IMD: Einige analoge VTX senden auch auf dem Kanal darüber und darunter (±37 MHz auf Raceband). *VTX-Bleed anzeigen* aktivieren, um zu sehen, wo es auftritt.

## Lesen der Tabelle

- **Die eigenen Kanäle** werden als rote Blöcke oben dargestellt. Durch Klicken auf einen Block oder einen Kanal in einer beliebigen Zeile lässt sich dieser entfernen oder hinzufügen.
- **Interferenz** stellt jedes Produkt als Linie dar: Dreieck für 2-Pilot, Raute für 3-Pilot, Punkt für die 5. Ordnung (wird nur gezeichnet, wenn es innerhalb von 20 MHz eines Kanals liegt, da es bei vielen Piloten Hunderte davon gibt).
- Die Linien verlaufen durch die Zeilen von Raceband, Fatshark und HDZero, sodass man erkennt, welchen Kanal jeweils welcher Sender belegt. **Über Auch anzeigen** lassen sich zusätzliche Zeilen für das Lowband, die Bänder E, B und A, Walksnail und DJI, die VTX-Überlauflinien sowie den EU-Bereich (5725 bis 5875 MHz) hinzufügen.
- **Orange** bedeutet, dass ein Kanal direkt getroffen wird (weniger als 10 MHz Abstand), **Gelb** bedeutet „nahe“ (10 bis 20 MHz).

Durch Berühren einer Linie oder eines Kanals (auf Smartphones durch Tippen) lässt sich die Herkunft anzeigen.

## Die Bewertung

Unterhalb der Tabelle befindet sich eine **Bewertung** von 0 bis 100, ein kleiner Balken für jeden Kanal sowie die Probleme in einfachen Worten, zum Beispiel „3-Pilot-IMD liegt auf R6“ oder „Nachbarn R6/R7: Wenn ein VTX übersteuert, stört er den anderen Piloten“.

Die Bewertung erfolgt pro Kanal, da es darauf ankommt, welches Bild jeder Pilot empfängt:

1. Jedes Produkt erzeugt Rauschen auf den benachbarten Kanälen: voll, wenn es auf dem Kanal landet, etwa die Hälfte bei 20 MHz, ein Zehntel bei 37 MHz (ein Raceband-Kanal entfernt), nichts ab 60 MHz. Eine Beinahe-Kollision zählt also immer noch ein wenig.
2. IMD bei 2 und 3 Piloten zählt voll, VTX-Bleed etwa zur Hälfte, jedes Produkt fünfter Ordnung zu einem Zehntel. Zwei Kanäle, die näher als 60 MHz beieinander liegen, verstärken das Rauschen gegenseitig auf dieselbe Weise.
3. Ein stark beeinträchtigter Kanal wiegt schwerer als gleiches Rauschen, das auf mehrere Kanäle verteilt ist: Das Rauschen eines Kanals zählt als Rauschen + Rauschen². Ein Pilot ohne Bild ist kritischer als alle anderen mit leicht schlechterem Bild.
4. Kanäle außerhalb des Bereichs von 5600 bis 6000 MHz werden schwächer dargestellt, sodass ihr Rauschen stärker ins Gewicht fällt und sie zusätzliche Punkteabzüge erhalten. In diesem Bereich liegen alle gängigen 5,8-GHz-Antennen innerhalb ihrer Spezifikationen (Foxeer Lollipop 4: 5500 bis 6000 MHz, Pagoda-2: 5550 bis 6050, RushFPV Cherry 2: 5600 bis 6000). L8 kostet nichts, L6 ein wenig, L1 viel. Der Bereich von 5470 bis 5725 MHz wird auch von 5-GHz-WLAN genutzt.

Die Bewertung geht davon aus, dass alle Piloten gleichzeitig in der Luft sind. 100 bedeutet keinerlei Störsignale; Störsignale durch jeweils einen direkten Treffer auf jedem Kanal ergeben etwa 70. Mehr Piloten bedeuten stets mehr Störungen; daher sollten Kombinationen mit derselben Anzahl Piloten verglichen werden: 4 Piloten auf Raceband erreichen etwa 80, 8 Piloten auf allen analogen Kanälen nur etwa 25. Die **Balken** zeigen an, wo Störungen auftreten, aufgeschlüsselt nach Art (ein Punkt entspricht einem Treffer; ein voller Balken entspricht etwa zwei direkten Treffern).

- **Die ET-Bewertung** entspricht der Punktzahl aus dem IMDTabler von ET, die ebenfalls in RotorHazard angezeigt wird. Sie berücksichtigt nur das 2-Pilot-IMD, weshalb R1, R3, R6 und R8 dort 100 Punkte erhalten, obwohl ihr 3-Pilot-IMD genau auf den anderen Kanälen liegt.
- **Kleine Änderungen, die das Ergebnis übersichtlicher machen**, legen nahe, einen Kanal auszutauschen – unter Berücksichtigung der neuen Bewertung.

## Kanäle finden

Anzahl der Piloten, Videosenderart und zulässige Kanäle auswählen. Die Schaltflächen „HDZero“ (Raceband, F2 und F4), „HDZero + Lowband“, „Raceband“, „Fatshark“, „All Analog“, „Walksnail“, „DJI V1 / Vista“ und „DJI O4“ lassen sich kombinieren, zum Beispiel „HDZero + Walksnail“ für eine gemischte Gruppe, und *über Einzelkanäle auswählen* können einzelne Kanäle hinzugefügt oder entfernt werden. Die Liste wird sofort mit den 10 besten Konfigurationen aktualisiert, jeweils mit Punktzahl, Balken pro Kanal und Hinweisen zu Besonderheiten. **Über die Schaltfläche Anzeigen** wird eine Konfiguration in die Tabelle übernommen. Über der Liste wird die bestmögliche Punktzahl für die gewählte Teilnehmerzahl angezeigt; das Punktanzeigefeld der Tabelle zeigt diesen Wert ebenfalls an, wenn die Konfiguration die gleiche Teilnehmerzahl aufweist.

Kombinationen, die Spiegelbilder oder versetzte Kopien voneinander sind (R1, R3, R6, R7 und R2, R3, R6, R8) und exakt dieselbe Punktzahl erzielen, werden als ein Ergebnis angezeigt; die anderen erscheinen unter *Funktioniert genau gleich*.

*Die Videosender* beeinflussen, wie stark VTX-Bleed berücksichtigt wird:

- *Gemischt oder ungewiss*: VTX-Bleed zählt etwa halb so viel wie IMD.
- *Alles sauber*: VTX-Bleed zählt kaum, daher sind benachbarte Kanäle in Ordnung.
- *Bei Überlappungen auf den nächsten Kanal* zählt das Bleed doppelt, sodass zwischen den Piloten stets ein freier Kanal bleibt.

Unter *Prioritäten für die Bewertung* lässt sich über Schieberegler für jeden Teil der Bewertung festlegen, was relevant ist: Wie stark 2-Pilot-, 3-Pilot- und IMD fünfter Ordnung, VTX-Bleed, benachbarte Kanäle und die Antennenreichweite ins Gewicht fallen und wie viel mehr ein stark beeinträchtigter Kanal kostet als die gleiche Störung, die auf alle Kanäle verteilt ist (*gleiche Störung auf jedem Kanal*; bei 0 zählt nur die Gesamtsumme). Die Wertung des Diagramms verwendet dieselben Prioritäten. *Mit Zurücksetzen* kehrt man zu den Standardeinstellungen zurück.

Über *Weitere Optionen* lässt sich die Suche auf EU-konforme Kanäle beschränken und der Mindestabstand zwischen den Kanälen festlegen (standardmäßig 30 MHz).

## Beispiel: 4 Piloten auf Raceband

Es gibt keine perfekte Kombination aus 4 Raceband-Kanälen: Raceband ist ein gerades 37-MHz-Raster, daher liegen die Produkte ebenfalls auf dem Raster.

- **R1, R3, R6, R7** (Standard von RotorHazard) weist auf keinem Kanal IMD bei 2 oder 3 Piloten auf. Da R6 und R7 jedoch benachbart sind, stört ein VTX mit Übersprechen den anderen Piloten.
- **R1, R3, R6, R8** hält jeden Pilotkanal zwei Kanäle voneinander entfernt, sodass das Übersprechen auf leere Kanäle fällt. Da die Anordnung jedoch symmetrisch ist (R1 + R8 = R3 + R6), fällt das 3-Pilot-IMD genau auf die anderen Kanäle: R1 + R8 − R3 = R6.

- **R1, R3, R5, R8** lassen zudem einen freien Kanal zwischen den Piloten und weisen keine 3-Pilot-IMD auf, aber ihre 2-Pilot-IMD betrifft zwei Kanäle: 2·R3 − R1 = R5 und 2·R3 − R5 = R1. Die Bewertung geht davon aus, dass alle Piloten gleichzeitig in der Luft sind, und bewertet 2-Pilot- und 3-Pilot-IMD gleich; daher übertreffen ihre zwei Treffer die vier von R1, R3, R6 und R8. Deshalb belegt sie den ersten Platz bei *Some bleed into the next channel*, obwohl ihre ET-Bewertung bei −22 liegt (ET berücksichtigt nur 2-Piloten-IMD).

- **R1 R2 R6 R8** steht bei *Gemischt oder Unsicher* an erster Stelle. Wie R1 R3 R6 R7 weist es auf keinem Kanal IMD auf und hat nur ein Nachbarpaar, doch seine Kombinationen liegen etwas weiter von den anderen Kanälen entfernt.

Treten Bildstörungen nur auf, wenn alle vier Quads gleichzeitig in der Luft und nahe beieinander fliegen, ist IMD die wahrscheinlichste Ursache; in diesem Fall ist R1, R3, R6, R7 die bessere Wahl. Überlagert hingegen ein Pilot ständig einen Nachbarn, liegt das Problem im VTX-Bleed, und R1, R3, R6, R8 ist vorzuziehen.

Hilfreich ist in jedem Fall eine geringe Sendeleistung in den Boxen (25 mW), nicht mehr Leistung als nötig in der Luft sowie eine gleichmäßige Verteilung der Piloten, statt dass sie in einer Reihe stehen.
