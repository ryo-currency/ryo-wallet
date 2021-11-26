import child_process from "child_process";
const request = require("request-promise");
const queue = require("promise-queue");
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

export class WalletRPC {
    constructor(backend) {
        this.backend = backend
        this.data_dir = null
        this.wallet_dir = null
        this.auth = []
        this.id = 0
        this.testnet = false
        this.heartbeat = null
        this.wallet_state = {
            open: false,
            name: "",
            password_hash: null,
            balance: null,
            unlocked_balance: null
        }
        this.wallet_info = {
            height: 0
        }

        this.wallet_list = []

        this.last_height_send_time = Date.now()

        this.height_regex_1 = /Pulled blocks (\d+)-(\d+) \/ (\d+)/
        this.height_regex_2 = /On new block (\d+) - (\w)/

        this.agent = new http.Agent({keepAlive: true, maxSockets: 1})
        this.queue = new queue(1, Infinity)

        this.log_file = null
    }

    // this function will take an options object for testnet, data-dir, etc
    start(options) {
        return new Promise((resolve, reject) => {

            let daemon_address = `${options.daemon.rpc_bind_ip}:${options.daemon.rpc_bind_port}`
            if(options.daemon.type == "remote") {
                daemon_address = `${options.daemon.remote_host}:${options.daemon.remote_port}`
            }

            crypto.randomBytes(64+64+32, (err, buffer) => {
                if(err) throw err

                let auth = buffer.toString("hex")

                this.auth = [
                    auth.substr(0,64),   // rpc username
                    auth.substr(64,64),  // rpc password
                    auth.substr(128,32), // password salt
                ]

                const args = [
                    "--rpc-login", this.auth[0]+":"+this.auth[1],
                    "--rpc-bind-port", options.wallet.rpc_bind_port,
                    "--daemon-address", daemon_address,
                    "--log-file-level", options.wallet.log_level,
                    "--log-level", "3",
                    // "--log-level", "*:WARNING,net*:FATAL,net.http:DEBUG,global:INFO,verify:FATAL,stacktrace:INFO",
                ]


                this.data_dir = options.app.data_dir

                if(options.app.testnet) {
                    this.testnet = true
                    this.wallet_dir = path.join(options.app.data_dir, "testnet", "wallets")
                    this.log_file = path.join(options.app.data_dir, "testnet", "logs", "wallet-rpc.log")
                    args.push("--testnet")
                    args.push("--log-file", this.log_file)
                    args.push("--wallet-dir", this.wallet_dir)
                } else {
                    this.wallet_dir = path.join(options.app.data_dir, "wallets")
                    this.log_file = path.join(options.app.data_dir, "logs", "wallet-rpc.log")
                    args.push("--log-file", this.log_file)
                    args.push("--wallet-dir", this.wallet_dir)
                }
                let log_file = this.log_file

                if (fs.existsSync(log_file))
                    fs.truncateSync(log_file, 0)

                if (process.platform === "win32") {
                    this.walletRPCProcess = child_process.spawn(path.join(__ryo_bin, "ryo-wallet-rpc.exe"), args)
                } else {
                    this.walletRPCProcess = child_process.spawn(path.join(__ryo_bin, "ryo-wallet-rpc"), args, {
                        detached: true
                    })
                }

                // save this info for later RPC calls
                this.protocol = "http://"
                this.hostname = "127.0.0.1"
                this.port = options.wallet.rpc_bind_port

                this.walletRPCProcess.stdout.on("data", (data) => {

                    // process.stdout.write(`Wallet: ${data}`)

                    let lines = data.toString().split("\n");
                    let match, height = null
                    lines.forEach((line) => {
                        match = line.match(this.height_regex_1)
                        if (match) {
                            height = match[2]
                            return
                        }
                        match = line.match(this.height_regex_2)
                        if (match) {
                            height = match[1]
                            return
                        }
                    })

                    if(height && height > this.wallet_info.height && Date.now() - this.last_height_send_time > 1000) {
                        this.last_height_send_time = Date.now()
                        this.sendGateway("set_wallet_data", {
                            info: {
                                height
                            }
                        })
                    }
                })
                this.walletRPCProcess.on("error", err => process.stderr.write(`Wallet: ${err}\n`))
                this.walletRPCProcess.on("close", code => process.stderr.write(`Wallet: exited with code ${code}\n`))

                // To let caller know when the wallet is ready
                let intrvl = setInterval(() => {
                    this.sendRPC("get_languages").then((data) => {
                        if(!data.hasOwnProperty("error")) {
                            clearInterval(intrvl)
                            resolve()
                        } else {
                            if(data.error.cause &&
                               data.error.cause.code === "ECONNREFUSED") {
                                // Ignore
                            } else {
                                clearInterval(intrvl)
                                reject(data.error)
                            }
                        }
                    })
                }, 1000)
            })
        })
    }

