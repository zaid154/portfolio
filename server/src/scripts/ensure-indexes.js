/**
 * Build every index the app declares, once, against the configured database.
 *
 * WHY THIS EXISTS: `src/config/db.js` sets `autoIndex: false` in production, so
 * the server no longer fires ~16 `createIndexes` round-trips on every boot —
 * they landed exactly as the first visitor's request did on a free-plan cold
 * start. That means a FRESH production database gets no indexes at all until
 * this script is run, including the `unique` ones that enforce correctness
 * (User.email, the content slugs). Run it once after pointing the app at a new
 * database, and again after any schema index change is deployed.
 *
 * In development nothing changes: autoIndex is still on, so indexes build
 * themselves and this script is optional.
 *
 * WHAT IT DOES: `syncIndexes()` per model — creates indexes the schema declares
 * and DROPS indexes on the collection that the schema no longer declares (`_id`
 * excepted). That is what makes it safe to re-run, but it also means any index
 * you created by hand outside the schema will be removed.
 *
 * Run from the `server` folder, with the target database in MONGO_URI:
 *
 *   bash / Render shell:   NODE_ENV=production node src/scripts/ensure-indexes.js
 *   PowerShell:            $env:NODE_ENV="production"; node src/scripts/ensure-indexes.js
 *
 * Exits 0 on success, 1 on failure.
 */
import mongoose from 'mongoose'
import { assertEnv } from '../config/env.js'
import { connectDb } from '../config/db.js'

// Import for side effects: each module registers its models on the global
// mongoose instance, which is what `mongoose.models` below iterates. Anything
// added under src/models must be imported here too, or its indexes are missed.
import '../models/User.js'
import '../models/Message.js'
import '../models/contentModels.js'

async function run() {
  assertEnv()
  await connectDb()

  const models = Object.values(mongoose.models)
  console.log(`Syncing indexes for ${models.length} model(s) in '${mongoose.connection.name}'…\n`)

  for (const model of models) {
    // eslint-disable-next-line no-await-in-loop
    const dropped = await model.syncIndexes()
    // eslint-disable-next-line no-await-in-loop
    const indexes = await model.listIndexes()
    const name = `${model.modelName} (${model.collection.collectionName})`
    console.log(`  ${name.padEnd(42)} ${indexes.length} index(es)` + (dropped.length ? ` — dropped: ${dropped.join(', ')}` : ''))
  }

  console.log('\nDone. Indexes are in sync with the schemas.')
}

run()
  .then(async () => {
    await mongoose.disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('\nIndex sync FAILED — the database may be missing indexes.')
    console.error(err)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  })
