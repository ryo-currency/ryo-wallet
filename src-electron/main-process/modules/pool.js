import ryo_utils_promise from "ryo-core-js/ryo_utils/ryo_utils"
import * as ryo_utils_nettype from "ryo-core-js/ryo_utils/ryo_utils_nettype"
import BigInt from "big-integer"
import { createServer } from "net"
import { join } from "path"
import { Miner } from "./pool/miner"
import { Block } from "./pool/block"
import { Database } from "./pool/database"
import { diff1, noncePattern, uid, logger } from "./pool/utils"

const request = require("request-promise")
const http = require("http")

export class Pool {
    constructor(backend) {
        this.backend = backend
        this.daemon_type = backend.config_data.daemon.type
        this.active = false
        this.config = null
        this.server = null

        this.id = 0
        this.agent = new http.Agent({keepAlive: true, maxSockets: 1})

        this.intervals = {
            startup: null,
            job: null,
            timeout: null,
            retarget: null,
            stats: null
        }

        const { data_dir, testnet } = backend.config_data.app

        if(testnet) {
            this.nettype = ryo_utils_nettype.network_type.TESTNET
            logger.setLogFile(join(data_dir, "testnet", "logs"), "pool.log")
        } else {
            this.nettype = ryo_utils_nettype.network_type.MAINNET
            logger.setLogFile(join(data_dir, "logs"), "pool.log")
        }
        logger.log("info", "Logger initialized")

        this.database = new Database(this, { testnet, data_dir })

        ryo_utils_promise.then(core_bridge => {
            this.core_bridge = core_bridge

            // Initial check to make sure construct block blob is working with known values
            const template = "0707a3b8a9e5050b20eb040be32fe62a3c0b539df3732d469915e05d4a2a5b251c6ea3cd028f010000000003ff880f01ffc3880f01a0f2afc7b50102e4125c8981676668d8fe7761d8daad48bb9295244dab1bbd26e71f5789b48df824010b83b6cf1057efa44dcebf987a7b7b9fb6d0618adb87f8a5f28aef25f173cfe902010400073b91d442653cb9cfa2df6429e98bbeff3124fe4074c4f92529480d95e83c3cf6e32a3ae16c9e1e1aa6a3a4a61f16d16f6a419db7532dba87d6121b9473c84e271a2bf05f0ee7610febb915d0c6eed95f804ad90d8cd97a6e39360fc0350170fc8ae65fcdf6ca2cb94303ba60e923719436a67f9f0b93bf1cec0034276b934ef5a874b47e40aa38dd545a692960a6a88f98e164c9b926f9c5aa7a44803491ae6cdc6874d3ad893e10f9aeb2c8ca350679e8ef7c9cebc68124b33206bdf8f53fd6b9760514951531d208c8b6e293836694f68547f3dd1a25e0f39ea5140681f05a"
            const nonce = "7ec9adaa"
            let block_blob = ""
            try {
                block_blob = this.core_bridge.construct_block_blob(template, Buffer.from(nonce, "hex").readUInt32LE(0))
                logger.log("info", "Initial block blob okay")
            } catch(error) {
                logger.log("error", "Initial block blob error")
                logger.log("error", error)
            }

        })
    }

    init(options) {
        if(this.daemon_type == "remote") {
            return false
        }

        this.protocol = "http://"
        this.hostname = options.daemon.rpc_bind_ip
        this.port = options.daemon.rpc_bind_port

        try {

            if(this.database.db == null) {
                this.database.start()
                logger.log("info", "Database initialized")
            }

            if(this.intervals.stats == null) {
                this.statsHeartbeat()
                this.intervals.stats = setInterval(() => {
                    this.statsHeartbeat()
                }, 10000)
            }

            const start = !this.active || JSON.stringify(this.config.server) != JSON.stringify(options.pool.server)

            let update_work = false
            if(!start && this.active) {
                if(this.config.mining.address != options.pool.mining.address || this.config.mining.uniform != options.pool.mining.uniform) {
                    update_work = true
                }
            }

            let update_vardiff = false
            if(!start && this.active) {
                if(JSON.stringify(this.config.varDiff) != JSON.stringify(options.pool.varDiff)) {
                    update_vardiff = true
                }
            }

            this.config = JSON.parse(JSON.stringify(options.pool))

            if(update_work) {
                this.getBlock(true).catch(() => {})
            }
            if(update_vardiff) {
                this.updateVarDiff()
            }

            if(this.config.server.enabled) {
                if(start && this.config.mining.address != "") {
                    this.start()
                }
            } else {
                this.stop()
            }

        } catch(error) {
            logger.log("error", "Failed to start pool")
            logger.log("error", error)
            this.sendGateway("show_notification", {type: "negative", message: "Pool failed to start", timeout: 2000})
        }
    }

