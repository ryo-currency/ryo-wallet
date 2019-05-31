import SQL from "better-sqlite3"
import { join } from "path"
import { logger } from "./utils"

//const path = require("path")
//const SQL = require("better-sqlite3")

export class Database {
    constructor(pool, options) {
        this.pool = pool
        this.db = null
        this.stats = {}
        if(options.testnet) {
            this.sqlitePath = join(options.data_dir, "gui", "pool_stats_testnet.sqlite")
        } else {
            this.sqlitePath = join(options.data_dir, "gui", "pool_stats.sqlite")
        }
        this.vacuum_interval = 1000 * 60 * 60 * 24 // 24 hours
    }

    start() {

        this.db = new SQL(this.sqlitePath)

        this.getTables()
        // tables: [ { name: 'round' }, { name: 'hashrate' }, { name: 'hashrateAvg' }, { name: 'workers' }, { name: 'blocks' } ]
        // Later version may check for existence of tables and run upgrade procedue instead

        this.init()

        this.stmt = {

            blocks: this.db.prepare("SELECT * FROM blocks ORDER BY height desc"),
            blocks_status_0: this.db.prepare("SELECT * FROM blocks WHERE status = 0"),
            blocks_update: this.db.prepare("UPDATE blocks SET status = :status, reward = :reward WHERE hash = :hash"),
            blocks_add: this.db.prepare("INSERT INTO blocks(hash, height, reward, miner, timeFound, minedTo, diff, hashes, status) VALUES(:hash, :height, :reward, :miner, :timeFound, :minedTo, :diff, :hashes, :status)"),

            workers: this.db.prepare("SELECT * FROM workers"),
            worker_add: this.db.prepare("INSERT OR IGNORE INTO workers(miner, lastShare, hashes) VALUES(:miner, :lastShare, 0)"),
            worker_update: this.db.prepare("UPDATE workers SET hashes = hashes + :hashes, lastShare = :lastShare WHERE miner = :miner"),
            workers_clean: this.db.prepare("DELETE FROM workers WHERE lastShare < :time"),

            round_hashes: this.db.prepare("SELECT SUM(hashes) as hashes FROM round"),
            round_add_worker: this.db.prepare("INSERT OR IGNORE INTO round(miner, hashes) VALUES(:miner, 0)"),
            round_update_worker: this.db.prepare("UPDATE round SET hashes = hashes + :hashes WHERE miner = :miner"),
            round_clear: this.db.prepare("DELETE FROM round"),

            hashrate_add: this.db.prepare("INSERT INTO hashrate(miner, time, hashes) VALUES(:miner, :time, :hashes)"),
            hashrate_calc: this.db.prepare("SELECT miner, SUM(hashes) as hashes, MIN(time) as start_time, MAX(time) as end_time FROM hashrate WHERE time BETWEEN :start_time AND :end_time GROUP BY miner"),
            hashrate_clean: this.db.prepare("DELETE FROM hashrate WHERE time < :time"),

            hashrate_avg: this.db.prepare("SELECT * FROM hashrateAvg"),
            hashrate_avg_add: this.db.prepare("INSERT OR IGNORE INTO hashrateAvg(miner, time, hashes) VALUES(:miner, :time, :hashes)"),
            hashrate_avg_clean: this.db.prepare("DELETE FROM hashrate WHERE time < :time"),
        }


        this.vacuum()

        setInterval(() => {
            this.vacuum()
        }, this.vacuum_interval)

    }

    stop() {
        if(this.db) {
            this.db.close()
        }
    }

    getTables() {
        return this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    }

    vacuum() {
        if(!this.db) {
            return
        }
        try {
            this.db.exec("VACUUM")
            logger.log("info", "Success vacuuming database")
        } catch(error) {
            logger.log("error", "Error vacuuming database")
        }
    }

    init() {
        this.db.prepare("CREATE TABLE IF NOT EXISTS round(miner TEXT PRIMARY KEY, hashes INTEGER) WITHOUT ROWID;").run()
        this.db.prepare("CREATE TABLE IF NOT EXISTS hashrate(miner TEXT, time DATETIME, hashes INTEGER);").run()
        this.db.prepare("CREATE TABLE IF NOT EXISTS hashrateAvg(miner TEXT, time DATETIME, hashes INTEGER);").run()
        this.db.prepare("CREATE TABLE IF NOT EXISTS workers(miner TEXT PRIMARY KEY, lastShare DATETIME, hashes INTEGER) WITHOUT ROWID;").run()
        this.db.prepare("CREATE TABLE IF NOT EXISTS blocks(hash TEXT PRIMARY KEY, height INTEGER, reward INTEGER, miner TEXT, timeFound DATETIME, minedTo TEXT, diff INTEGER, hashes INTEGER, status INTEGER) WITHOUT ROWID;").run()
    }

