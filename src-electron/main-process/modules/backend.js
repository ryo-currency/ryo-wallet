import { Daemon } from "./daemon";
import { WalletRPC } from "./wallet-rpc";
import { SCEE } from "./SCEE-Node";

const WebSocket = require("ws");
const os = require("os");
const fs = require("fs");
const path = require("path");

export class Backend {
    constructor() {
        this.daemon = null
        this.walletd = null
        this.wss = null
        this.token = null
        this.config_dir = null
        this.config_file = null
        this.config_data = {}
        this.scee = new SCEE()
    }

    init(config) {

        if(os.platform() == "win32") {
	    this.config_dir = "C:\\ProgramData\\ryo";
	    //this.config_dir = path.join(os.homedir(), "ryo");
        } else {
            this.config_dir = path.join(os.homedir(), ".ryo");
        }
        if (!fs.existsSync(this.config_dir)) {
            fs.mkdirSync(this.config_dir);
        }

	if (!fs.existsSync(path.join(this.config_dir, "gui"))) {
            fs.mkdirSync(path.join(this.config_dir, "gui"));
        }

        this.config_file = path.join(this.config_dir, "gui", "config.json");

        this.config_data = {

            app: {
                data_dir: this.config_dir,
                ws_bind_port: 12213,
                testnet: false
            },

            appearance: {
                theme: "light"
            },

            daemon: {
                type: "local_remote",
                remote_host: "geo.ryoblocks.com",
                remote_port: 12211,
                p2p_bind_ip: "0.0.0.0",
                p2p_bind_port: 12210,
                rpc_bind_ip: "127.0.0.1",
                rpc_bind_port: 12211,
                zmq_rpc_bind_ip: "127.0.0.1",
                zmq_rpc_bind_port: 12212,
                out_peers: -1,
                in_peers: -1,
                limit_rate_up: -1,
                limit_rate_down: -1,
                log_level: 0
            },

            wallet: {
                rpc_bind_port: 12214,
                log_level: 0
            }
        }

        this.token = config.token

        this.wss = new WebSocket.Server({
            port: config.port,
            maxPayload: Number.POSITIVE_INFINITY
        })

        this.wss.on("connection", ws => {
            ws.on("message", data => this.receive(data));
        });

    }