    start() {
        if(this.daemon_type == "remote") {
            return false
        }
        this.stop().then(() => {

            logger.log("info", "Starting pool")

            this.sendStatus(1)
            this.server = null

            this.connections = {}
            this.blocks = {
                current: null,
                valid: []
            }

            if(this.intervals.startup) {
                clearInterval(this.intervals.startup)
            }

            let debounce = 0
            this.intervals.startup = setInterval(() => {
                const daemon_info = this.backend.daemon.daemon_info
                const target_height = Math.max(daemon_info.height_without_bootstrap, daemon_info.target_height)

                if(daemon_info.is_ready && daemon_info.height_without_bootstrap >= target_height) {
                    logger.log("info", "Attempting to connect to daemon")

                    this.getBlock().then(() => {
                        clearInterval(this.intervals.startup)
                        this.startHeartbeat()
                        this.startServer().then(() => {
                            this.sendStatus(2)
                        }).catch(error => {
                            this.sendStatus(-1)
                        })
                    }).catch(error => {
                        if(error == "Failed to parse wallet address") {
                            clearInterval(this.intervals.startup)
                            this.sendStatus(-1)
                        }
                    })

                } else {
                    if(debounce++ % 30 == 0) {
                        logger.log("info", "Wait for daemon { is_ready: %s, height: %d, target_height: %d }", [daemon_info.is_ready, daemon_info.height_without_bootstrap, target_height])
                    }
                }
            }, 2000)

        })
    }

    statsHeartbeat() {
        this.sendGateway("set_pool_data", this.database.heartbeat())
    }

    startHeartbeat() {
        if(this.intervals.job) {
            clearInterval(this.intervals.job)
        }
        if(this.intervals.timeout) {
            clearInterval(this.intervals.timeout)
        }
        this.intervals.job = setInterval(() => {
            this.getBlock().catch(() => {})
        }, this.config.mining.blockRefreshInterval * 1000)

        this.intervals.timeout = setInterval(() => {
            for(let connection_id in this.connections) {
                const miner = this.connections[connection_id]
                if(Date.now() - miner.lastHeartbeat > this.config.mining.minerTimeout * 1000) {
                    logger.log("warn", "Worker timed out %s@%s", [miner.workerName, miner.ip])
                    miner.socket.destroy()
                    delete this.connections[connection_id]
                }
            }
        }, 30000)

        this.startRetargetInterval()
    }

    startRetargetInterval() {
        if(this.intervals.retarget) {
            clearInterval(this.intervals.retarget)
        }
        this.intervals.retarget = setInterval(() => {
            for(let connection_id in this.connections) {
                const miner = this.connections[connection_id]
                if(miner.varDiff.enabled && miner.retarget()) {
                    logger.log("info", "Difficulty change { old: %d, new: %d } for %s@%s", [miner.difficulty.last, miner.difficulty.now, miner.workerName, miner.ip])
                }
            }
        }, this.config.varDiff.retargetTime * 1000)
    }

