import child_process from "child_process";
import request from "request-promise";
const fs = require('fs');
const path = require("path");

export class Daemon {
    constructor(backend) {
        this.backend = backend
        this.heartbeat = null
        this.heartbeat_slow = null
        this.id = 0
        this.testnet = false
        this.local = false // do we have a local daemon ?
    }


    checkVersion() {
        return new Promise((resolve, reject) => {
            if (process.platform === "win32") {
                let ryod_path = path.join(__ryo_bin, "ryod.exe")
                let ryod_version_cmd = `"${ryod_path}" --version`
                if (!fs.existsSync(ryod_path))
                    resolve(false)
                child_process.exec(ryod_version_cmd, (error, stdout, stderr) => {
                    if(error)
                        resolve(false)
                    resolve(stdout)
                })
            } else {
                let ryod_path = path.join(__ryo_bin, "ryod")
                let ryod_version_cmd = `"${ryod_path}" --version`
                if (!fs.existsSync(ryod_path))
                    resolve(false)
                child_process.exec(ryod_version_cmd, {detached: true}, (error, stdout, stderr) => {
                    if(error)
                        resolve(false)
                    resolve(stdout)
                })
            }
        })
    }

    start(options) {

        if(options.daemon.type === "remote") {

            this.local = false

            // save this info for later RPC calls
            this.protocol = "http://"
            this.hostname = options.daemon.remote_host
            this.port = options.daemon.remote_port

            return new Promise((resolve, reject) => {
                this.sendRPC("get_info").then((data) => {
                    if(!data.hasOwnProperty("error")) {
                        this.startHeartbeat()
                        resolve()
                    } else {
                        reject()
                    }
                })
            })
        }
        return new Promise((resolve, reject) => {

            this.local = true

            const args = [
                "--data-dir", options.app.data_dir,
                "--p2p-bind-ip", options.daemon.p2p_bind_ip,
                "--p2p-bind-port", options.daemon.p2p_bind_port,
                "--rpc-bind-ip", options.daemon.rpc_bind_ip,
                "--rpc-bind-port", options.daemon.rpc_bind_port,
                "--zmq-rpc-bind-ip", options.daemon.zmq_rpc_bind_ip,
                "--zmq-rpc-bind-port", options.daemon.zmq_rpc_bind_port,
                "--out-peers", options.daemon.out_peers,
                "--in-peers", options.daemon.in_peers,
                "--limit-rate-up", options.daemon.limit_rate_up,
                "--limit-rate-down", options.daemon.limit_rate_down,
                "--log-level", options.daemon.log_level,
            ];

            if(options.app.testnet) {
                this.testnet = true
                args.push("--testnet")
                args.push("--log-file", path.join(options.app.data_dir, "testnet", "logs", "ryod.log"))
            } else {
                args.push("--log-file", path.join(options.app.data_dir, "logs", "ryod.log"))
            }

            if(options.daemon.rpc_bind_ip !== "127.0.0.1")
                args.push("--confirm-external-bind")

            if(options.daemon.type === "local_remote" && !options.app.testnet) {
                args.push(
                    "--bootstrap-daemon-address",
                    `${options.daemon.remote_host}:${options.daemon.remote_port}`
                )
            }

            if (process.platform === "win32") {
                this.daemonProcess = child_process.spawn(path.join(__ryo_bin, "ryod.exe"), args)
            } else {
                this.daemonProcess = child_process.spawn(path.join(__ryo_bin, "ryod"), args, {
                    detached: true
                })
            }

            // save this info for later RPC calls
            this.protocol = "http://"
            this.hostname = options.daemon.rpc_bind_ip
            this.port = options.daemon.rpc_bind_port

            this.daemonProcess.stdout.on("data", data => process.stdout.write(`Daemon: ${data}`))
            this.daemonProcess.on("error", err => process.stderr.write(`Daemon: ${err}`))
            this.daemonProcess.on("close", code => process.stderr.write(`Daemon: exited with code ${code}`))

            // To let caller know when the daemon is ready
            let intrvl = setInterval(() => {
                this.sendRPC("get_info").then((data) => {
                    if(!data.hasOwnProperty("error")) {
                        this.startHeartbeat()
                        clearInterval(intrvl);
                        resolve();
                    } else {
                        if(data.error.cause &&
                           data.error.cause.code === "ECONNREFUSED") {
                            // Ignore
                        } else {
                            clearInterval(intrvl);
                            reject(error);
                        }
                    }
                })
            }, 1000)
        })
    }

    handle(data) {

        let params = data.data

        switch (data.method) {

            case "ban_peer":
                this.banPeer(params.host, params.seconds)
                break

            default:

        }

    }

