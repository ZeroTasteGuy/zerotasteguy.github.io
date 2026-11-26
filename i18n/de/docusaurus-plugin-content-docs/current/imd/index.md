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

Liegen zwei oder mehr Videosender dicht beieinander, vermischen sich ihre Signale in Sender und Empfänger. Aus dieser Vermischung entstehen neue Signale auf anderen Frequenzen: die Intermodulationsverzerrung (IMD). Trifft eines dieser Signale auf den Kanal eines anderen Piloten, treten bei diesem Bildstörungen oder Streifen auf, obwohl der Kanal selbst nicht belegt ist.

Der IMD-Kanalrechner berücksichtigt drei Arten:

| Art | Formel | Beispiel |
|---|---|---|
| IMD bei 2 Piloten | 2·A − B | 2·R3 − R1 = 5806 = R5 |
| IMD bei 3 Piloten | A + B − C | R1 + R8 − R3 = 5843 = R6 |
| 5. Ordnung | 3·A − 2·B | 3·R3 − 2·R1 = 5880 = R7 (deutlich schwächer) |

Ein 3-Piloten-IMD tritt nur auf, wenn drei Piloten gleichzeitig in der Luft sind, wirkt dann jedoch häufig besonders stark und wird von vielen älteren Tools nicht berücksichtigt.

**VTX-Bleed** ist kein IMD: Einige analoge VTX senden ebenfalls Leistung auf dem Kanal darüber und darunter aus (±37 MHz auf dem Raceband). *VTX-Bleed anzeigen* aktivieren, um zu sehen, wo es auftritt.

## Das Diagramm lesen

- **Die Kanäle** sind die roten Blöcke oben. Auf einen Block oder einen Kanal in einer beliebigen Zeile klicken, um ihn zu entfernen oder hinzuzufügen.
- **Die Interferenzanzeige** stellt jedes Produkt als Linie dar: Dreieck für 2 Piloten, Raute für 3 Piloten, Punkt für die 5. Ordnung.
- Die Linien verlaufen durch die Reihen von Raceband, Fatshark und HDZero, sodass man sieht, welchen Kanal jedes Modell belegt. **Zusätzlich werden** Reihen für das Lowband, die Bänder E, B und A, Walksnail und DJI, die VTX-Überlagerungslinien sowie den EU-Bereich (5725 bis 5875 MHz) ergänzt.
- **Orange** bedeutet, dass es auf einem Kanal landet (weniger als 10 MHz entfernt), **Gelb** bedeutet „nahe“ (10 bis 20 MHz).

Eine Linie oder einen Kanal antippen (auf einem Smartphone) zeigt den Ursprung an.

## Die Punktzahl

Unter der Tabelle befindet sich eine **Bewertung** von 0 bis 100, gefolgt von einer kurzen Beschreibung der Probleme, zum Beispiel „3-Pilot-IMD landet auf R6“ oder „Nachbarn R6/R7: Wenn ein VTX ein Bleed verursacht, trifft es den anderen Piloten“.

- Ein Wert von 100 bedeutet, dass innerhalb von 35 MHz um jeden Kanal herum keine Interferenzen auftreten.
- Die Wertung geht davon aus, dass alle Piloten gleichzeitig in der Luft sind. Jedes Produkt, das in der Nähe eines Kanals landet, kostet Punkte – je näher es landet, desto mehr. IMD bei 2 und 3 Piloten zählt voll, VTX-Bleed etwa zur Hälfte, 5. Ordnung weniger als ein Drittel. Zwei Kanäle, die näher als 35 MHz beieinander liegen, kosten ebenfalls Punkte.
- Kanäle außerhalb des Bereichs von 5600 bis 6000 MHz kosten ebenfalls Punkte; je weiter sie außerhalb liegen, desto mehr. In diesem Bereich liegen alle gängigen 5,8-GHz-Antennen innerhalb ihrer Spezifikationen (Foxeer Lollipop 4: 5500 bis 6000 MHz, Pagoda-2: 5550 bis 6050, RushFPV Cherry 2: 5600 bis 6000). L8 kostet nichts, L6 ein wenig und L1 etwa so viel wie sechs direkte IMD-Treffer. Der Bereich von 5470 bis 5725 MHz wird auch von 5-GHz-WLAN genutzt.
- **Der ET-Wert** ist die Punktzahl des IMDTabler von ET, die auch in RotorHazard angezeigt wird. Dabei wird nur das 2-Piloten-IMD berücksichtigt, weshalb R1 R3 R6 R8 dort 100 Punkte erhält, obwohl das 3-Piloten-IMD genau auf den anderen Kanälen liegt.
- **Führen kleine Änderungen zu einem saubereren Bild**, sollte ein Kanal ausgetauscht und die neue Punktzahl verwendet werden.

