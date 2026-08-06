import mongoose from 'mongoose'
import { env } from './env.js'
import { configureDns } from './dns.js'

let listenersBound = false
let everConnected = false

/**
 * Connect to MongoDB. ONE attempt: resolves when connected, throws otherwise.
 *
 * Retrying is deliberately the caller's decision, because the two callers want
 * opposite things: the server (index.js) retries in the background forever and
 * never dies, while the one-off scripts (seed.js, src/scripts/*) should fail
 * loudly and immediately rather than spin.
 *
 * Safe to call again after a failure — Mongoose resets the connection to
 * `disconnected` when the initial connect rejects, and both helpers below are
 * idempotent.
 */
export async function connectDb() {
  configureDns()
  mongoose.set('strictQuery', true)
  bindConnectionListeners()

  await mongoose.connect(env.mongoUri, {
    // Fail fast (8s) instead of hanging on an unreachable cluster, so the caller
    // reacts quickly (boxed error + retry) instead of stalling silently.
    serverSelectionTimeoutMS: 8000,
    // Mongoose defaults this to true, which fires one createIndexes round-trip
    // per model (~16 of them) the instant the connection opens — i.e. exactly
    // when the first visitor's request lands on a free-plan cold start. Dev
    // keeps the convenience; production builds indexes out of band instead:
    //
    //   cd server && NODE_ENV=production node src/scripts/ensure-indexes.js
    //
    // That script is REQUIRED once against a fresh production database, since
    // the unique indexes (User.email, content slugs) enforce correctness.
    autoIndex: env.nodeEnv !== 'production',
  })
  everConnected = true
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

/**
 * Has this process EVER reached MongoDB? Latched — it never goes back to false.
 *
 * This is what /api/health reports on, and the distinction matters. Since the
 * server now binds its socket before connecting (see index.js), a container with
 * a bad MONGO_URI or a lapsed Atlas IP allowlist would otherwise answer the
 * health probe with a cheerful 200 and let Render promote a deploy that can
 * never serve a single database-backed request — the old code got that right by
 * accident, because it died instead of listening.
 *
 * Latching rather than reading `readyState` live is deliberate: a transient drop
 * on a long-running instance must NOT start failing health checks, or Render
 * would restart the container mid-outage and hand every visitor a cold start on
 * top of the outage. Mongoose reconnects on its own; that case is already
 * handled. This flag exists purely to fail a genuinely broken *deploy*.
 */
export function hasEverConnected() {
  return everConnected
}

// After the initial connect, Mongoose auto-reconnects on transient drops. These
// listeners make those state changes visible instead of silent.
function bindConnectionListeners() {
  if (listenersBound) return
  listenersBound = true

  const conn = mongoose.connection
  conn.on('error', (err) => {
    console.error(`MongoDB connection error: ${err?.message || err}`)
  })
  conn.on('disconnected', () => {
    console.warn('MongoDB disconnected — Mongoose will attempt to reconnect.')
  })
  conn.on('reconnected', () => {
    console.log('MongoDB reconnected.')
  })
}
