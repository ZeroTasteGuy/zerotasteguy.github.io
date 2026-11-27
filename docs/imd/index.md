---
sidebar_position: 1
title: IMD Channel Calculator
description: What IMD is, how the IMD Channel Calculator scores a set of 5.8 GHz channels, and how to pick channels for a group of pilots.
---

# IMD Channel Calculator

The [IMD Channel Calculator](/tools/imd/) shows where the interference of your 5.8 GHz video channels lands, and finds the cleanest channels for 2 to 8 pilots.

<a className="button button--primary" href="/tools/imd/">Open the calculator</a>

## What IMD is

When two or more video transmitters are close together, their signals mix in the transmitters and receivers. The mix creates new signals on other frequencies: intermodulation distortion, or IMD. If one of those lands on a channel another pilot is using, that pilot sees breakup or lines in the picture, even though nobody is on their channel.

The calculator looks at these kinds:

| Kind | Formula | Example |
|---|---|---|
| 2-pilot IMD | 2·A − B | 2·R3 − R1 = 5806 = R5 |
| 3-pilot IMD | A + B − C | R1 + R8 − R3 = 5843 = R6 |
| 5th order | 3·A − 2·B, 3·A − B − C, 2·A + B − 2·C, 2·A + B − C − D, A + B + C − 2·D, A + B + C − D − E | 3·R3 − 2·R1 = 5880 = R7 (much weaker) |

3-pilot IMD needs three pilots in the air, but it is often the strongest, and many older tools ignore it.

There is no separate "4-pilot" or "6-pilot" IMD. The strong kinds always mix two or three transmitters; with more pilots there are simply many more combinations: 24 with 4 pilots, 90 with 6, 224 with 8. The calculator checks all of them. Only the weak 5th order kinds can mix up to five transmitters.

**VTX bleed** is not IMD: some analog VTXs also put out power one channel up and down (±37 MHz on Raceband). Turn on *Show VTX bleed* to see where it lands.

## Reading the chart

- **Your channels** are the red blocks at the top. Click a block, or a channel in any row, to remove or add it.
- **Interference** shows each product as a line: triangle for 2-pilot, diamond for 3-pilot, dot for 5th order (only drawn when it lands within 20 MHz of one of your channels, as there are hundreds of them with many pilots).
- The lines run down through the rows of Raceband, Fatshark and HDZero, so you see which channel each one hits. **Also show** adds rows for the low band, bands E, B and A, Walksnail and DJI, the VTX bleed lines and the EU range (5725 to 5875 MHz).
- **Orange** means it lands on a channel (under 10 MHz away), **amber** means close (10 to 20 MHz).

Point at a line or a channel (or tap it on a phone) to see where it comes from.

## The score

Under the chart is a **score** from 0 to 100, a small bar for each of your channels, and the problems in plain words, for example "3-pilot IMD lands on R6" or "Neighbours R6/R7: if a VTX bleeds, it hits the other pilot".

The score works per channel, because what matters is the picture each pilot gets:

1. Every product adds noise to the channels near it: fully when it lands on the channel, about half at 20 MHz, a tenth at 37 MHz (one Raceband channel away), nothing from 60 MHz. So a near miss still counts a little.
2. 2-pilot and 3-pilot IMD count fully, VTX bleed about half, each 5th order product a tenth. Two channels closer than 60 MHz add noise to each other the same way.
3. One badly hit channel costs more than the same noise spread over several channels: a channel's noise counts as noise + noise². One pilot with no picture is worse than everyone with a slightly worse one.
4. Channels outside 5600 to 6000 MHz get a weaker picture, so their noise counts more, and they take points off on top. That is the range in which all common 5.8 GHz antennas are within their specs (Foxeer Lollipop 4: 5500 to 6000 MHz, Pagoda-2: 5550 to 6050, RushFPV Cherry 2: 5600 to 6000). L8 costs nothing, L6 a little, L1 a lot. 5470 to 5725 MHz is also used by 5 GHz Wi-Fi.

