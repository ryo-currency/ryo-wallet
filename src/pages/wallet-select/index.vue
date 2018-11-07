<template>
<q-page>

    <q-list link no-border :dark="theme=='dark'">
        <template v-if="wallets.list.length">
            <q-list-header>Open wallet</q-list-header>
            <q-item v-for="(wallet, index) in wallets.list" @click.native="openWallet(wallet)">
                <q-item-side>
                    <Identicon :address="wallet.address" :ref="`${index}-identicon`" />
                </q-item-side>
                <q-item-main>
                    <q-item-tile label>{{ wallet.name }}</q-item-tile>
                    <q-item-tile class="monospace ellipsis" sublabel>{{ wallet.address }}</q-item-tile>
                </q-item-main>
                <q-item-side>
                    <q-btn
                        color="primary" style="width:25px;"
                        size="sm" icon="file_copy"
                        @click="copyAddress(wallet.address, $event)">
                        <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                            Copy address
                        </q-tooltip>
                    </q-btn>
                </q-item-side>

                <q-context-menu>
                    <q-list link separator style="min-width: 150px; max-height: 300px;">
                        <q-item v-close-overlay
                                @click.native="openWallet(wallet)">
                            <q-item-main label="Open wallet" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="copyAddress(wallet.address, $event)">
                            <q-item-main label="Copy address" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="$refs[`${index}-identicon`][0].saveIdenticon()">
                            <q-item-main label="Save identicon to file" />
                        </q-item>
                    </q-list>
                </q-context-menu>

            </q-item>
            <q-item-separator />
        </template>
        <q-item @click.native="createNewWallet()">
            <q-item-main label="Create new wallet" />
        </q-item>
        <q-item @click.native="restoreWallet()">
            <q-item-main label="Restore wallet from seed" />
        </q-item>
        <q-item @click.native="restoreViewWallet()">
            <q-item-main label="Restore view-only wallet" />
        </q-item>
        <q-item @click.native="importWallet()">
            <q-item-main label="Import wallet from file" />
        </q-item>
        <template v-if="wallets.legacy.length">
            <q-item @click.native="importLegacyWallet()">
                <q-item-main label="Import wallet from legacy gui" />
            </q-item>
        </template>
    </q-list>

</q-page>
</template>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
import Identicon from "components/identicon"
export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        wallets: state => state.gateway.wallets,
        status: state => state.gateway.wallet.status
    }),
    methods: {
        openWallet(wallet) {
            if(wallet.password_protected !== false) {
                this.$q.dialog({
                    title: "Password",
                    message: "Enter wallet password to continue.",
                    prompt: {
                        model: "",
                        type: "password"
                    },
                    ok: {
                        label: "OPEN"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: this.theme=="dark"?"white":"dark"
                    }
                }).then(password => {
                    this.$q.loading.show({
                        delay: 0
                    })
                    this.$gateway.send("wallet", "open_wallet", {name: wallet.name, password: password});
                })
                .catch(() => {
                })
            } else {
                this.$q.loading.show({
                    delay: 0
                })
                this.$gateway.send("wallet", "open_wallet", {name: wallet.name, password: ""});
            }
        },
        createNewWallet() {
            this.$router.replace({ path: "wallet-select/create" });
        },
        restoreWallet() {
            this.$router.replace({ path: "wallet-select/restore" });
        },
        restoreViewWallet() {
            this.$router.replace({ path: "wallet-select/import-view-only" });
        },
        importWallet() {
            this.$router.replace({ path: "wallet-select/import" });
        },
        importLegacyWallet() {
            this.$router.replace({ path: "wallet-select/import-legacy" });
        },
        copyAddress (address, event) {
            event.stopPropagation()
            for(let i = 0; i < event.path.length; i++) {
                if(event.path[i].tagName == "BUTTON") {
                    event.path[i].blur()
                    break
                }
            }
            clipboard.writeText(address)
            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Address copied to clipboard"
            })
        }
    },
    watch: {
        status: {
            handler(val, old){
                if(val.code == old.code) return
                switch(this.status.code) {
                    case 0: // Wallet loaded
                        this.$q.loading.hide()
                        this.$router.replace({ path: "/wallet" });
                        break;
                    case -1: // Error
                    case -22:
                        this.$q.loading.hide()
                        this.$q.notify({
                            type: "negative",
                            timeout: 1000,
                            message: this.status.message
                        })
                        this.$store.commit("gateway/set_wallet_data", {
                            status: {
                                code: 1 // Reset to 1 (ready for action)
                            }
                        });
                        break;
                }
            },
            deep: true
        }
    },
    components: {
        Identicon
    }
}
</script>

<style>
</style>