    startServer() {
        return new Promise((resolve, reject) => {
            this.server = createServer(socket => {
                let buffer = ""
                socket.setKeepAlive(true)
                socket.setEncoding("utf8")
                socket.on("data", data => {
                    buffer += data
                    if(Buffer.byteLength(buffer, "utf8") > 10 * 10240) {
                        buffer = null
                        logger.log("warn", "Socket flooding from %s", [socket.remoteAddress])
                        socket.destroy()
                        return
                    }
                    if(buffer.indexOf("\n") !== -1) {
                        let messages = buffer.split("\n")
                        if(buffer.endsWith("\n")) {
                            buffer = ""
                        } else {
                            buffer = messages.pop()
                        }
                        for(const message of messages) {
                            if(message.trim() == "") {
                                continue
                            }
                            let json = ""
                            try {
                                json = JSON.parse(message)
                                if(!json.id || !json.method || !json.params) {
                                    logger.log("warn", "Invalid stratum call from %s", [socket.remoteAddress])
                                    return
                                }
                            } catch(error) {
                                logger.log("warn", "Malformed stratum call from %s", [socket.remoteAddress])
                                socket.destroy()
                                break
                            }
                            try {
                                this.handleStratum(json, socket)
                            } catch(error) {
                                logger.log("error", "Error handling stratum call from %s", [socket.remoteAddress])
                                logger.log("error", JSON.stringify(message))
                                break
                            }
                        }
                    }
                }).on("error", error => {
                    if(error.code !== "ECONNRESET") {
                        logger.log("warn", "Socket error from %s - %j", [socket.remoteAddress, err])
                    }
                }).on("close", () => {
                    logger.log("warn", "Socket closed from %s@%s", [socket.workerName, socket.remoteAddress])
                })
            }).listen(this.config.server.bindPort, this.config.server.bindIP, (error, result) => {
                if(error) {
                    logger.log("error", "Could not start pool server on port %d", [this.config.server.bindPort, error])
                    return reject()
                }
                logger.log("info", "Started server on port %d", [this.config.server.bindPort])
                resolve()
            }).on("error", error => {
                if(error.code == "EADDRINUSE") {
                    logger.log("warn", "Cannot bind on %s:%s - address in use", [this.config.server.bindIP, this.config.server.bindPort])
                    reject()
                }
            })
        })
    }