The score assumes all pilots are in the air at the same time. 100 means no noise at all; noise of one direct hit on every channel gives about 70. More pilots always means more interference, so compare sets with the same number of pilots: 4 pilots on Raceband reach about 80, 8 pilots on all analog channels only about 25. The **bars** show where the noise lands, split by kind (point at one for the numbers; a full bar is about two direct hits).

- **ET rating** is the score of ET's IMDTabler, also shown in RotorHazard. It only counts 2-pilot IMD, which is why R1 R3 R6 R8 gets 100 there although its 3-pilot IMD lands right on the other channels.
- **Small changes that make it cleaner** suggests swapping one channel, with the new score.

## Finding channels

Pick the number of pilots, what your video transmitters are like, and the allowed channels. The buttons HDZero (Raceband, F2 and F4), HDZero + low band, Raceband, Fatshark, all analog, Walksnail, DJI V1 / Vista and DJI O4 can be combined, for example HDZero + Walksnail for a mixed group, and *Pick single channels* adds or removes single channels. The list updates right away with the 10 best sets, each with its score, the bars per channel and what to watch out for. **Show** puts a set into the chart. Above the list is the best possible score for that number of pilots, and the chart's score panel shows it too when your set has the same number of pilots.

Sets that are mirror images or shifted copies of each other (R1 R3 R6 R7 and R2 R3 R6 R8) and score exactly the same are shown as one result, with the others under *Works exactly the same*.

*Your video transmitters* changes how much VTX bleed counts:

- *Mixed or not sure*: bleed counts about half as much as IMD.
- *All clean*: bleed hardly counts, so neighbouring channels are fine.
- *Some bleed into the next channel*: bleed counts double, so sets keep a free channel between pilots.

Under *Priorities for the score* a slider for each part of the score lets you try what matters to you: how much 2-pilot, 3-pilot and 5th order IMD, VTX bleed, close channels and the antenna range count, and how much more one badly hit channel costs than the same interference spread over all channels (*Same interference on every channel*; at 0 only the total counts). The chart's score uses the same priorities. *Reset* goes back to the defaults.

Under *More options* you can limit the search to EU-legal channels and set the minimum gap between channels (30 MHz by default).

## Example: 4 pilots on Raceband

There is no perfect set of 4 Raceband channels: Raceband is an even 37 MHz grid, so the products land on the grid too.

- **R1 R3 R6 R7** (RotorHazard's default) has no 2-pilot or 3-pilot IMD on a channel. But R6 and R7 are neighbours, so a VTX that bleeds hits the other pilot.
- **R1 R3 R6 R8** keeps every pilot two channels apart, so bleed lands on empty channels. But it is symmetric (R1 + R8 = R3 + R6), so its 3-pilot IMD lands right on the other channels: R1 + R8 − R3 = R6.

- **R1 R3 R5 R8** also keeps a free channel between pilots and has no 3-pilot IMD, but its 2-pilot IMD lands on two channels: 2·R3 − R1 = R5 and 2·R3 − R5 = R1. The score assumes every pilot is in the air at once and counts 2-pilot and 3-pilot IMD the same, so its two hits beat the four of R1 R3 R6 R8. That is why it comes first with *Some bleed into the next channel*, even though its ET rating is −22 (ET only counts 2-pilot IMD).

- **R1 R2 R6 R8** comes first with *Mixed or not sure*. Like R1 R3 R6 R7 it has no IMD on a channel and one pair of neighbours, but its products land a bit further from the other channels.

If your pictures break up only when all four are in the air and close together, IMD is the likely cause and R1 R3 R6 R7 is the better choice. If one pilot always smears a neighbour, it is bleed, and R1 R3 R6 R8 is better.

Things that help either way: low power in the pits (25 mW), not more power than needed in the air, and pilots spread out rather than standing in a line.
