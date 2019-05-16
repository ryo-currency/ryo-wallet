<template>
<div v-if="visible" class="q-loading animate-fade fullscreen column flex-center">
    <q-spinner color="white" size="80px" />
    <div v-if="textVisible" class="text-white">
        {{ message }}
    </div>
</div>
</template>

<script>
import { mapState } from "vuex"
export default {
    name: "WalletLoading",
    data () {
        return {
            delay: 0,
            textDelay: 1000,
            visible: false,
            textVisible: false,
            timeout: null
        }
    },
    computed: {
        message() {
            if(this.wallet.info.height) {
                return `Scanning... ${this.wallet.info.height} / ${this.target_height} (${this.wallet_pct}%)`
            }
            return "Loading..."
        },
        target_height() {
            if(this.config.daemon.type === "local" && !this.daemon.info.is_ready) {
                return Math.max(this.daemon.info.height, this.daemon.info.target_height)
            } else {
                return this.daemon.info.height
            }
        },
        wallet_pct() {
            const pct = (100 * this.wallet.info.height / this.target_height).toFixed(1)
            if(pct == 100.0 && this.wallet.info.height < this.target_height) {
                return 99.9
            } else {
                return Math.min(pct, 100)
            }
        },
        ...mapState({
            config: state => state.gateway.app.config,
            daemon: state => state.gateway.daemon,
            wallet: state => state.gateway.wallet,
        })
    },
    methods: {
        show() {
            this.timeout = setTimeout(() => {
                document.body.classList.add("with-loading")
                this.visible = true
                this.timeout = setTimeout(() => {
                    this.textVisible = true
                }, this.textDelay)
            }, this.delay)
        },
        hide() {
            this.visible = false
            this.textVisible = false
            if(this.timeout) {
                clearTimeout(this.timeout)
                this.timeout = null
            }
            document.body.classList.remove("with-loading")
        }
    },
}
</script>

<style>
</style>
