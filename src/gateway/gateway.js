import { ipcRenderer } from "electron"
import { Notify, Dialog, Loading, LocalStorage } from "quasar"

export class Gateway {

    constructor(app, router) {

        this.app = app
        this.router = router

        let theme = LocalStorage.has("theme") ? LocalStorage.get.item("theme") : "light"
        this.app.store.commit("gateway/set_app_data", {
            config: {
                appearance: {
                    theme
                }
            }
        });
        this.app.store.watch( state => state.gateway.app.config.appearance.theme, (theme) => {
            LocalStorage.set("theme", theme)
        })

        let numBlocks = null
        this.app.store.watch( state => state.gateway.pool.blocks, (blocks) => {
            if(numBlocks != null && blocks.length != numBlocks) {
                const block = blocks[0]
                const effort = Math.round(100 * block.hashes / block.diff)
                Notify.create({
                    type: "positive",
                    timeout: 2000,
                    message: `Block found at height ${block.height} with ${effort}% effort`
                })
            }
            numBlocks = blocks.length
        })

        this.closeDialog = false
        this.minimizeDialog = false

        this.app.store.commit("gateway/set_app_data", {
            status: {
                code: 1 // Connecting to backend
            }
        });

        ipcRenderer.on("event", (event, data) => {
            console.log(event)
            this.receive(data)
        })

        ipcRenderer.on("confirmClose", () => {
            this.confirmClose("Are you sure you want to exit?")
        });

        ipcRenderer.on("confirmMinimizeTray", () => {
            this.confirmMinimizeTray()
        });

    }

    confirmClose(msg) {
        if(this.closeDialog) {
            return
        }
        this.closeDialog = true
        Dialog.create({
            title: "Exit",
            message: msg,
            ok: {
                label: "EXIT"
            },
            cancel: {
                flat: true,
                label: "CANCEL",
                color: this.app.store.state.gateway.app.config.appearance.theme=="dark"?"white":"dark"
            }
        }).then(() => {
            this.closeDialog = false
            Loading.hide()
            this.router.replace({ path: "/quit" })
            ipcRenderer.send("confirmClose")
        }).catch(() => {
            this.closeDialog = false
        })

    }

    confirmMinimizeTray() {
        if(this.minimizeDialog) {
            return
        }
        this.minimizeDialog = true
        Dialog.create({
            title: "Minimize to tray?",
            message: "You can change your preference in the setting menu at any time",
            ok: {
                label: "YES"
            },
            cancel: {
                flat: true,
                label: "NO",
                color: this.app.store.state.gateway.app.config.appearance.theme=="dark"?"white":"dark"
            }
        }).then(() => {
            this.minimizeDialog = false
            Loading.hide()
            ipcRenderer.send("confirmMinimizeTray", true)
        }).catch(() => {
            this.minimizeDialog = false
            ipcRenderer.send("confirmMinimizeTray", false)
        })

    }

    send(module, method, data={}) {
        let message = {
            module,
            method,
            data
        }
        ipcRenderer.send("event", message)
    }

    receive(message) {

        if (typeof message !== "object" ||
            !message.hasOwnProperty("event") ||
            !message.hasOwnProperty("data"))
            return

        switch (message.event) {

            case "initialize":
                this.app.store.commit("gateway/set_app_data", {
                    status: {
                        code: 2 // Loading config
                    }
                })
                break

            case "set_app_data":
                this.app.store.commit("gateway/set_app_data", message.data)
                break

            case "set_daemon_data":
                this.app.store.commit("gateway/set_daemon_data", message.data)
                break

            case "set_pool_data":
                this.app.store.commit("gateway/set_pool_data", decrypted_data.data)
                break

            case "set_wallet_data":
            case "set_wallet_error":
                this.app.store.commit("gateway/set_wallet_data", message.data)
                break

            case "set_tx_status":
                this.app.store.commit("gateway/set_tx_status", message.data)
                break

            case "wallet_list":
                this.app.store.commit("gateway/set_wallet_list", message.data)
                break

            case "settings_changed_reboot":
                this.confirmClose("Changes require restart. Would you like to exit now?")
                break

            case "show_notification":
                let notification = {
                    type: "positive",
                    timeout: 1000,
                    message: ""
                }
                Notify.create(Object.assign(notification, message.data))
                break

            case "return_to_wallet_select":
                this.router.replace({ path: "/wallet-select" })
                setTimeout(() => {
                    // short delay to prevent wallet data reaching the
                    // websocket moments after we close and reset data
                    this.app.store.dispatch("gateway/resetWalletData")
                }, 250);
                break

        }
    }
}