    send(event, data={}) {
        let message = {
            event,
            data
        }

        let encrypted_data = this.scee.encryptString(JSON.stringify(message), this.token);

        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(encrypted_data)
            }
        });
    }

    receive(data) {

        let decrypted_data = JSON.parse(this.scee.decryptString(data, this.token));

        // route incoming request to either the daemon, wallet, or here
        switch (decrypted_data.module) {
            case "core":
                this.handle(decrypted_data);
                break;
            case "daemon":
                if (this.daemon) {
                    this.daemon.handle(decrypted_data);
                }
                break;
            case "wallet":
                if (this.walletd) {
                    this.walletd.handle(decrypted_data);
                }
                break;
        }
    }

    handle(data) {

        let params = data.data

        switch (data.method) {
            case "quick_save_config":
                // save only partial config settings
                Object.keys(params).map(key => {
                    this.config_data[key] = Object.assign(this.config_data[key], params[key])
                })
                fs.writeFile(this.config_file, JSON.stringify(this.config_data, null, 4), 'utf8', () => {
                    this.send("set_app_data", {
                        config: params,
                        pending_config: params
                    })
                })
                break

            case "save_config":
                // check if config has changed
                let config_changed = false
                Object.keys(this.config_data).map(i => {
                    if(i == "appearance") return
                    Object.keys(this.config_data[i]).map(j => {
                        if(this.config_data[i][j] !== params[i][j])
                            config_changed = true
                    })
                })
            case "save_config_init":
                Object.keys(params).map(key => {
                    this.config_data[key] = Object.assign(this.config_data[key], params[key])
                });
                fs.writeFile(this.config_file, JSON.stringify(this.config_data, null, 4), 'utf8', () => {

                    if(data.method == "save_config_init") {
                        this.startup();
                    } else {
                        this.send("set_app_data", {
                            config: this.config_data,
                            pending_config: this.config_data,
                        })
                        if(config_changed) {
                            this.send("settings_changed_reboot")
                        }
                    }
                });
                break;
            case "init":
                this.startup();
                break;

            case "open_explorer":
                if(params.type == "tx") {
                    require("electron").shell.openExternal("https://explorer.ryo-currency.com/tx/"+params.id)
                }
                break;

            case "open_url":
                require("electron").shell.openExternal(params.url)
                break;

            default:
        }
    }

    startup() {
        fs.readFile(this.config_file, "utf8", (err,data) => {
            if (err) {
                this.send("set_app_data", {
                    status: {
                        code: -1 // Config not found
                    },
                    config: this.config_data,
                    pending_config: this.config_data,
                });
                return;
            }

            let disk_config_data = JSON.parse(data);

            // semi-shallow object merge
            Object.keys(disk_config_data).map(key => {
                this.config_data[key] = Object.assign(this.config_data[key], disk_config_data[key])
            });

            // here we may want to check if config data is valid, if not also send code -1
            // i.e. check ports are integers and > 1024, check that data dir path exists, etc

            // save config file back to file, so updated options are stored on disk
            fs.writeFile(this.config_file, JSON.stringify(this.config_data, null, 4), 'utf8');

            this.send("set_app_data", {
                config: this.config_data,
                pending_config: this.config_data,
            });

            if(this.config_data.app.testnet) {

                let testnet_dir = path.join(this.config_data.app.data_dir, "testnet")
                if (!fs.existsSync(testnet_dir))
                    fs.mkdirSync(testnet_dir);

                let log_dir = path.join(this.config_data.app.data_dir, "testnet", "logs")
                if (!fs.existsSync(log_dir))
                    fs.mkdirSync(log_dir);

            } else {

                let log_dir = path.join(this.config_data.app.data_dir, "logs")
                if (!fs.existsSync(log_dir))
                    fs.mkdirSync(log_dir);

            }

            this.daemon = new Daemon(this);
            this.walletd = new WalletRPC(this);

            this.send("set_app_data", {
                status: {
                    code: 3 // Starting daemon
                }
            });

            this.daemon.checkVersion().then((version) => {

                if(version) {
                    this.send("set_app_data", {
                        status: {
                            code: 4,
                            message: version
                        }
                    });
                } else {
                    // daemon not found, probably removed by AV, set to remote node
                    this.config_data.daemon.type = "remote"
                    this.send("set_app_data", {
                        status: {
                            code: 5
                        },
                        config: this.config_data,
                        pending_config: this.config_data,
                    });

                }

                this.daemon.start(this.config_data).then(() => {

                    this.send("set_app_data", {
                        status: {
                            code: 6 // Starting wallet
                        }
                    });

                    this.walletd.start(this.config_data).then(() => {

                        this.send("set_app_data", {
                            status: {
                                code: 7 // Reading wallet list
                            }
                        });

                        this.walletd.listWallets(true)

                        this.send("set_app_data", {
                            status: {
                                code: 0 // Ready
                            }
                        });
                    }).catch(error => {
                        // send an unrecoverable error to frontend
                        // wallet-rpc cannot start or be reached
                    });

                }).catch(error => {
                    // send an unrecoverable error to frontend
                    // daemon cannot start or be reached
                });

            }).catch(error => {
                // send an unrecoverable error to frontend
                // daemon cannot start or be reached
            });

        });
    }

    quit() {
        return new Promise((resolve, reject) => {
            let process = []
            if(this.daemon)
                process.push(this.daemon.quit())
            if(this.walletd)
                process.push(this.walletd.quit())
            if(this.wss)
                this.wss.close();

            Promise.all(process).then(() => {
                resolve()
            })
        })
    }
}
