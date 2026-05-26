# StockSense — AI-Powered Stock Wishlist & Prediction App

A Node.js + MongoDB backend that lets users track stocks with a live **growth score**, and generate AI-driven **price predictions** based on 5 factor groups: technical indicators, fundamentals, macro/market data, sentiment, and pattern flags.

---

## What this app does

Users can build a personal **Wishlist** of stocks they are watching. Each stock in the wishlist gets a **Growth Score (0–100)** that is automatically recalculated every morning, showing how healthy the stock looks across momentum, volume, fundamentals, and sentiment.

For any stock in the wishlist, the user can request a **Prediction** — the backend collects all the relevant market data, passes it to the Claude AI API in a structured prompt, and stores the returned direction (BULLISH / BEARISH / NEUTRAL), confidence score, and price range estimate. Once the prediction window expires (7, 14, 30, or 90 days), the outcome is resolved automatically and the model's accuracy is tracked.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | MongoDB via Mongoose |
| AI Agent | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Scheduler | `node-cron` |
| Auth | JWT + bcrypt |

---

## Project structure

```
src/
├── models/
│   ├── User.model.js          — auth, login lock, session tracking
│   ├── Wishlist.model.js      — stock watchlist + growth scores
│   └── Prediction.model.js    — AI prediction records + outcome tracking
│
├── services/
│   ├── dataService.js         — fetches live price, technical & fundamental data
│   ├── scoringService.js      — computes growth score from weighted factors
│   └── agentService.js        — builds prompt, calls Claude API, parses result
│
├── routes/
│   ├── auth.routes.js         — register, login, logout
│   ├── wishlist.routes.js     — add/remove stocks, view scores
│   └── prediction.routes.js   — run prediction, view history, accuracy stats
│
└── jobs/
    └── cronJobs.js            — daily score refresh + prediction resolution
```

---

## The two core features

### 1. Wishlist with Growth Score

Every stock in a wishlist carries a Growth Score computed from four weighted sub-scores:

| Sub-score | Weight | What it measures |
|---|---|---|
| Momentum | 40% | RSI, MACD histogram, price vs SMA200 |
| Volume | 30% | Today's volume vs 20-day average |
| Fundamental | 20% | P/E, revenue growth YoY, D/E ratio, ROE |
| Sentiment | 10% | News NLP score, analyst buy/hold/sell counts |

The score is recalculated every weekday morning at 6:30 AM IST by a cron job. Users also see `gainSinceAdded` (% change from the day they added the stock) and can set a target price with an alert.

### 2. AI Prediction

When the user requests a prediction, the backend:

1. Fetches all 5 factor groups for the selected stock
2. Builds a detailed prompt with every indicator value
3. Sends the prompt to the Claude API
4. Parses the structured JSON response (direction, confidence, price range, reasoning)
5. Saves a `Prediction` document to MongoDB
6. Returns the result to the frontend immediately

The prediction is marked `PENDING` until its target date. The nightly cron job checks for expired predictions, fetches the actual closing price, and calls `prediction.resolve(actualPrice)` — recording whether the direction was correct and how far off the price estimate was.

A `userAccuracy()` static on the Prediction model aggregates the user's historical hit rate.

---

## Factor groups (Prediction model)

### Technical indicators
`sma50`, `sma200`, `ema20`, `rsi14`, `macd`, `macdSignal`, `macdHistogram`, `bollingerUpper/Middle/Lower/Width`, `atr14`, `obv`, `volumeAvg20d`, `volumeToday`

### Fundamental factors
`peRatio`, `pbRatio`, `epsTTM`, `revenueGrowthYoY`, `netMarginPct`, `debtToEquity`, `roe`, `freeCashFlow`, `dividendYield`, `marketCapCr`

### Macro / market factors
`beta`, `sectorReturn5d`, `indexReturn5d`, `fiiNetBuyCr`, `diiNetBuyCr`, `repoRatePct`, `inflationPct`

### Sentiment factors
`newsSentimentScore` (−1 to +1), `analystBuyCount`, `analystHoldCount`, `analystSellCount`, `socialBuzzScore`, `insiderBuyRatio`

### Pattern flags (booleans)
`goldenCross`, `deathCross`, `breakoutAboveResistance`, `breakdownBelowSupport`, `highVolumeSpike`, `rsiOverbought`, `rsiOversold`, `macdBullishCross`, `macdBearishCross`

---

## Data sources

| Data type | Suggested source |
|---|---|
| Live price + technical | Yahoo Finance (unofficial) or Alpha Vantage (free tier) |
| Fundamentals | Alpha Vantage Fundamentals or Screener.in (Indian stocks) |
| FII / DII flows | NSE India API |
| News sentiment | NewsAPI + run through Claude or a sentiment library |
| Analyst ratings | Screener.in or MoneyControl scrape |

---

## User model (auth layer)

Handles standard JWT-based auth with built-in brute-force protection.

- After **4 failed logins**, the account is locked for **30 minutes** (`loginLockedUntil`)
- `isLocked` is a virtual property — no extra DB query needed
- `resetLoginAttempts()` and `increaseLoginAttempts()` are instance methods on the schema
- `password` is stored hashed (bcrypt), never returned in queries (`select: false`)

---

## Background jobs (cron)

Two tasks run every weekday morning (market days only):

**Score refresh** — iterates all wishlists, re-fetches factor data for every tracked stock, recomputes growth scores, and saves the updated values.

**Prediction resolution** — queries all `PENDING` predictions whose `targetDate ≤ now`, fetches the current price for each, calls `prediction.resolve()`, and marks them `RESOLVED` with accuracy metrics.

---

## Key design decisions

**Growth score is formula-based, not AI.** The score is deterministic and cheap to run on every stock every day. AI is reserved for the deeper per-stock predictions where reasoning across all factors adds real value.

**Factor weights are stored per prediction.** The `factorWeights` sub-document on each Prediction record means you can experiment with different weighting strategies and compare results over time without re-running old predictions.

**Model version tracking.** Every Prediction stores a `modelVersion` string. When you change the prompt or scoring logic, bump the version so you can compare accuracy before and after.

**One wishlist per user by default**, but the schema supports multiple named wishlists (up to 50 stocks each). `isDefault: true` marks the primary one.

---

## Environment variables

```
MONGODB_URI=mongodb://...
JWT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
ALPHA_VANTAGE_KEY=...        # for price + technical data
NEWS_API_KEY=...             # for news sentiment
PORT=3000
```

---

## Roadmap

- [ ] Data service implementation (Yahoo Finance + Alpha Vantage adapters)
- [ ] Auth routes (register, login, JWT refresh)
- [ ] Wishlist routes (add stock, remove, view scores)
- [ ] Prediction routes (run, history, accuracy stats)
- [ ] News sentiment NLP pipeline
- [ ] Notification service (email/push when target price is hit)
- [ ] Frontend (React / React Native)