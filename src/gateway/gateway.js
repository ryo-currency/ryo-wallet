import { ipcRenderer } from "electron"
import { Dialog, Loading } from "quasar"
import { SCEE } from "./SCEE-Node";
import * as WebSocket from "ws"

export class Gateway {

    constructor(app, router) {

        this.app = app
        this.router = router
        this.token = null
        this.scee = new SCEE()

        this.closeDialog = false

        this.app.store.commit("gateway/set_app_data", {
            status: {
                code: 1 // Connecting to backend
            }
        });

        ipcRenderer.on("initialize", (event, data) => {
            this.token = data.token
            this.ws = new WebSocket("ws://127.0.0.1:"+data.port);
            this.ws.on("open", () => {this.open()});
            this.ws.on("message", (message) => {this.receive(message)});
        });

        ipcRenderer.on("confirmClose", () => {
            this.confirmClose("Are you sure you want to exit?")
        });

    }

    open() {
        this.app.store.commit("gateway/set_app_data", {
            status: {
                code: 2 // Loading config
            }
        });
        this.send("core", "init");
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
                label: "CANCEL"
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


    send(module, method, data={}) {
        let message = {
            module,
            method,
            data
        }
        let encrypted_data = this.scee.encryptString(JSON.stringify(message), this.token);
        this.ws.send(encrypted_data);

    }

    receive(message) {

        // should wrap this in a try catch, and if fail redirect to error screen
        // shouldn't happen outside of dev environment
        let decrypted_data = JSON.parse(this.scee.decryptString(message, this.token));

        if (typeof decrypted_data !== "object" ||
            !decrypted_data.hasOwnProperty("event") ||
            !decrypted_data.hasOwnProperty("data"))
            return

        switch (decrypted_data.event) {

            case "set_app_data":
                this.app.store.commit("gateway/set_app_data", decrypted_data.data)
                break

            case "set_daemon_data":
                this.app.store.commit("gateway/set_daemon_data", decrypted_data.data)
                break

            case "set_wallet_data":
            case "set_wallet_error":
                this.app.store.commit("gateway/set_wallet_data", decrypted_data.data)
                break

            case "set_tx_status":
                this.app.store.commit("gateway/set_tx_status", decrypted_data.data)
                break

            case "wallet_list":
                this.app.store.commit("gateway/set_wallet_list", decrypted_data.data)
                break

            case "settings_changed_reboot":
                this.confirmClose("Changes require restart. Would you like to exit now?")
                break

        }
    }
}
