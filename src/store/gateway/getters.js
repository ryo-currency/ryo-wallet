export const isReady = (state) => {
    let target_height
    if(state.app.config.daemon.type === "local" && !state.daemon.info.is_ready) {
        target_height = Math.max(state.daemon.info.height, state.daemon.info.target_height)
    } else {
        target_height = state.daemon.info.height
    }

    if(state.app.config.daemon.type === "local") {
        return state.daemon.info.is_ready && state.wallet.info.height >= target_height - 1
    } else {
        return state.wallet.info.height >= target_height - 1
    }
    return false
}

export const isAbleToSend = (state) => {
    let target_height
    if(state.app.config.daemon.type === "local" && !state.daemon.info.is_ready) {
        target_height = Math.max(state.daemon.info.height, state.daemon.info.target_height)
    } else {
        target_height = state.daemon.info.height
    }

    if(state.app.config.daemon.type === "local") {
        return state.daemon.info.is_ready && state.wallet.info.height >= target_height - 1
    } else if(state.app.config.daemon.type === "local_remote") {
        return state.daemon.info.height_without_bootstrap >= target_height && state.wallet.info.height >= target_height - 1
    } else {
        return state.wallet.info.height >= target_height - 1
    }
    return false
}