    heartbeat() {
        const dateNow = Date.now()

        this.unlockBlocks()
        let blocks = this.getBlocks()
        let workers = {
            "__global": {},
            ...this.getWorkers()
        }

        let activeWorkers = 0
        for(let worker of Object.keys(workers)) {
            if(workers[worker].hasOwnProperty("lastShare") && workers[worker].lastShare > dateNow - 10 * 60 * 1000) { // 10 minutes
                workers[worker].active = true
                activeWorkers++
            } else {
                workers[worker].active = false
            }
        }

        const hashrates = this.getHashrates(workers)
        let h = {
            hashrate_5min: 0,
            hashrate_1hr: 0,
            hashrate_6hr: 0,
            hashrate_24hr: 0,
        }

        for(let worker of Object.keys(hashrates)) {
            workers[worker].hashrate_graph = hashrates[worker].hashrate_graph
            h.hashrate_5min += workers[worker].hashrate_5min = hashrates[worker].hashrate_5min
            h.hashrate_1hr  += workers[worker].hashrate_1hr  = hashrates[worker].hashrate_1hr
            h.hashrate_6hr  += workers[worker].hashrate_6hr  = hashrates[worker].hashrate_6hr
            h.hashrate_24hr += workers[worker].hashrate_24hr = hashrates[worker].hashrate_24hr
        }

        this.cleanStats()

        const blockHashes = Object.keys(blocks)

        let diff = 0
        let height = 0
        if(this.pool.blocks && this.pool.blocks.current) {
            diff = this.pool.blocks.current.difficulty
            height = this.pool.blocks.current.height
        }

        let averageEffort = 0
        if(blockHashes.length) {
            for(let hash of blockHashes) {
                let block = blocks[hash]
                averageEffort += block.hashes / block.diff
            }
            averageEffort /= blockHashes.length
        }

        const roundHashes = this.getRoundHashes()
        let effort = 0
        if(diff != 0) {
            effort = Math.round(100 * roundHashes / diff) / 100
        }

        const blocksFound = Object.keys(blocks).length
        const networkHashrate = diff / 240
        const blockTime = 1000 * 240 * networkHashrate / h.hashrate_5min

        this.stats = {
            stats: {
                h,
                diff,
                activeWorkers,
                roundHashes,
                effort,
                averageEffort,
                blockTime,
                blocksFound,
                networkHashrate,
                height
            },
            blocks: Object.values(blocks),
            workers: Object.values(workers)
        }

        return this.stats

    }

    unlockBlocks() {
        const blocks = this.stmt.blocks_status_0.all()
        for(const block of blocks) {
            this.pool.sendRPC("get_block", { height: block.height }).then(data => {
                if(data.hasOwnProperty("error")) {
                    logger.log("error", "Error calling get_block %j", [data.error.message])
                    return false
                }
                if(block.reward == -1) {
                    const json = JSON.parse(data.result.json)
                    const reward = json.miner_tx.vout[0].amount
                    this.stmt.blocks_update.run({ status: 0, reward: reward, hash: block.hash })
                }
                if(data.result.block_header.hash != block.hash) {
                    logger.log("error", "Block %s ophaned", [block.hash])
                    this.stmt.blocks_update.run({ status: 1, reward: 0, hash: block.hash })
                }
                if(data.result.block_header.depth > 60) {
                    logger.log("success", "Block %s unlocked", [block.hash])
                    this.stmt.blocks_update.run({ status: 2, reward: block.reward, hash: block.hash })
                }
            })
        }
    }

    getBlocks() {
        let blocks = {}
        for(const block of this.stmt.blocks.all()) {
            blocks[block.hash] = block
        }
        return blocks
    }

    getWorkers() {
        let workers = {}
        for(const worker of this.stmt.workers.all()) {
            workers[worker.miner] = worker
        }
        return workers
    }

    cleanStats() {
        const one_day = Date.now() - 24 * 60 * 60 * 1000
        this.stmt.hashrate_clean.run({ time: one_day })
        this.stmt.hashrate_avg_clean.run({ time: one_day })
        this.stmt.workers_clean.run({ time: one_day })
    }

