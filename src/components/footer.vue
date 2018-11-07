<template>
<q-layout-footer class="status-footer">
    <div class="status-line">

        <template v-if="config.daemon.type !== 'remote'">
            <div>Daemon: {{ daemon.info.height_without_bootstrap }} / {{ target_height }} ({{ daemon_local_pct }}%)</div>
        </template>

        <template v-if="config.daemon.type !== 'local'">
            <div>Remote: {{ daemon.info.height }}</div>
        </template>

        <div>Wallet: {{ wallet.info.height }} / {{ target_height }} ({{ wallet_pct }}%)</div>

        <div>{{ status }}</div>

    </div>
    <div class="status-bars">
        <div v-bind:style="{ width: daemon_pct+'%' }"></div>
        <div v-bind:style="{ width: wallet_pct+'%' }"></div>
    </div>
</q-layout-footer>
</template>

<script>
import { mapState } from "vuex"
export default {
    name: "StatusFooter",
    computed: mapState({

        config: state => state.gateway.app.config,
        daemon: state => state.gateway.daemon,
        wallet: state => state.gateway.wallet,

        target_height (state) {
            if(this.config.daemon.type === "local" && !this.daemon.info.is_ready)
                return Math.max(this.daemon.info.height, this.daemon.info.target_height)
            else
                return this.daemon.info.height
        },
        daemon_pct (state) {
            if(this.config.daemon.type === "local")
                return this.daemon_local_pct
            return 0
        },
        daemon_local_pct (state) {
            if(this.config.daemon.type === "remote")
                return 0
            let pct = (100 * this.daemon.info.height_without_bootstrap / this.target_height).toFixed(1)
            if(pct == 100.0 && this.daemon.info.height_without_bootstrap < this.target_height)
                return 99.9
            else
                return pct
        },
        wallet_pct (state) {
            let pct = (100 * this.wallet.info.height / this.target_height).toFixed(1)
            if(pct == 100.0 && this.wallet.info.height < this.target_height)
                return 99.9
            else
                return pct
        },
        status(state) {
            if(this.config.daemon.type === "local") {
                if(this.daemon.info.height_without_bootstrap < this.target_height || !this.daemon.info.is_ready) {
                    return "Syncing..."
                } else if(this.wallet.info.height < this.target_height - 1 && this.wallet.info.height != 0) {
                    return "Scanning..."
                } else {
                    return "Ready"
                }
            } else {
                if(this.wallet.info.height < this.target_height - 1 && this.wallet.info.height != 0) {
                    return "Scanning..."
                } else if(this.daemon.info.height_without_bootstrap < this.target_height) {
                    return "Syncing..."
                } else {
                    return "Ready"
                }
            }
            return
        }

    }),
    data () {
        return {
        }
    },
}
</script>

<style lang="scss">
</style>