    handle(data) {

        let params = data.data

        switch (data.method) {

            case "list_wallets":
                this.listWallets()
                break

            case "create_wallet":
                this.createWallet(params.name, params.password, params.language, params.type)
                break

            case "restore_wallet":
                this.restoreWallet(params.name, params.password, params.seed,
                                   params.refresh_type, params.refresh_type=="date" ? params.refresh_start_date : params.refresh_start_height)
                break

            case "restore_view_wallet":
                this.restoreViewWallet(params.name, params.password, params.address, params.viewkey,
                                       params.refresh_type, params.refresh_type=="date" ? params.refresh_start_date : params.refresh_start_height)
                break

            case "import_wallet":
                this.importWallet(params.name, params.password, params.path)
                break

            case "open_wallet":
                this.openWallet(params.name, params.password)
                break

            case "close_wallet":
                this.closeWallet()
                break

            case "transfer":
                this.transfer(params.password, params.amount, params.address, params.payment_id, params.ringsize, params.priority, params.address_book)
                break

            case "add_address_book":
                this.addAddressBook(params.address, params.payment_id,
                                    params.description, params.name, params.starred,
                                    params.hasOwnProperty("index") ? params.index : false
                                   )
                break

            case "delete_address_book":
                this.deleteAddressBook(params.hasOwnProperty("index") ? params.index : false)
                break

            case "save_tx_notes":
                this.saveTxNotes(params.txid, params.note)
                break

            case "rescan_blockchain":
                this.rescanBlockchain()
                break
            case "rescan_spent":
                this.rescanSpent()
                break
            case "get_private_keys":
                this.getPrivateKeys(params.password)
                break
            case "export_key_images":
                this.exportKeyImages(params.password, params.path)
                break
            case "import_key_images":
                this.importKeyImages(params.password, params.path)
                break

            case "change_wallet_password":
                this.changeWalletPassword(params.old_password, params.new_password)
                break

            case "delete_wallet":
                this.deleteWallet(params.password)
                break

            default:
        }
    }


    createWallet(filename, password, language, type) {

        let short_address = type == "kurz"

        this.sendRPC("create_wallet", {
            filename,
            password,
            language,
            short_address
        }).then((data) => {
            if(data.hasOwnProperty("error")) {
                this.sendGateway("set_wallet_error", {status:data.error})
                return
            }

            // store hash of the password so we can check against it later when requesting private keys, or for sending txs
            this.wallet_state.password_hash = crypto.pbkdf2Sync(password, this.auth[2], 1000, 64, "sha512").toString("hex")
            this.wallet_state.name = filename
            this.wallet_state.open = true

            this.finalizeNewWallet(filename, true)

        })

    }


    restoreWallet(filename, password, seed, refresh_type, refresh_start_timestamp_or_height) {

        if(refresh_type == "date") {
            // Convert timestamp to 00:00 and move back a day
            // Core code also moved back some amount of blocks
            let timestamp = refresh_start_timestamp_or_height
            timestamp = timestamp - (timestamp % 86400000) - 86400000

            this.backend.daemon.timestampToHeight(timestamp).then((height) => {
                if(height === false)
                    this.sendGateway("set_wallet_error", {status:{code: -1, message: "Invalid restore date"}})
                else
                    this.restoreWallet(filename, password, seed, "height", height)
            })
            return
        }

        let refresh_start_height = refresh_start_timestamp_or_height

        if(!Number.isInteger(refresh_start_height)) {
            refresh_start_height = 0
        }
        seed = seed.trim().replace(/\s{2,}/g, " ")

        let seed_words = seed.split(" ")
        switch(seed_words.length) {
            case 14:
            case 24:
            case 25:
                break
            case 26:
                seed_words.pop()
                seed = seed_words.join(" ")
                break
            default:
                this.sendGateway("set_wallet_error", {status: {code: -1, message:"Invalid seed word length"}})
                return
        }

        this.sendRPC("restore_wallet", {
            filename,
            password,
            seed,
            refresh_start_height
        }).then((data) => {
            if(data.hasOwnProperty("error")) {
                this.sendGateway("set_wallet_error", {status:data.error})
                return
            }

            // restore wallet rpc does not automatically open the wallet after restoring
            // ^ above behavior is now fixed, no need to open wallet manually
            //this.sendRPC("open_wallet", {
            //filename,
            //password
            //}).then((data) => {
            //if(data.hasOwnProperty("error")) {
            //this.sendGateway("set_wallet_error", {status:data.error})
            //return
            //}

            // store hash of the password so we can check against it later when requesting private keys, or for sending txs
            this.wallet_state.password_hash = crypto.pbkdf2Sync(password, this.auth[2], 1000, 64, "sha512").toString("hex")
            this.wallet_state.name = filename
            this.wallet_state.open = true

            this.finalizeNewWallet(filename)

            //});

        });
    }

