// Default journal for new trades. `[a / b]` placeholders can be filled from the
// editor: Tab jumps between them, Up/Down cycles their options.
export const TRADE_PLAN_TEMPLATE = `# BTC Trading Plan

Structure rule: HH/HL = up, LH/LL = down. A swing needs 2 candles on each side. Hourly = the 1h, 2h or 4h. Pick one per trade and use it for entry, trailing and invalidation.

## Big Picture / Bias

Daily structure. Up = +1, down = −1. DXY is reversed.

- SPX: [up → +1 / down → −1]
- Gold: [up → +1 / down → −1]
- DXY: [up → −1 / down → +1]
- BTC: [up → +1 / down → −1]

Bias score: [score] → +2 or more = long · −2 or less = short · 0 = no with-trend trade

## Intraday Fundamentals

- ETF flow yesterday: [inflow / outflow] [$M] ([farside](https://farside.co.uk/btc/))
- Events today: [none / event, date, time]
- High-impact (CPI, PPI, FOMC, NFP, PCE): no entries 1h before to 30min after

## Technical Analysis

- Nearest weekly support / resistance: [level] → [clear / near (within 1 daily ATR)]
- Weekly structure: [up / down / reversing]
- Daily structure: internal [up / down], external [up / down]
- 2-week SMA: sloping [up / down / flat]
- AVWAP from [anchor]: acting as [support / resistance]

## Setup

- Direction: [long / short] · Type: [with / against] · Timeframe: [1h / 2h / 4h]
- Entry: body [open / close] at hourly level [price]
- Stop: 0.1% beyond the wick [price]
- Target: [price] · R:R [R:R] (minimum 2R)

## Management

- At +2R → stop to breakeven
- Trail 0.1% beyond each new hourly swing
- Exit early if an hourly candle closes back through the setup level

## Grade

1 point each.

- [ ] Bias fits the trade (with: score ±2 and BTC agrees · against: score no more than 1 point against)
- [ ] Hourly structure fits (with: agrees with daily · against: has flipped)
- [ ] No key level against the trade (weekly S/R or AVWAP) · against: price is at a weekly level
- [ ] No high-impact news in the blackout window
- [ ] R:R ≥ 2

With the trend: 5–4 = A/B full size · 3 = C half size · ≤2 = skip
Against the trend: 5–4 = take it · ≤3 = skip

Grade: [A/B/C/D]

## Review

- Result: [±R]
- Price 12h after exit: [continued / reversed]
- Followed the plan? [Y / N] → if N, which rule and why: [rule, why]
- Execution grade: [A = all rules · B = minor slip · C = major slip · D = off-plan]
`;