    banPeer(host, seconds=3600) {

        let params = {
            bans: [{
                host,
                seconds,
                ban: true
            }]
        }

        this.sendRPC("set_bans", params).then((data) => {
            if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                this.sendGateway("show_notification", {type: "negative", message: "Error banning peer", timeout: 2000})
                return
            }

            let end_time = new Date(Date.now() + seconds * 1000).toLocaleString()
            this.sendGateway("show_notification", {message: "Banned "+host+" until "+end_time, timeout: 2000})

            this.sendRPC("bans").then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    return
                }
                let daemon_info = {
                    bans: data.result.bans
                }
                this.sendGateway("set_daemon_data", daemon_info)
            })

        })

    }

    timestampToHeight(timestamp, pivot=null, recursion_limit=null) {

        return new Promise((resolve, reject) => {

            if(timestamp > 999999999999) {
                // We have got a JS ms timestamp, convert
                timestamp = Math.floor(timestamp / 1000)
            }

            pivot = pivot || [137500, 1528073506]
            recursion_limit = recursion_limit || 0;

            let diff = Math.floor((timestamp - pivot[1]) / 240)
            let estimated_height = pivot[0] + diff

            if(estimated_height <= 0) {
                return resolve(0)
            }

            if(recursion_limit > 10) {
                return resolve(pivot[0])
            }

            this.getRPC("block_header_by_height", {height: estimated_height}).then((data) => {

                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    if(data.error.code == -2) { // Too big height

                        this.getRPC("last_block_header").then((data) => {
                            if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                                return reject()
                            }

                            let new_pivot = [data.result.block_header.height, data.result.block_header.timestamp]

                            // If we are within an hour that is good enough
                            // If for some reason there is a > 1h gap between blocks
                            // the recursion limit will take care of infinite loop
                            if(Math.abs(timestamp - new_pivot[1]) < 3600) {
                                return resolve(new_pivot[0])
                            }

                            // Continue recursion with new pivot
                            resolve(new_pivot)
                        })
                        return
                    } else {
                        return reject()
                    }
                }

                let new_pivot = [data.result.block_header.height, data.result.block_header.timestamp]

                // If we are within an hour that is good enough
                // If for some reason there is a > 1h gap between blocks
                // the recursion limit will take care of infinite loop
                if(Math.abs(timestamp - new_pivot[1]) < 3600) {
                    return resolve(new_pivot[0])
                }

                // Continue recursion with new pivot
                resolve(new_pivot)

            })
        }).then((pivot_or_height) => {

            return Array.isArray(pivot_or_height)
                ? this.timestampToHeight(timestamp, pivot_or_height, recursion_limit + 1)
                : pivot_or_height

        }).catch(error => {
            return false
        })
    }

    startHeartbeat() {
        clearInterval(this.heartbeat)
        this.heartbeat = setInterval(() => {
            this.heartbeatAction()
        }, this.local ? 5 * 1000 : 30 * 1000) // 5 seconds for local daemon, 30 seconds for remote
        this.heartbeatAction()

        clearInterval(this.heartbeat_slow)
        this.heartbeat_slow = setInterval(() => {
            this.heartbeatSlowAction()
        }, 30 * 1000) // 30 seconds
        this.heartbeatSlowAction()

    }

    heartbeatAction() {
        let actions = []

        // No difference between local and remote heartbeat action for now
        if(this.local) {
            actions = [
                this.getRPC("info")
            ]
        } else {
            actions = [
                this.getRPC("info")
            ]
        }

        Promise.all(actions).then((data) => {
            let daemon_info = {
            }
            for (let n of data) {
                if(n == undefined || !n.hasOwnProperty("result") || n.result == undefined)
                    continue
                if(n.method == "get_info") {
                    daemon_info.info = n.result
                }
            }
            this.sendGateway("set_daemon_data", daemon_info)
        })
    }

    heartbeatSlowAction() {
        let actions = []
        if(this.local) {
            actions = [
                this.getRPC("connections"),
                this.getRPC("bans"),
                //this.getRPC("txpool_backlog"),
            ]
        } else {
            actions = [
                //this.getRPC("txpool_backlog"),
            ]
        }

        if(actions.length === 0) return

        Promise.all(actions).then((data) => {
            let daemon_info = {
            }
            for (let n of data) {
                if(n == undefined || !n.hasOwnProperty("result") || n.result == undefined)
                    continue
                if (n.method == "get_connections" && n.result.hasOwnProperty("connections")) {
                    daemon_info.connections = n.result.connections
                } else if (n.method == "get_bans" && n.result.hasOwnProperty("bans")) {
                    daemon_info.bans = n.result.bans
                } else if (n.method == "get_txpool_backlog" && n.result.hasOwnProperty("backlog")) {
                    daemon_info.tx_pool_backlog = n.result.backlog
                }
            }
            this.sendGateway("set_daemon_data", daemon_info)
        })
    }

    sendGateway(method, data) {
        this.backend.send(method, data)
    }

    sendRPC(method, params={}) {
        let id = this.id++
        let options = {
            forever: true,
            json: {
                jsonrpc: "2.0",
                id: id,
                method: method
            },
        };
        if (Object.keys(params).length !== 0) {
            options.json.params = params;
        }

        return request.post(`${this.protocol}${this.hostname}:${this.port}/json_rpc`, options)
            .then((response) => {
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

    /**
     * Call one of the get_* RPC calls
     */
    getRPC(parameter, args) {
        return this.sendRPC(`get_${parameter}`, args);
    }

    quit() {
        clearInterval(this.heartbeat);
        return new Promise((resolve, reject) => {
            if (this.daemonProcess) {
                this.daemonProcess.on("close", code => {
                    resolve()
                })
                this.daemonProcess.kill()
            } else {
                resolve()
            }
        })
    }
}
