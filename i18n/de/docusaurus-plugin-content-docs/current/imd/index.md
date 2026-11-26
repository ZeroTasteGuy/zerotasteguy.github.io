---
sidebar_position: 1
title: "IMD-Kanalrechner"
description: "Was IMD ist, wie der IMD-Kanalrechner eine Reihe von 5,8-GHz-Kanälen bewertet und wie man Kanäle für eine Gruppe von Piloten auswählt."
translated_from: en
---

# IMD-Kanalrechner

Der [IMD-Kanalrechner](/tools/imd/) zeigt an, wo die Interferenzen der 5,8-GHz-Videokanäle auftreten, und ermittelt die störungsfreiesten Kanäle für 2 bis 8 Piloten.

<a className="button button--primary" href="/tools/imd/">IMD-Kanalrechner öffnen</a>

## Was ist IMD?

Liegt ein VTX-Bleed vor, ist R1 R3 R6 R8 die bessere Wahl. Hilfreich sind in beiden Fällen: niedrige Sendeleistung im Pits (25 mW), im Flug nur so viel Leistung wie nötig und eine verteilte Position der Piloten statt einer Reihe.
Wenn zwei oder mehr Videosender nahe beieinander liegen, vermischen sich ihre Signale in Sender und Empfänger. Durch diese Vermischung entstehen neue Signale auf anderen Frequenzen: Intermodulationsverzerrung (IMD). Trifft eines dieser Signale auf einen Kanal, den ein anderer Pilot nutzt, treten bei diesem Bildstörungen oder Streifen auf, obwohl der Kanal nicht belegt ist.

Der IMD-Kanalrechner berücksichtigt drei Arten:

| Art | Formel | Beispiel |
|---|---|---|
| IMD bei 2 Piloten | 2·A − B | 2·R3 − R1 = 5806 = R5 |
| IMD bei 3 Piloten | A + B − C | R1 + R8 − R3 = 5843 = R6 |
| 5. Ordnung | 3·A − 2·B | 3·R3 − 2·R1 = 5880 = R7 (deutlich schwächer) |

Ein 3-Piloten-IMD tritt nur auf, wenn drei Piloten gleichzeitig in der Luft sind, wirkt dann jedoch häufig am stärksten und wird von vielen älteren Tools ignoriert.

**VTX-Bleed** ist kein IMD: Einige analoge VTX senden ebenfalls Leistung auf dem Kanal darüber und darunter aus (±37 MHz auf dem Raceband). *VTX-Bleed anzeigen* aktivieren, um zu sehen, wo es landet.

## Das Diagramm lesen

- **Die Kanäle** sind die roten Blöcke oben. Auf einen Block oder einen Kanal in einer beliebigen Zeile klicken, um ihn zu entfernen oder hinzuzufügen.
- **Die Interferenzanzeige** stellt jedes Produkt als Linie dar: Dreieck für 2 Piloten, Raute für 3 Piloten, Punkt für die 5. Ordnung.
- Die Linien verlaufen durch die Reihen von Raceband, Fatshark und HDZero, sodass man sieht, welchen Kanal jedes Modell belegt. **Zusätzlich werden** Reihen für das Lowband, die Bänder E, B und A, Walksnail und DJI, die VTX-Überlagerungslinien sowie den EU-Frequenzbereich (5725 bis 5875 MHz) hinzugefügt.
- **Orange** bedeutet, dass es auf einem Kanal landet (weniger als 10 MHz entfernt), **Gelb** bedeutet „nahe“ (10 bis 20 MHz).

Eine Linie oder einen Kanal antippen (auf einem Smartphone) zeigt dessen Herkunft an.

## Die Punktzahl

Unter der Tabelle befindet sich eine **Bewertung** von 0 bis 100, gefolgt von einer kurzen Beschreibung der Probleme, zum Beispiel „3-Pilot-IMD landet auf R6“ oder „Nachbarn R6/R7: Wenn ein VTX ein Bleed verursacht, trifft es den anderen Piloten“.

- Bei 100 % landet innerhalb von ±35 MHz um jeden Kanal nichts.
- Jedes Produkt, das in der Nähe eines Kanals landet, kostet Punkte – je näher es landet, desto mehr. IMD bei 2 und 3 Piloten zählt voll, VTX-Bleed etwa zur Hälfte, 5. Ordnung weniger als ein Drittel. Zwei Kanäle, die näher als 35 MHz beieinander liegen, kosten ebenfalls Punkte.
- **Der ET-Wert** ist die Bewertung des IMDTabler von ET, die auch in RotorHazard angezeigt wird. Dabei wird nur das 2-Piloten-IMD berücksichtigt, weshalb R1 R3 R6 R8 dort 100 Punkte erhält, obwohl das 3-Piloten-IMD genau auf den anderen Kanälen liegt.
- **Small changes that make it cleaner** suggests swapping one channel, with the new score.

## Kanäle finden

Anzahl der Piloten, Typ der Videosender und zulässige Kanäle auswählen (ein Klick für Raceband + F2 + F4, HDZero mit Lowband, Raceband, Fatshark, alle analogen Sender, Walksnail oder DJI). Die Liste wird sofort mit den 10 besten Konfigurationen aktualisiert, jeweils mit Punktzahl und Hinweisen zu Besonderheiten. **Über Anzeigen** wird eine Konfiguration in die Tabelle aufgenommen.

*Die verwendeten Videosender* beeinflussen, wie stark sich der VTX-Bleed auswirkt:

- Bei *gemischten oder unklaren Störungen* wirkt VTX-Bleed etwa halb so stark wie IMD.
- Wenn *alles sauber läuft*, spielt VTX-Bleed kaum eine Rolle, sodass benachbarte Kanäle unproblematisch sind.
- *Manche Signale dringen in den nächsten Kanal ein*: „Bleed“ zählt doppelt, daher sollten die Gruppen einen freien Kanal zwischen den Piloten lassen.

Über *Weitere Optionen* lässt sich die Suche auf EU-konforme Kanäle beschränken und der Mindestabstand zwischen den Kanälen festlegen (standardmäßig 30 MHz).

## Beispiel: 4 Piloten auf dem Raceband

Es gibt keine perfekte Kombination aus vier Raceband-Kanälen: Raceband ist ein gleichmäßiges 37-MHz-Raster, daher liegen die Produkte ebenfalls auf diesem Raster.

- **R1 R3 R6 R7** (Standard bei RotorHazard) weist auf keinem Kanal IMD bei zwei oder drei Piloten auf. Da R6 und R7 jedoch benachbart sind, beeinträchtigt ein VTX mit VTX-Bleed den anderen Piloten.
- **Bei R1 R3 R6 R8** liegen alle Piloten zwei Kanäle auseinander, sodass „Bleed“ auf leere Kanäle fällt. Da die Konfiguration jedoch symmetrisch ist (R1 + R8 = R3 + R6), fällt das IMD bei drei Piloten genau auf die anderen Kanäle: R1 + R8 − R3 = R6.

Treten Bildstörungen nur auf, wenn alle vier Piloten gleichzeitig in der Luft und dicht beieinander sind, ist IMD die wahrscheinlichste Ursache; in diesem Fall ist die Kanalfolge R1, R3, R6, R7 die bessere Wahl. Überlagert hingegen ein Pilot stets einen Nachbarn, liegt das Problem im VTX-Bleed, und die Kanalfolge R1, R3, R6, R8 ist vorzuziehen.

In beiden Fällen helfen: geringe Leistung in den Boxen (25 mW), nicht mehr Leistung als nötig in der Luft und Piloten, die sich verteilen, anstatt in einer Reihe zu stehen.
