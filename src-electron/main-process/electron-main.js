import { app, ipcMain, BrowserWindow, Menu, Tray, dialog } from "electron"
import { Backend } from "./modules/backend"
import menuTemplate from "./menu"
import isDev from "electron-is-dev"
const windowStateKeeper = require("electron-window-state")
const path = require("path");

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
    global.__statics = path.join(__dirname, "statics").replace(/\\/g, "\\\\")
    global.__ryo_bin = path.join(__dirname, "..", "bin").replace(/\\/g, "\\\\")
} else {
    global.__ryo_bin = path.join(process.cwd(), "bin").replace(/\\/g, "\\\\")
}

let mainWindow, backend, tray
let showConfirmClose = true
let forceQuit = false
let updateTrayInterval = null

function createWindow() {
    /**
     * Initial window options
     */

    let mainWindowState = windowStateKeeper({
        defaultWidth: 800,
        defaultHeight: 650
    })

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 640,
        minHeight: 480,
        icon: path.join(__statics, "icon_64x64.png")
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

    ipcMain.on("confirmClose", (e, restart) => {
        showConfirmClose = false

        if(restart && !isDev) {
            app.relaunch()
        }

        if (backend) {
            if (process.platform !== "darwin") {
                clearInterval(updateTrayInterval)
                tray.setToolTip("Closing...")
            }
            backend.quit().then(() => {
                backend = null
                app.quit()
            })
        } else {
            app.quit()
        }
    })

    mainWindow.on("minimize", (e) => {
        if (!backend || !backend.config_data) {
            e.defaultPrevented = false
            return
        }
        let minimize_to_tray = backend.config_data.preference.minimize_to_tray
        if (minimize_to_tray === null) {
            mainWindow.webContents.send("confirmMinimizeTray")
            e.preventDefault()
        } else if (minimize_to_tray === true) {
            e.preventDefault()
            mainWindow.hide()
        } else {
            e.defaultPrevented = false
        }
    })

    ipcMain.on("autostartSettings", (e, openAtLogin) => {
        app.setLoginItemSettings({
            openAtLogin
        })
    })

    ipcMain.on("confirmMinimizeTray", (e, minimize_to_tray) => {
        mainWindow.setMinimizable(true)
        backend.config_data.preference.minimize_to_tray = minimize_to_tray
        if (minimize_to_tray) {
            mainWindow.hide()
        } else {
            mainWindow.minimize()
        }
    })

    mainWindow.webContents.on("did-finish-load", () => {
        backend = new Backend(mainWindow)
        backend.init()
    })

    mainWindow.loadURL(process.env.APP_URL)
    mainWindowState.manage(mainWindow)
}

app.on("ready", () => {
    if (process.platform === "darwin") {
        const menu = Menu.buildFromTemplate(menuTemplate)
        Menu.setApplicationMenu(menu)
    } else {
        tray = new Tray(path.join(__statics, "icon_32x32.png"))
        const contextMenu = Menu.buildFromTemplate([
            {
                label: "Show Ryo Wallet",
                click: function() {
                    if(mainWindow.isMinimized())
                        mainWindow.minimize()
                    else
                        mainWindow.show()
                    mainWindow.focus()
                }
            },
            {
                label: "Exit Ryo Wallet",
                click: function() {
                    if(mainWindow.isMinimized())
                        mainWindow.minimize()
                    else
                        mainWindow.show()
                    mainWindow.focus()
                    mainWindow.close()
                }
            }
        ])

        tray.setContextMenu(contextMenu)

        updateTrayInterval = setInterval(() => {
            if (backend)
                tray.setToolTip(backend.getTooltipLabel())
        }, 1000)

        tray.on("click", () => {
            if(mainWindow.isMinimized())
                mainWindow.minimize()
            else
                mainWindow.show()
            mainWindow.focus()
        })
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
            if (process.platform !== "darwin") {
                clearInterval(updateTrayInterval)
                tray.setToolTip("Closing...")
            }
            backend.quit().then(() => {
                mainWindow.close()
            })
        }
    }
})

app.on("quit", () => {

})
