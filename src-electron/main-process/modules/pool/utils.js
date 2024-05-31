import BigInt from "big-integer"
import dateFormat from "dateformat"
import createWriteStream from "rotating-file-stream"
// import { createWriteStream } from "fs"
import { randomBytes } from "crypto"
import { format } from "util"

export const noncePattern = new RegExp("^[0-9A-Fa-f]{8}$")

export const diff1 = BigInt("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16)

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
export function uid(length=15) {
    const bytes = randomBytes(length)
    let r = []
    for(let i = 0; i < bytes.length; i++) {
        r.push(alphabet[bytes[i] % alphabet.length])
    }
    return r.join("")
}

class Logger {

    constructor() {
        this.stream = null
    }

    setLogFile(path, file) {
        // this.stream = createWriteStream(join(path, file), { flags: "a" })
        this.stream = createWriteStream(file, {
            path,
            size: "5M",
            interval: "1d",
            maxFiles: 10,
            compress: "gzip"
        })
    }

    log(level, message, params=[]) {
        const timestamp = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l")
        message = format(message, ...params)
        message = `${timestamp} [POOL] ${message}`

        if(this.stream) {
            this.stream.write(message+"\n")
        }

        const color_reset = "\x1b[0m"
        let color = color_reset
        switch(level) {
            case "error":
                color = "\x1b[31m"
                break
            case "success":
                color = "\x1b[32m"
                break
            case "warn":
                color = "\x1b[33m"
                break
            case "info":
                color = "\x1b[34m"
                break
        }

        console.log(color+message+color_reset)
    }

}

export let logger = new Logger()