    restoreViewWallet(filename, password, address, viewkey, refresh_type, refresh_start_timestamp_or_height) {

        if(refresh_type == "date") {
            // Convert timestamp to 00:00 and move back a day
            // Core code also moved back some amount of blocks
            let timestamp = refresh_start_timestamp_or_height
            timestamp = timestamp - (timestamp % 86400000) - 86400000

            this.backend.daemon.timestampToHeight(timestamp).then((height) => {
                if(height === false)
                    this.sendGateway("set_wallet_error", {status:{code: -1, message: "Invalid restore date"}})
                else
                    this.restoreViewWallet(filename, password, address, viewkey, "height", height)
            })
            return
        }

        let refresh_start_height = refresh_start_timestamp_or_height

        if(!Number.isInteger(refresh_start_height)) {
            refresh_start_height = 0
        }

        this.sendRPC("restore_view_wallet", {
            filename,
            password,
            address,
            viewkey,
            refresh_start_height
        }).then((data) => {
            if(data.hasOwnProperty("error")) {
                this.sendGateway("set_wallet_error", {status:data.error})
                return
            }

            // store hash of the password so we can check against it later when requesting private keys, or for sending txs
            this.wallet_state.password_hash = crypto.pbkdf2Sync(password, this.auth[2], 1000, 64, "sha512").toString("hex")
            this.wallet_state.name = filename
            this.wallet_state.open = true

            this.finalizeNewWallet(filename)

        });
    }

    importWallet(filename, password, import_path) {

        // trim off suffix if exists
        if(import_path.endsWith(".keys")) {
            import_path = import_path.substring(0, import_path.length - ".keys".length)
        } else if(import_path.endsWith(".address.txt")) {
            import_path = import_path.substring(0, import_path.length - ".address.txt".length)
        }

        if (!fs.existsSync(import_path)) {
            this.sendGateway("set_wallet_error", {status:{code: -1, message: "Invalid wallet path"}})
            return
        } else {

            let destination = path.join(this.wallet_dir, filename)

            if (fs.existsSync(destination) || fs.existsSync(destination+".keys")) {
                this.sendGateway("set_wallet_error", {status:{code: -1, message: "Wallet with name already exists"}})
                return
            }

            fs.copyFileSync(import_path, destination, fs.constants.COPYFILE_EXCL)

            if(fs.existsSync(import_path+".keys")) {
                fs.copyFileSync(import_path+".keys", destination+".keys", fs.constants.COPYFILE_EXCL)
            }

            this.sendRPC("open_wallet", {
                filename,
                password
            }).then((data) => {
                if(data.hasOwnProperty("error")) {

                    fs.unlinkSync(destination)
                    fs.unlinkSync(destination+".keys")

                    this.sendGateway("set_wallet_error", {status:data.error})
                    return
                }

                // store hash of the password so we can check against it later when requesting private keys, or for sending txs
                this.wallet_state.password_hash = crypto.pbkdf2Sync(password, this.auth[2], 1000, 64, "sha512").toString("hex")
                this.wallet_state.name = filename
                this.wallet_state.open = true

                this.finalizeNewWallet(filename)

            })

        }

    }

    finalizeNewWallet(filename, newly_created=false) {

        Promise.all([
            this.sendRPC("get_address"),
            this.sendRPC("getheight"),
            this.sendRPC("getbalance", {account_index: 0}),
            this.sendRPC("query_key",  {key_type: "mnemonic"}),
            this.sendRPC("query_key",  {key_type: "spend_key"}),
            this.sendRPC("query_key",  {key_type: "view_key"})
        ]).then((data) => {
            let wallet = {
                info: {
                    name: filename,
                    address: "",
                    balance: 0,
                    unlocked_balance: 0,
                    height: 0,
                    view_only: false,
                    newly_created
                },
                secret: {
                    mnemonic: "",
                    spend_key: "",
                    view_key: ""
                }
            }
            for (let n of data) {
                if(n.hasOwnProperty("error") || !n.hasOwnProperty("result")) {
                    continue
                }
                if(n.method == "get_address") {
                    wallet.info.address = n.result.address
                } else if(n.method == "getheight") {
                    wallet.info.height = n.result.height
                } else if (n.method == "getbalance") {
                    wallet.info.balance = n.result.balance
                    wallet.info.unlocked_balance = n.result.unlocked_balance
                } else if (n.method == "query_key") {
                    wallet.secret[n.params.key_type] = n.result.key
                    if(n.params.key_type == "spend_key") {
                        if(/^0*$/.test(n.result.key)) {
                            wallet.info.view_only = true
                        }
                    }
                }
            }

            this.saveWallet().then(() => {
                let address_txt_path = path.join(this.wallet_dir, filename+".address.txt")
                if (!fs.existsSync(address_txt_path)) {
                    fs.writeFile(address_txt_path, wallet.info.address, "utf8", () => {
                        this.listWallets()
                    })
                } else {
                    this.listWallets()
                }
            })

            this.sendGateway("set_wallet_data", wallet)

            this.startHeartbeat()

        })

    }