## Kanäle finden

Anzahl der Piloten, Art der Videosender und zulässige Kanäle auswählen (ein Klick für Raceband + F2 + F4, HDZero mit Lowband, Raceband, Fatshark, alle analogen Sender, Walksnail oder DJI). Die Liste wird sofort mit den 10 besten Konfigurationen aktualisiert, jeweils mit ihrer Punktzahl und Hinweisen, worauf zu achten ist. **Mit Anzeigen** wird eine Konfiguration in die Tabelle aufgenommen.

*Die verwendeten Videosender* beeinflussen, wie stark sich der VTX-Bleed auswirkt:

- *Bei gemischten oder unklaren Störungen* gilt: VTX-Bleed wirkt etwa halb so stark wie IMD.
- *Ist alles einwandfrei*, spielt VTX-Bleed kaum eine Rolle, sodass benachbarte Kanäle unproblematisch sind.
- *Manche Konfigurationen verursachen Bleed in den nächsten Kanal*: „Bleed“ zählt doppelt, daher sollten die Gruppen einen freien Kanal zwischen den Piloten lassen.

Über *Weitere Optionen* lässt sich die Suche auf EU-konforme Kanäle beschränken und der Mindestabstand zwischen den Kanälen festlegen (standardmäßig 30 MHz).

## Beispiel: 4 Piloten auf dem Raceband

Eine perfekte Kombination aus vier Raceband-Kanälen existiert nicht, da das Raceband ein gleichmäßiges 37-MHz-Raster aufweist und somit auch die Störprodukte auf diesem Raster liegen.

- **R1 R3 R6 R7** (Standard von RotorHazard) weist auf einem Kanal kein IMD bei zwei oder drei Piloten auf. Da R6 und R7 jedoch benachbart sind, trifft ein VTX, der „VTX-Bleed“ verursacht, den anderen Piloten.
- **Bei R1 R3 R6 R8** liegen alle Piloten zwei Kanäle auseinander, sodass „Bleed“ auf leere Kanäle fällt. Da die Konfiguration jedoch symmetrisch ist (R1 + R8 = R3 + R6), fällt das 3-Piloten-IMD genau auf die anderen Kanäle: R1 + R8 − R3 = R6.

- **R1 R3 R5 R8** hält ebenfalls einen freien Kanal zwischen den Piloten frei und weist kein 3-Piloten-IMD auf, aber sein 2-Piloten-IMD verteilt sich auf zwei Kanäle: 2·R3 − R1 = R5 und 2·R3 − R5 = R1. Die Wertung geht davon aus, dass alle Piloten gleichzeitig in der Luft sind, und bewertet 2-Piloten- und 3-Piloten-IMD gleich, sodass ihre zwei Treffer die vier von R1 R3 R6 R8 übertreffen. Deshalb belegt sie den ersten Platz bei *Some bleed into the next channel*, obwohl ihre ET-Bewertung bei −22 liegt (ET berücksichtigt nur 2-Piloten-IMD).

Treten Bildstörungen nur auf, wenn alle vier Piloten gleichzeitig in der Luft und dicht beieinander sind, ist IMD die wahrscheinlichste Ursache; in diesem Fall ist R1, R3, R6, R7 die bessere Wahl. Überlagert hingegen ein Pilot ständig einen Nachbarn, liegt VTX-Bleed vor, und R1, R3, R6, R8 ist vorzuziehen.

In beiden Fällen helfen: geringe Leistung in den Pits (25 mW), nicht mehr Leistung als nötig in der Luft und Piloten, die sich verteilen, anstatt in einer Reihe zu stehen.
