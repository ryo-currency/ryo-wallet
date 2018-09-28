import { app, ipcMain, BrowserWindow, Menu, dialog } from "electron"
import { Backend } from "./modules/backend"
import menuTemplate from "./menu"
const portscanner = require("portscanner")

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
    global.__statics = require("path").join(__dirname, "statics").replace(/\\/g, "\\\\")
    global.__ryo_bin = require("path").join(__dirname, "..", "bin").replace(/\\/g, "\\\\")
} else {
    global.__ryo_bin = require("path").join(process.cwd(), "bin").replace(/\\/g, "\\\\")
}

let mainWindow, backend
let showConfirmClose = true
let forceQuit = false

const portInUse = function(port, callback) {
    var server = net.createServer(function(socket) {
        socket.write("Echo server\r\n");
        socket.pipe(socket);
    });

    server.listen(port, "127.0.0.1");
    server.on("error", function (e) {
        callback(true);
    });
    server.on("listening", function (e) {
        server.close();
        callback(false);
    });
};

function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        icon: require("path").join(__statics, "icon_512x512.png"),
        useContentSize: true
    })

    mainWindow.on("close", (e) => {
        if (process.platform === "darwin") {
            if (forceQuit) {
                forceQuit = false
                if (showConfirmClose) {
                    e.preventDefault()
                    mainWindow.show()
                    mainWindow.webContents.send("confirmClose")
                } else {
                    e.defaultPrevented = false
                }
            } else {
                e.preventDefault()
                mainWindow.hide()
            }
        } else {
            if (showConfirmClose) {
                e.preventDefault()
                mainWindow.webContents.send("confirmClose")
            } else {
                e.defaultPrevented = false
            }
        }
    })

    ipcMain.on("confirmClose", (e) => {
        showConfirmClose = false
        if (backend) {
            backend.quit().then(() => {
                backend = null
                app.quit()
            })
        } else {
            app.quit()
        }
    })

    mainWindow.webContents.on("did-finish-load", () => {

        require("crypto").randomBytes(64, (err, buffer) => {

            // if err, then we may have to use insecure token generation perhaps
            if (err) throw err;

            let config = {
                port: 12213,
                token: buffer.toString("hex")
            }

            portscanner.checkPortStatus(config.port, "127.0.0.1", (error, status) => {
                if (status == "closed") {
                    mainWindow.webContents.send("initialize", config)
                    backend = new Backend()
                    backend.init(config)
                } else {
                    dialog.showMessageBox(mainWindow, {
                        title: "Startup error",
                        message: `Ryo Wallet is already open, or port ${config.port} is in use`,
                        type: "error",
                        buttons: ["ok"]
                    }, () => {
                        showConfirmClose = false
                        app.quit()
                    })

                }

            })

        })

    })

    mainWindow.loadURL(process.env.APP_URL)

}

app.on("ready", () => {
    if (process.platform === "darwin") {
        const menu = Menu.buildFromTemplate(menuTemplate)
        Menu.setApplicationMenu(menu)
    }
    createWindow()
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow()
    } else if (process.platform === "darwin") {
        mainWindow.show()
    }
})

app.on("before-quit", () => {
    if (process.platform === "darwin") {
        forceQuit = true
    } else {
        if (backend) {
            backend.quit().then(() => {
                mainWindow.close()
            })
        }
    }
})

app.on("quit", () => {

})