    handleStratum(json, socket) {

        const reply = (error, result) => {
            if(!socket.writable) {
                return
            }
            const data = JSON.stringify({
                id: json.id,
                jsonrpc: "2.0",
                error: error ? {code: -1, message: error} : null,
                result: result
            })
            socket.write(data + "\n")
        }

        const { method, params } = json
        const miner = this.connections[params.id]

        if(method == "submit" || method == "keepalived") {
            if(!miner) {
                return reply("Unauthenticated")
            }
        }

        switch(method) {

            case "login":
                const connection_id = uid()
                const ip = socket.remoteAddress
                const { login, pass, rigid } = params

                let workerName = ""

                if(rigid) {
                    workerName = rigid.trim()
                } else if(pass) {
                    workerName = pass.trim()
                    if(workerName.toLowerCase() == "x") {
                        workerName = ""
                    }
                }
                if(workerName == "") {
                    workerName = "Unnamed_Worker"
                }
                workerName = workerName.normalize("NFD").replace(/\s+/g, "-").replace(/[^A-Za-z0-9\-\_]/gi, "")

                let { enabled, startDiff, minDiff, maxDiff, fixedDiffSeparator } = this.config.varDiff
                let difficulty = startDiff
                let fixed = false
                const login_parts = login.split(fixedDiffSeparator)

                if(typeof enabled == "undefined") {
                    enabled = true
                }
                if(login_parts.length > 1) {
                    const login_diff = login_parts.pop()
                    if(/^\d+$/.test(login_diff)) {
                        fixed = true
                        enabled = false
                        difficulty = Math.max(Math.min(parseInt(login_diff), maxDiff), minDiff)
                    }
                }

                const varDiff = {
                    ...this.config.varDiff,
                    difficulty,
                    enabled,
                    fixed
                }


                const newMiner = new Miner(this, connection_id, workerName, varDiff, ip, socket)

                this.connections[connection_id] = newMiner
                this.database.addWorker(workerName)

                socket.workerName = workerName

                logger.log("info", "Worker connected { difficulty: %d, fixed: %s } %s@%s", [difficulty, fixed, workerName, ip])

                reply(null, {
                    id: connection_id,
                    job: newMiner.getJob(),
                    status: "OK"
                })

                break

            case "submit":

                const job_id = params.job_id
                const hash = params.result
                let nonce = params.nonce
                let job = miner.findJob(job_id)

                if(!job) {
                    return reply("Invalid job id")
                }

                if(!nonce || !noncePattern.test(nonce) || !hash) {
                    return reply("Invalid work")
                }

                nonce = nonce.toLowerCase()

                if(!miner.checkJobSubmission(job, nonce)) {
                    return reply("Duplicate share")
                }

                miner.addJobSubmission(job, nonce)

                const block = this.findBlock(job.height)

                if(!block) {
                    return reply("Block not found")
                }

                this.processShare(job, block, nonce, hash).then(result => {
                    logger.log("info", "Accepted share { difficulty: %d, actual: %d } from %s@%s", [job.difficulty, result.diff, miner.workerName, miner.ip])
                    if(result.hash) {
                        logger.log("success", "Block found { hash: %s, height: %d } by %s@%s", [result.hash, job.height, miner.workerName, miner.ip])
                        this.database.recordShare(miner, job, true, result.hash, block)
                    } else {
                        this.database.recordShare(miner, job, false)
                    }
                    miner.heartbeat()
                    miner.recordShare()
                    reply(null, { status: "OK" })
                }).catch(error => {
                    logger.log("info", "Rejected share { difficulty: %d, actual: %d } from %s@%s", [job.difficulty, error.diff, miner.workerName, miner.ip])
                    logger.log("error", "%s { height: %d } from worker %s@%s", [error.message, job.height, miner.workerName, miner.ip])
                    reply("Invalid work")
                })
                break

            case "keepalived":
                miner.heartbeat()
                reply(null, { status:"KEEPALIVED" })
                break

            default:
                reply("Invalid method")
                break
        }
    }

    processShare(job, block, nonce, hash) {
        return new Promise((resolve, reject) => {
            const hash_array = [...Buffer.from(hash, "hex")].reverse()
            const hash_bigint = BigInt.fromArray(hash_array, 256, false)
            const hash_diff = diff1.divide(hash_bigint)
            if(hash_diff.geq(block.difficulty)) {
                logger.log("info", "Block candidate { height: %d, diff: %d, target: %d, nonce: %s }", [job.height, hash_diff, block.difficulty, nonce])
                let block_blob = ""
                try {
                    let template = Buffer.from(block.buffer)
                    block.writeExtraNonce(job.extra_nonce, template)

                    logger.log("warn", "contruct_block_blob input")
                    logger.log("warn", template.toString("hex"))

                    block_blob = this.core_bridge.construct_block_blob(template.toString("hex"), Buffer.from(nonce, "hex").readUInt32LE(0))
                } catch(error) {
                    return reject({ message: "Error constructing block blob", diff: hash_diff })
                }
                this.submitBlock(block_blob).then(data => {
                    if(data.hasOwnProperty("error")) {
                        return reject({ message: "Error submitting block", diff: hash_diff })
                    }
                    let block_fast_hash = "0000000000000000000000000000000000000000000000000000000000000000"
                    try {
                        block_fast_hash = this.core_bridge.get_block_id(block_blob)
                    } catch(error) {
                        logger.log("warn", "Get block id failed")
                    }
                    this.getBlock().catch(() => {})
                    return resolve({ hash: block_fast_hash, diff: hash_diff })
                })
            } else if(hash_diff.lt(job.difficulty)) {
                return reject({ message: "Rejected low difficulty share", diff: hash_diff })
            } else {
                return resolve({ hash: false, diff: hash_diff })
            }
        })
    }

    updateVarDiff() {
        for(let connection_id in this.connections) {
            const miner = this.connections[connection_id]
            if(!miner.varDiff.fixed) {
                miner.updateVarDiff({
                    ...miner.varDiff,
                    ...this.config.varDiff
                })
                miner.pushJob(true)
            }
        }
        this.startRetargetInterval()
    }

