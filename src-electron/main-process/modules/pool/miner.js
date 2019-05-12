import { diff1, uid, logger } from "./utils"

export class Miner {
    constructor(pool, id, workerName, varDiff, ip, socket) {
        this.pool = pool
        this.id = id
        this.workerName = workerName
        this.ip = ip
        this.socket = socket

        this.varDiff = varDiff
        this.difficulty = {
            now: varDiff.difficulty,
            pending: null,
            last: null
        }

        this.lastHeight = null

        this.jobs = []
        this.shareTimes = []

        this.lastShare = Date.now() / 1000
        this.heartbeat()
    }

    push(method, params) {
        if(!this.socket.writable) {
            return
        }
        this.socket.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n")
    }

    heartbeat() {
        this.lastHeartbeat = Date.now()
    }

    retarget() {
        const { targetTime, maxDiff, minDiff, variancePercent, maxJump} = this.varDiff
        const variance = targetTime * variancePercent / 100
        const targetMin = targetTime - variance
        const targetMax = targetTime + variance

        const dateNow = Date.now() / 1000
        const shareDelta = dateNow - this.lastShare
        const shareExtra = shareDelta >= targetMax ? shareDelta : 0
        const shareAvg = this.calcShareAvg(shareExtra)

        logger.log("info", "Share time stats { target: %ds, average: %ds, since_last: %ds, buffer: %d } for %s@%s", [targetTime, Math.round(shareAvg || 0), Math.round(shareDelta), this.shareTimes.length, this.workerName, this.ip])

        if(targetMin <= shareAvg && shareAvg <= targetMax) {
            return false
        }
        if(shareAvg < targetMin && this.shareTimes.length < 6) {
            return false
        }
        if(shareAvg > targetMax && shareDelta < 2 * targetTime) {
            return false
        }

        if(shareDelta < targetMax) {
            if(shareAvg == 0 || this.shareTimes.length == 0) {
                return false
            }
        } else {
            this.lastShare = dateNow
        }

        this.shareTimes = []

        const newDiffMin = this.difficulty.now * (1 - maxJump / 100)
        const newDiffMax = this.difficulty.now * (1 + maxJump / 100)

        let newDiff
        newDiff = this.difficulty.now * targetTime / shareAvg
        newDiff = Math.min(newDiff, newDiffMax, maxDiff)
        newDiff = Math.max(newDiff, newDiffMin, minDiff)
        newDiff = Math.round(newDiff)

        if(!isNaN(newDiff) && this.difficulty.now != newDiff) {
            this.difficulty.pending = newDiff
            this.pushJob()
            return true
        }
        return false
    }

    updateVarDiff(varDiff) {
        this.varDiff = varDiff
        this.lastShare = Date.now() / 1000
        this.shareTimes = []
        this.difficulty = {
            now: varDiff.startDiff,
            pending: null,
            last: null
        }
    }

    recordShare() {
        const dateNow = Date.now() / 1000
        this.shareTimes.push(dateNow - this.lastShare)
        while(this.shareTimes.length > 16) {
            this.shareTimes.shift()
        }
        this.lastShare = dateNow
    }

    calcShareAvg(extra=0) {
        return this.shareTimes.reduce((sum, x) => sum + x, extra) / (this.shareTimes.length + (extra ? 1 : 0))
    }

    addJobSubmission(job, nonce) {
        job.submissions.push(nonce)
    }

    checkJobSubmission(job, nonce) {
        return job.submissions.indexOf(nonce) == -1
    }

    pushJob(force=false) {
        this.push("job", this.getJob(force))
    }

    addJob(job) {
        this.jobs.push(job)
    }

    findJob(job_id) {
        return this.jobs.filter(job => job.id == job_id).pop()
    }

    getJob(force=false) {
        const block = this.pool.blocks.current
        let job_id = "", blob = "", target = ""
        if(block.height != this.lastHeight || this.difficulty.pending || force) {
            this.lastHeight = block.height
            if(this.difficulty.pending) {
                this.difficulty = {
                    now: this.difficulty.pending,
                    pending: null,
                    last: this.difficulty.now
                }
            }

            let difficulty = Math.min(this.difficulty.now, block.difficulty-1)

            job_id = uid()
            blob = block.newBlob()
            target = this.targetToCompact(difficulty)

            this.addJob({
                id: job_id,
                extra_nonce: block.extra_nonce,
                height: block.height,
                difficulty: difficulty,
                submissions: []
            })
            while(this.jobs.length > 4) {
                this.jobs.shift()
            }
        }
        return { blob, job_id, target }
    }

    targetToCompact(diff) {
        let padded = Buffer.alloc(32)
        padded.fill(0)

        const diffArray = diff1.divide(diff).toArray(256).value
        let diffBuff = Buffer.from(diffArray)

        diffBuff.copy(padded, 32 - diffBuff.length)

        const buff = padded.slice(0, 4)
        let buffReversed = Buffer.allocUnsafe(buff.length)

        for(let i = 0, j = buff.length - 1; i <= j; ++i, --j) {
            buffReversed[i] = buff[j]
            buffReversed[j] = buff[i]
        }

        return buffReversed.toString("hex")
    }
}