    openWallet(filename, password) {

        this.sendRPC("open_wallet", {
            filename,
            password
        }).then((data) => {
            if(data.hasOwnProperty("error")) {
                this.sendGateway("set_wallet_error", {status:data.error})
                return
            }

            let address_txt_path = path.join(this.wallet_dir, filename+".address.txt")
            if (!fs.existsSync(address_txt_path)) {
                this.sendRPC("get_address", {account_index: 0}).then((data) => {
                    if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                        return
                    }
                    fs.writeFile(address_txt_path, data.result.address, "utf8", () => {
                        this.listWallets()
                    })
                })
            }

            // store hash of the password so we can check against it later when requesting private keys, or for sending txs
            this.wallet_state.password_hash = crypto.pbkdf2Sync(password, this.auth[2], 1000, 64, "sha512").toString("hex")
            this.wallet_state.name = filename
            this.wallet_state.open = true

            this.startHeartbeat()

            // Check if we have a view only wallet by querying the spend key
            this.sendRPC("query_key",  {key_type: "spend_key"}).then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    return
                }
                if(/^0*$/.test(data.result.key)) {
                    this.sendGateway("set_wallet_data", {
                        info: {
                            view_only: true
                        }
                    })
                }
            })

        })
    }

    startHeartbeat() {
        clearInterval(this.heartbeat)
        this.heartbeat = setInterval(() => {
            this.heartbeatAction()
        }, 5000)
        this.heartbeatAction(true)
    }

    heartbeatAction(extended=false) {
        Promise.all([
            this.sendRPC("getheight", {}, 5000),
            this.sendRPC("getbalance", {account_index: 0}, 5000)
        ]).then((data) => {
            let wallet = {
                status: {
                    code: 0,
                    message: "OK"
                },
                info:{
                    name: this.wallet_state.name
                },
                transactions: {
                    tx_list: [],
                },
                address_list: {
                    primary: [],
                    used: [],
                    unused: [],
                    address_book: [],
                    address_book_starred: [],
                }

            }
            for (let n of data) {

                if(n.hasOwnProperty("error") || !n.hasOwnProperty("result")) {
                    continue
                }

                if(n.method == "getheight") {
                    wallet.info.height = n.result.height
                    this.sendGateway("set_wallet_data", {
                        info: {
                            height: n.result.height
                        }
                    })
                    this.wallet_info = {
                        height: n.result.height
                    }

                } else if(n.method == "getbalance") {
                    if(this.wallet_state.balance == n.result.balance &&
                       this.wallet_state.unlocked_balance == n.result.unlocked_balance) {
                        //continue
                    }

                    this.wallet_state.balance = wallet.info.balance = n.result.balance
                    this.wallet_state.unlocked_balance = wallet.info.unlocked_balance = n.result.unlocked_balance
                    this.sendGateway("set_wallet_data", {
                        info: wallet.info
                    })

                    // if balance has recently changed, get updated list of transactions and used addresses
                    let actions = [
                        this.getTransactions(),
                        this.getAddressList()
                    ]
                    if(true || extended) {
                        actions.push(this.getAddressBook())
                    }
                    Promise.all(actions).then((data) => {
                        for (let n of data) {
                            Object.keys(n).map(key => {
                                wallet[key] = Object.assign(wallet[key], n[key])
                            })
                        }
                        this.sendGateway("set_wallet_data", wallet)
                    })
                }
            }
        })

    }

    transfer (password, amount, address, payment_id, ringsize, priority, address_book={}) {

        crypto.pbkdf2(password, this.auth[2], 1000, 64, "sha512", (err, password_hash) => {
            if (err) {
                this.sendGateway("set_tx_status", {
                    code: -1,
                    message: "Internal error",
                    sending: false
                })
                return
            }
            if(this.wallet_state.password_hash !== password_hash.toString("hex")) {
                this.sendGateway("set_tx_status", {
                    code: -1,
                    message: "Invalid password",
                    sending: false
                })
                return
            }

            amount = parseFloat(amount).toFixed(9)*1e9

            let sweep_all = amount == this.wallet_state.unlocked_balance

            if(sweep_all) {

                let params = {
                    "address": address,
                    "account_index": 0,
                    "priority": priority,
                    "mixin": ringsize-1
                }

                if(payment_id) {
                    params.payment_id = payment_id
                }

                this.sendRPC("sweep_all", params).then((data) => {
                    if(data.hasOwnProperty("error")) {
                        let error = data.error.message.charAt(0).toUpperCase() + data.error.message.slice(1);
                        this.sendGateway("set_tx_status", {
                            code: -1,
                            message: error,
                            sending: false
                        })
                        return
                    }

                    this.sendGateway("set_tx_status", {
                        code: 0,
                        message: "Transaction successfully sent",
                        sending: false
                    })

                })

            } else {

                let params = {
                    "destinations": [{"amount" : amount, "address": address}],
                    "priority": priority,
                    "mixin": ringsize-1
                }

                if(payment_id) {
                    params.payment_id = payment_id
                }

                this.sendRPC("transfer_split", params).then((data) => {
                    if(data.hasOwnProperty("error")) {
                        let error = data.error.message.charAt(0).toUpperCase() + data.error.message.slice(1);
                        this.sendGateway("set_tx_status", {
                            code: -1,
                            message: error,
                            sending: false
                        })
                        return
                    }

                    this.sendGateway("set_tx_status", {
                        code: 0,
                        message: "Transaction successfully sent",
                        sending: false
                    })

                })

            }

            if(address_book.hasOwnProperty("save") && address_book.save)
                this.addAddressBook(address, payment_id, address_book.description, address_book.name)

        })

    }

    rescanBlockchain () {
        this.sendRPC("rescan_blockchain")
    }

    rescanSpent () {
        this.sendRPC("rescan_spent")
    }

    getPrivateKeys (password) {

        crypto.pbkdf2(password, this.auth[2], 1000, 64, "sha512", (err, password_hash) => {
            if (err) {
                this.sendGateway("set_wallet_data", {
                    secret: {
                        mnemonic: "Internal error",
                        spend_key: -1,
                        view_key: -1
                    }
                })
                return
                return
            }
            if(this.wallet_state.password_hash !== password_hash.toString("hex")) {
                this.sendGateway("set_wallet_data", {
                    secret: {
                        mnemonic: "Invalid password",
                        spend_key: -1,
                        view_key: -1
                    }
                })
                return
            }
            Promise.all([
                this.sendRPC("query_key",  {key_type: "mnemonic"}),
                this.sendRPC("query_key",  {key_type: "spend_key"}),
                this.sendRPC("query_key",  {key_type: "view_key"})
            ]).then((data) => {
                let wallet = {
                    secret: {
                        mnemonic: "",
                        spend_key: "",
                        view_key: ""
                    }
                }
                for (let n of data) {
                    if(n.hasOwnProperty("error") || !n.hasOwnProperty("result")) {
                        continue
                    }
                    wallet.secret[n.params.key_type] = n.result.key
                }

                this.sendGateway("set_wallet_data", wallet)

            })

        })

    }


    getAddressList() {
        return new Promise((resolve, reject) => {

            Promise.all([
                this.sendRPC("get_address", {account_index: 0}),
                this.sendRPC("getbalance", {account_index: 0})
            ]).then((data) => {

                for (let n of data) {
                    if(n.hasOwnProperty("error") || !n.hasOwnProperty("result")) {
                        resolve({})
                        return
                    }
                }

                let num_unused_addresses = 10

                let wallet = {
                    info: {
                        address: data[0].result.address,
                        balance: data[1].result.balance,
                        unlocked_balance: data[1].result.unlocked_balance,
                        //num_unspent_outputs: data[1].result.num_unspent_outputs
                    },
                    address_list: {
                        primary: [],
                        used: [],
                        unused: []
                    }
                }

                for(let address of data[0].result.addresses) {

                    address.balance = null
                    address.unlocked_balance = null
                    address.num_unspent_outputs = null

                    if(data[1].result.hasOwnProperty("per_subaddress")) {
                        for(let address_balance of data[1].result.per_subaddress) {
                            if(address_balance.address_index == address.address_index) {
                                address.balance = address_balance.balance
                                address.unlocked_balance = address_balance.unlocked_balance
                                address.num_unspent_outputs = address_balance.num_unspent_outputs
                                break
                            }
                        }
                    }

                    if(address.address_index == 0) {
                        wallet.address_list.primary.push(address)
                    } else if(address.used) {
                        wallet.address_list.used.push(address)
                    } else {
                        wallet.address_list.unused.push(address)
                    }
                }

                // limit to 10 unused addresses
                wallet.address_list.unused = wallet.address_list.unused.slice(0,10)

                if(wallet.address_list.unused.length < num_unused_addresses &&
                   !wallet.address_list.primary[0].address.startsWith("RYoK") &&
                   !wallet.address_list.primary[0].address.startsWith("RYoH")) {
                    for(let n = wallet.address_list.unused.length; n < num_unused_addresses; n++) {
                        this.sendRPC("create_address", {account_index: 0}).then((data) => {
                            wallet.address_list.unused.push(data.result)
                            if(wallet.address_list.unused.length == num_unused_addresses) {
                                // should sort them here
                                resolve(wallet)
                            }
                        })
                    }
                } else {
                    resolve(wallet)
                }

            })

        })

    }


    getTransactions() {
        return new Promise((resolve, reject) => {
            this.sendRPC("get_transfers", {in:true,out:true,pending:true,failed:true,pool:true}).then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    resolve({})
                    return
                }
                let wallet = {
                    transactions: {
                        tx_list: [],
                    }
                }

                if(data.result.hasOwnProperty("in"))
                    wallet.transactions.tx_list = wallet.transactions.tx_list.concat(data.result.in)
                if(data.result.hasOwnProperty("out"))
                    wallet.transactions.tx_list = wallet.transactions.tx_list.concat(data.result.out)
                if(data.result.hasOwnProperty("pending"))
                    wallet.transactions.tx_list = wallet.transactions.tx_list.concat(data.result.pending)
                if(data.result.hasOwnProperty("failed"))
                    wallet.transactions.tx_list = wallet.transactions.tx_list.concat(data.result.failed)
                if(data.result.hasOwnProperty("pool"))
                    wallet.transactions.tx_list = wallet.transactions.tx_list.concat(data.result.pool)

                for(let i = 0; i < wallet.transactions.tx_list.length; i++) {
                    if(/^0*$/.test(wallet.transactions.tx_list[i].payment_id)) {
                        wallet.transactions.tx_list[i].payment_id = ""
                    } else if(/^0*$/.test(wallet.transactions.tx_list[i].payment_id.substring(16))) {
                        wallet.transactions.tx_list[i].payment_id = wallet.transactions.tx_list[i].payment_id.substring(0, 16)
                    }
                }

                wallet.transactions.tx_list.sort(function(a, b){
                    if(a.timestamp < b.timestamp) return 1
                    if(a.timestamp > b.timestamp) return -1
                    return 0
                })

                //console.log(wallet.transactions)

                resolve(wallet)
            })
        })
    }


    getAddressBook() {
        return new Promise((resolve, reject) => {
            this.sendRPC("get_address_book").then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    resolve({})
                    return
                }
                let wallet = {
                    address_list: {
                        address_book: [],
                        address_book_starred: []
                    }
                }

                if(data.result.entries) {
                    let i
                    for(i = 0; i < data.result.entries.length; i++) {
                        let entry = data.result.entries[i]
                        let desc = entry.description.split("::")
                        if(desc.length == 3) {
                            entry.starred = desc[0] == "starred" ? true : false
                            entry.name = desc[1]
                            entry.description = desc[2]
                        } else if(desc.length == 2) {
                            entry.starred = false
                            entry.name = desc[0]
                            entry.description = desc[1]
                        } else {
                            entry.starred = false
                            entry.name = entry.description
                            entry.description = ""
                        }

                        if(/^0*$/.test(entry.payment_id)) {
                            entry.payment_id = ""
                        } else if(/^0*$/.test(entry.payment_id.substring(16))) {
                            entry.payment_id = entry.payment_id.substring(0, 16)
                        }

                        if(entry.starred)
                            wallet.address_list.address_book_starred.push(entry)
                        else
                            wallet.address_list.address_book.push(entry)
                    }
                }

                resolve(wallet)

            })
        })
    }

    deleteAddressBook(index=false) {
        if(index!==false) {
            this.sendRPC("delete_address_book", {index:index}).then(() => {
                this.saveWallet().then(() => {
                    this.getAddressBook().then((data) => {
                        this.sendGateway("set_wallet_data", data)
                    })
                })
            })
        }
    }


    addAddressBook(address, payment_id=null, description="", name="", starred=false, index=false) {

        if(index!==false) {
            this.sendRPC("delete_address_book", {index:index}).then((data) => {
                this.addAddressBook(address, payment_id, description, name, starred)
            })
            return
        }

        let params = {
            address
        }
        if(payment_id != null)
            params.payment_id = payment_id

        let desc = [
        ]
        if(starred) {
            desc.push("starred")
        }
        desc.push(name, description)

        params.description = desc.join("::")

        this.sendRPC("add_address_book", params).then((data) => {
            this.saveWallet().then(() => {
                this.getAddressBook().then((data) => {
                    this.sendGateway("set_wallet_data", data)
                })
            })
        })
    }

    saveTxNotes(txid, note) {
        this.sendRPC("set_tx_notes", {txids:[txid], notes:[note]}).then((data) => {
            this.getTransactions().then((wallet) => {
                this.sendGateway("set_wallet_data", wallet)
            })
        })
    }


    exportKeyImages(password, filename=null) {
        crypto.pbkdf2(password, this.auth[2], 1000, 64, "sha512", (err, password_hash) => {
            if (err) {
                this.sendGateway("show_notification", {type: "negative", message: "Internal error", timeout: 2000})
                return
            }
            if(this.wallet_state.password_hash !== password_hash.toString("hex")) {
                this.sendGateway("show_notification", {type: "negative", message: "Invalid password", timeout: 2000})
                return
            }

            if(filename == null)
                filename = path.join(this.data_dir, "gui", "key_image_export")
            else
                filename = path.join(filename, "key_image_export")

            this.sendRPC("export_key_images", {filename}).then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    this.sendGateway("show_notification", {type: "negative", message: "Error exporting key images", timeout: 2000})
                    return
                }

                this.sendGateway("show_notification", {message: "Key images exported to "+filename, timeout: 2000})

            })
        })

    }

    importKeyImages(password, filename=null) {
        crypto.pbkdf2(password, this.auth[2], 1000, 64, "sha512", (err, password_hash) => {
            if (err) {
                this.sendGateway("show_notification", {type: "negative", message: "Internal error", timeout: 2000})
                return
            }
            if(this.wallet_state.password_hash !== password_hash.toString("hex")) {
                this.sendGateway("show_notification", {type: "negative", message: "Invalid password", timeout: 2000})
                return
            }

            if(filename == null)
                filename = path.join(this.data_dir, "gui", "key_image_export")

            this.sendRPC("import_key_images", {filename}).then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    this.sendGateway("show_notification", {type: "negative", message: "Error importing key images", timeout: 2000})
                    return
                }

                this.sendGateway("show_notification", {message: "Key images imported", timeout: 2000})
            })
        })

    }


    listWallets(legacy=false) {

        let wallets = {
            list: [],
        }

        fs.readdirSync(this.wallet_dir).forEach(filename => {
            if(filename.endsWith(".keys") ||
               filename.endsWith(".meta.json") ||
               filename.endsWith(".address.txt") ||
               filename.endsWith(".bkp-old") ||
               filename.endsWith(".unportable"))
                return

            switch(filename) {
                case ".DS_Store":
                case ".DS_Store?":
                case "._.DS_Store":
                case ".Spotlight-V100":
                case ".Trashes":
                case "ehthumbs.db":
                case "Thumbs.db":
                    return
            }

            let wallet_data = {
                name: filename,
                address: null,
                password_protected: null
            }

            if (fs.existsSync(path.join(this.wallet_dir, filename+".meta.json"))) {

                let meta = fs.readFileSync(path.join(this.wallet_dir, filename+".meta.json"), "utf8")
                if(meta) {
                    meta = JSON.parse(meta)
                    wallet_data.address = meta.address
                    wallet_data.password_protected = meta.password_protected
                }

            } else if (fs.existsSync(path.join(this.wallet_dir, filename+".address.txt"))) {
                let address = fs.readFileSync(path.join(this.wallet_dir, filename+".address.txt"), "utf8")
                if(address) {
                    wallet_data.address = address
                }
            }

            wallets.list.push(wallet_data)

        })

        // Check for legacy wallet files
        if(legacy) {
            wallets.legacy = []
            let legacy_paths = []
            if(os.platform() == "win32") {
	        legacy_paths = ["C:\\ProgramData\\RyoGUIWallet", "C:\\ProgramData\\RyoLITEWallet"]
            } else {
	        legacy_paths = [path.join(os.homedir(), "RyoGUIWallet"), path.join(os.homedir(), "RyoLITEWallet")]
            }
            for(var i = 0; i < legacy_paths.length; i++) {
                let legacy_config_path = path.join(legacy_paths[i], "config", "wallet_info.json")
                if(this.testnet)
                    legacy_config_path = path.join(legacy_paths[i], "testnet", "config", "wallet_info.json")
                if(!fs.existsSync(legacy_config_path))
                    continue
                let legacy_config = JSON.parse(fs.readFileSync(legacy_config_path, "utf8"))
                let legacy_wallet_path = legacy_config.wallet_filepath
                if(!fs.existsSync(legacy_wallet_path))
                    continue
                let legacy_address = ""
                if(fs.existsSync(legacy_wallet_path+".address.txt")) {
                    legacy_address = fs.readFileSync(legacy_wallet_path+".address.txt", "utf8")
                }
                wallets.legacy.push({path: legacy_wallet_path, address: legacy_address})

            }
        }

        this.wallet_list = wallets.list

        this.sendGateway("wallet_list", wallets)

    }

    changeWalletPassword(old_password, new_password) {
        crypto.pbkdf2(old_password, this.auth[2], 1000, 64, "sha512", (err, password_hash) => {
            if (err) {
                this.sendGateway("show_notification", {type: "negative", message: "Internal error", timeout: 2000})
                return
            }
            if(this.wallet_state.password_hash !== password_hash.toString("hex")) {
                this.sendGateway("show_notification", {type: "negative", message: "Invalid old password", timeout: 2000})
                return
            }

            this.sendRPC("change_wallet_password", {old_password, new_password}).then((data) => {
                if(data.hasOwnProperty("error") || !data.hasOwnProperty("result")) {
                    this.sendGateway("show_notification", {type: "negative", message: "Error changing password", timeout: 2000})
                    return
                }

                // store hash of the password so we can check against it later when requesting private keys, or for sending txs
                this.wallet_state.password_hash = crypto.pbkdf2Sync(new_password, this.auth[2], 1000, 64, "sha512").toString("hex")

                this.sendGateway("show_notification", {message: "Password updated", timeout: 2000})

            })

        })
    }

    deleteWallet(password) {
        crypto.pbkdf2(password, this.auth[2], 1000, 64, "sha512", (err, password_hash) => {
            if (err) {
                this.sendGateway("show_notification", {type: "negative", message: "Internal error", timeout: 2000})
                return
            }
            if(this.wallet_state.password_hash !== password_hash.toString("hex")) {
                this.sendGateway("show_notification", {type: "negative", message: "Invalid password", timeout: 2000})
                return
            }

            let wallet_path = path.join(this.wallet_dir, this.wallet_state.name)
            this.closeWallet().then(() => {
                fs.unlinkSync(wallet_path)
                fs.unlinkSync(wallet_path+".keys")
                fs.unlinkSync(wallet_path+".address.txt")
                this.listWallets()
                this.sendGateway("return_to_wallet_select")
            })
        })
    }

    saveWallet() {
        return new Promise((resolve, reject) => {
            this.sendRPC("store").then(() => {
                resolve()
            })
        })
    }

    closeWallet() {
        return new Promise((resolve, reject) => {
            clearInterval(this.heartbeat)
            this.wallet_state = {
                open: false,
                name: "",
                password_hash: null,
                balance: null,
                unlocked_balance: null
            }
            this.wallet_info = {
                height: 0
            }

            this.saveWallet().then(() => {
                this.sendRPC("close_wallet").then(() => {
                    resolve()
                })
            })
        })
    }

    sendGateway(method, data) {
        // if wallet is closed, do not send any wallet data to gateway
        // this is for the case that we close the wallet at the same
        // after another action has started, but before it has finished
        if(!this.wallet_state.open && method == "set_wallet_data")
            return
        this.backend.send(method, data)
    }

    sendRPC(method, params={}, timeout=0) {
        let id = this.id++
        let options = {
            uri: `${this.protocol}${this.hostname}:${this.port}/json_rpc`,
            method: "POST",
            json: {
                jsonrpc: "2.0",
                id: id,
                method: method
            },
            auth: {
                user: this.auth[0],
                pass: this.auth[1],
                sendImmediately: false
            },
            agent: this.agent
        };
        if(Object.keys(params).length !== 0) {
            options.json.params = params
        }
        if(timeout) {
            options.timeout = timeout
        }

        return this.queue.add(() => {
            return request(options)
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
                            message: "Cannot connect to wallet-rpc",
                            cause: error.cause
                        }
                    }
                })
        })
    }

    getRPC(parameter, params={}) {
        return this.sendRPC(`get_${parameter}`, params)
    }

    quit() {
        this.queue.queue = []
        return new Promise((resolve, reject) => {
            if (this.walletRPCProcess) {
                this.closeWallet().then(() => {
                    // normally we would exit wallet after this promise
                    // however if the wallet is not responsive to RPC
                    // requests then we must forcefully close it below
                })
                setTimeout(() => {
                    this.walletRPCProcess.on("close", code => {
                        this.agent.destroy()
                        resolve()
                    })
                    this.walletRPCProcess.kill('SIGKILL')
                }, 10000)
            } else {
                resolve()
            }
        })
    }
}
