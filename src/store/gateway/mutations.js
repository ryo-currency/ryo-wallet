const objectAssignDeep = require("object-assign-deep");

export const set_app_data = (state, data) => {
    state.app = objectAssignDeep.noMutate(state.app, data)
}
export const set_daemon_data = (state, data) => {
    state.daemon = objectAssignDeep.noMutate(state.daemon, data)
}
export const set_wallet_data = (state, data) => {
    state.wallet = objectAssignDeep.noMutate(state.wallet, data)
}
export const set_wallet_list = (state, data) => {
    state.wallets = objectAssignDeep.noMutate(state.wallets, data)
}
export const set_tx_status = (state, data) => {
    state.tx_status = data
}