    getHashrates(workers) {
        const dateNow = Date.now()
        const start_of_two_minute = dateNow - (dateNow % (2 * 60 * 1000))

        let hashrates = {}
        for(let worker of Object.keys(workers)) {
            hashrates[worker] = {
                hashrate_5min: 0,
                hashrate_1hr: 0,
                hashrate_6hr: 0,
                hashrate_24hr: 0,
                hashrate_graph: {}
            }
        }

        const hashrate_5min  = this.calcHashrate(5*60)
        const hashrate_1hr   = this.calcHashrate(60*60)
        const hashrate_6hr   = this.calcHashrate(6*60*60)
        const hashrate_24hr  = this.calcHashrate(24*60*60)
        const hashrate_graph = this.getHashrateGraph(workers)

        for(let worker of Object.keys(hashrate_5min)) {
            this.stmt.hashrate_avg_add.run({ miner: worker, time: start_of_two_minute, hashes: hashrate_5min[worker] })
            hashrates[worker].hashrate_5min = hashrate_5min[worker]
        }
        for(let worker of Object.keys(hashrate_1hr)) {
            hashrates[worker].hashrate_1hr = hashrate_1hr[worker]
        }
        for(let worker of Object.keys(hashrate_6hr)) {
            hashrates[worker].hashrate_6hr = hashrate_6hr[worker]
        }
        for(let worker of Object.keys(hashrate_24hr)) {
            hashrates[worker].hashrate_24hr = hashrate_24hr[worker]
        }
        for(let worker of Object.keys(hashrate_graph)) {
            hashrates[worker].hashrate_graph = hashrate_graph[worker]
        }

        return hashrates
    }

    calcHashrate(n_time = 300, end_time = false) {
        if(!end_time) {
            end_time = Date.now()
        }
        const start_time = end_time - n_time * 1000

        let hashrates = {}
        for(const h of this.stmt.hashrate_calc.all({ start_time, end_time })) {
            hashrates[h.miner] = Math.round(100 * h.hashes / Math.max(300, (end_time - h.start_time) / 1000) ) / 100
        }
        return hashrates
    }

    getHashrateGraph(workers) {
        const dateNow = Date.now()
        const start_of_two_minute = dateNow - (dateNow % (2 * 60 * 1000))

        let graphs = {}
        for(let worker of Object.keys(workers)) {
            graphs[worker] = {}
            // initialize hashrate graph to empty
            for(let j = start_of_two_minute - 24 * 60 * 60 * 1000; j <= start_of_two_minute; j += 2 * 60 * 1000) {
                graphs[worker][j] = 0
            }
        }

        for(const h of this.stmt.hashrate_avg.all()) {
            if(graphs.hasOwnProperty(h.miner)) {
                graphs[h.miner][h.time] = h.hashes
            }
        }

        return graphs
    }

    getRoundHashes() {
        const row = this.stmt.round_hashes.get()
        return typeof row !== "undefined" ? row.hashes : 0
    }

    addWorker(workerName) {
        this.stmt.worker_add.run({ miner: workerName, lastShare: Date.now() })
    }

    recordShare(miner, job, blockCandidate, hash, blockTemplate) {
        const dateNow = Date.now()
        const workerName = miner.workerName
        const shareDiff = job.difficulty

        // Create rows for this miner if not yet exist
        this.stmt.round_add_worker.run({ miner: workerName })
        this.stmt.worker_add.run({ miner: workerName, lastShare: dateNow })

        // Insert stats for current round and overall miner stats
        this.stmt.round_update_worker.run({ hashes: shareDiff, miner: workerName })
        this.stmt.worker_update.run({ hashes: shareDiff, lastShare: dateNow, miner: workerName })

        // Add hashrate record
        this.stmt.hashrate_add.run({ miner: workerName, time: dateNow, hashes: shareDiff })

        // If is block, add to block table
        if(blockCandidate) {
            const totalHashes = this.getRoundHashes()
            this.stmt.round_clear.run()
            this.stmt.blocks_add.run({
                hash: hash,
                height: job.height,
                reward: -1,
                miner: workerName,
                timeFound: dateNow,
                minedTo: blockTemplate.address,
                diff: blockTemplate.difficulty,
                hashes: totalHashes,
                status: 0
            })
        }

    }
}