    findBlock(height) {
        return this.blocks.valid.filter(block => block.height == height).pop()
    }

    getBlock(force=false) {
        const wallet_address= this.config.mining.address
        const uniform = this.config.mining.uniform || Object.keys(this.connections).length > 128
        const reserve_size = uniform ? 8 : 1
        return new Promise((resolve, reject) => {
            this.sendRPC("get_block_template", { wallet_address, reserve_size }).then(data => {
                if(data.hasOwnProperty("error")) {
                    logger.log("error", "Error polling get_block_template %j", [data.error.message])
                    return reject(data.error.message)
                }
                const block = data.result
                if(this.blocks.current == null || this.blocks.current.height < block.height || force) {
                    const address_abbr = wallet_address.substring(0, 5) + "..." + wallet_address.substring(wallet_address.length - 5)
                    logger.log("info", "New block to mine { address: %s, height: %d, difficulty: %d, uniform: %s }", [address_abbr, block.height, block.difficulty, uniform])

                    this.blocks.current = new Block(this, block, uniform)

                    this.blocks.valid.push(this.blocks.current)

                    while(this.blocks.valid.length > 5) {
                        this.blocks.valid.shift()
                    }

                    for(let connection_id in this.connections) {
                        const miner = this.connections[connection_id]
                        miner.pushJob(force)
                    }
                }
                resolve()
            })
        })
    }

    submitBlock(block) {
        return this.sendRPC("submit_block", [block], false)
    }

    sendRPC(method, params={}, queue=true) {
        if(queue) {
            return this.backend.daemon.sendRPC(method, params)
        }
        let id = this.id++
        let options = {
            uri: `${this.protocol}${this.hostname}:${this.port}/json_rpc`,
            method: "POST",
            json: {
                jsonrpc: "2.0",
                id: id,
                method: method
            },
            agent: this.agent
        }
        if(Array.isArray(params) || Object.keys(params).length !== 0) {
            options.json.params = params
        }
        return request(options).then(response => {
            if(response.hasOwnProperty("error")) {
                return {
                    method: method,
                    params: params,
                    error: response.error
                }
            }
            return {
                method: method,
                params: params,
                result: response.result
            }
        }).catch(error => {
            return {
                method: method,
                params: params,
                error: {
                    code: -1,
                    message: "Cannot connect to daemon-rpc",
                    cause: error.cause
                }
            }
        })
    }

    sendStatus(status) {
        // -1: error, 0: disabled, 1: waiting, 2: enabled
        this.active = status == 2
        this.sendGateway("set_pool_data", { status })
    }
    sendGateway(method, data) {
        this.backend.send(method, data)
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.sendStatus(0)

            if(this.intervals.startup) {
                clearInterval(this.intervals.startup)
            }
            if(this.intervals.job) {
                clearInterval(this.intervals.job)
            }
            if(this.intervals.timeout) {
                clearInterval(this.intervals.timeout)
            }
            if(this.intervals.retarget) {
                clearInterval(this.intervals.retarget)
            }
            for(let connection_id in this.connections) {
                const miner = this.connections[connection_id]
                logger.log("warn", "Closing connection %s@%s", [miner.workerName, miner.ip])
                miner.socket.destroy()
                delete this.connections[connection_id]
            }
            if(this.server) {
                logger.log("warn", "Closing server")
                this.server.close(() => {
                    logger.log("warn", "Server closed")
                    resolve()
                })
            } else {
                resolve()
            }
        })
    }

    quit() {
        return new Promise((resolve, reject) => {
            this.stop().then(() => {
                if(this.intervals.stats) {
                    clearInterval(this.intervals.stats)
                }
                if(this.agent) {
                    this.agent.destroy()
                    this.agent = null
                }
                if(this.database) {
                    logger.log("warn", "Stopping database")
                    this.database.stop()
                    resolve()
                }
            })
        })
    }
}
