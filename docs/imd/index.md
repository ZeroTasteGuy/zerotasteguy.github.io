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
- **IMD / bleed** shows each product as a line: triangle for 2-pilot, diamond for 3-pilot, dot for 5th order, dashed for bleed.
- The lines run down through the rows of every channel system (Raceband, Fatshark, HDZero, Walksnail, DJI and more), so you see which channel each one hits.
- **Orange** means it lands on a channel (under 10 MHz away), **amber** means close (10 to 20 MHz).
- The green area is the EU / German 5.8 GHz range, 5725 to 5875 MHz.

Point at a line or a channel (or tap it on a phone) to see where it comes from.

## The numbers

- **IMD rating (ET):** the same score as ET's IMDTabler and RotorHazard's settings page. 100 means no 2-pilot product comes within 35 MHz of a channel; it can go below zero. It only counts 2-pilot IMD.
- **Closest channels:** the smallest gap in your set. Under about 30 MHz the pilots interfere directly.
- **2-pilot, 3-pilot, 5th order, bleed:** how close the worst product of each kind comes to one of your channels. Bigger is better.

## Finding channels

Choose the number of pilots and the allowed channels (one click for Raceband, HDZero, Walksnail, DJI and more, plus *EU only*), then click **Find the cleanest channels**. It checks every possible set and lists the best 10. **Show** puts a set into the chart.

Under *More options*:

- **Min. gap between channels** (35 MHz by default) skips sets with channels closer than that.
- **Rank by**
  - *Least IMD first*: no 2-pilot or 3-pilot IMD on a channel, then as little bleed as possible.
  - *Safe from VTX bleed first*: no pilot's bleed lands on another pilot, then as little IMD as possible.
  - *ET rating*: the classic ranking of ET's FreqSetGen.

## Example: 4 pilots on Raceband

There is no perfect set of 4 Raceband channels: Raceband is an even 37 MHz grid, so the products land on the grid too.

- **R1 R3 R6 R7** (RotorHazard's default) has no 2-pilot or 3-pilot IMD on a channel. But R6 and R7 are neighbours, so a VTX that bleeds hits the other pilot.
- **R1 R3 R6 R8** keeps every pilot two channels apart, so bleed lands on empty channels. But it is symmetric (R1 + R8 = R3 + R6), so its 3-pilot IMD lands right on the other channels: R1 + R8 − R3 = R6.

If your pictures break up only when all four are in the air and close together, IMD is the likely cause and R1 R3 R6 R7 is the better choice. If one pilot always smears a neighbour, it is bleed, and R1 R3 R6 R8 is better.

Things that help either way: low power in the pits (25 mW), not more power than needed in the air, and pilots spread out rather than standing in a line.
