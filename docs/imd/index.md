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

The calculator looks at three kinds:

| Kind | Formula | Example |
|---|---|---|
| 2-pilot IMD | 2·A − B | 2·R3 − R1 = 5806 = R5 |
| 3-pilot IMD | A + B − C | R1 + R8 − R3 = 5843 = R6 |
| 5th order | 3·A − 2·B | 3·R3 − 2·R1 = 5880 = R7 (much weaker) |

3-pilot IMD needs three pilots in the air, but it is often the strongest, and many older tools ignore it.

**VTX bleed** is not IMD: some analog VTXs also put out power one channel up and down (±37 MHz on Raceband). Turn on *Show VTX bleed* to see where it lands.

## Reading the chart

- **Your channels** are the red blocks at the top. Click a block, or a channel in any row, to remove or add it.
- **Interference** shows each product as a line: triangle for 2-pilot, diamond for 3-pilot, dot for 5th order.
- The lines run down through the rows of Raceband, Fatshark and HDZero, so you see which channel each one hits. **Also show** adds rows for the low band, bands E, B and A, Walksnail and DJI, the VTX bleed lines and the EU range (5725 to 5875 MHz).
- **Orange** means it lands on a channel (under 10 MHz away), **amber** means close (10 to 20 MHz).

Point at a line or a channel (or tap it on a phone) to see where it comes from.

## The score

Under the chart is a **score** from 0 to 100, followed by the problems in plain words, for example "3-pilot IMD lands on R6" or "Neighbours R6/R7: if a VTX bleeds, it hits the other pilot".

- 100 means nothing lands within 35 MHz of any of your channels.
- The score assumes all pilots are in the air at the same time. Every product that lands near a channel takes points off, more the closer it lands. 2-pilot and 3-pilot IMD count fully, VTX bleed about half, 5th order less than a third. Two channels closer than 35 MHz also take points off.
- **ET rating** is the score of ET's IMDTabler, also shown in RotorHazard. It only counts 2-pilot IMD, which is why R1 R3 R6 R8 gets 100 there although its 3-pilot IMD lands right on the other channels.
- **Small changes that make it cleaner** suggests swapping one channel, with the new score.

## Finding channels

Pick the number of pilots, what your video transmitters are like, and the allowed channels (one click for Raceband + F2 + F4, HDZero with the low band, Raceband, Fatshark, all analog, Walksnail or DJI). The list updates right away with the 10 best sets, each with its score and what to watch out for. **Show** puts a set into the chart.

*Your video transmitters* changes how much VTX bleed counts:

- *Mixed or not sure*: bleed counts about half as much as IMD.
- *All clean*: bleed hardly counts, so neighbouring channels are fine.
- *Some bleed into the next channel*: bleed counts double, so sets keep a free channel between pilots.

Under *More options* you can limit the search to EU-legal channels and set the minimum gap between channels (30 MHz by default).

## Example: 4 pilots on Raceband

There is no perfect set of 4 Raceband channels: Raceband is an even 37 MHz grid, so the products land on the grid too.

- **R1 R3 R6 R7** (RotorHazard's default) has no 2-pilot or 3-pilot IMD on a channel. But R6 and R7 are neighbours, so a VTX that bleeds hits the other pilot.
- **R1 R3 R6 R8** keeps every pilot two channels apart, so bleed lands on empty channels. But it is symmetric (R1 + R8 = R3 + R6), so its 3-pilot IMD lands right on the other channels: R1 + R8 − R3 = R6.

- **R1 R3 R5 R8** also keeps a free channel between pilots and has no 3-pilot IMD, but its 2-pilot IMD lands on two channels: 2·R3 − R1 = R5 and 2·R3 − R5 = R1. The score assumes every pilot is in the air at once and counts 2-pilot and 3-pilot IMD the same, so its two hits beat the four of R1 R3 R6 R8. That is why it comes first with *Some bleed into the next channel*, even though its ET rating is −22 (ET only counts 2-pilot IMD).

If your pictures break up only when all four are in the air and close together, IMD is the likely cause and R1 R3 R6 R7 is the better choice. If one pilot always smears a neighbour, it is bleed, and R1 R3 R6 R8 is better.

Things that help either way: low power in the pits (25 mW), not more power than needed in the air, and pilots spread out rather than standing in a line.
