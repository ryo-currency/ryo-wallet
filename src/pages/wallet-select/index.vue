<template>
<q-page>

    <q-list link no-border>
        <template v-if="wallets.list.length">
            <q-list-header>Open wallet</q-list-header>
            <q-item v-for="wallet in wallets.list" @click.native="openWallet(wallet)">
                <q-item-side>
                    <Identicon :address="wallet.address" />
                </q-item-side>
                <q-item-main>
                    <q-item-tile label>{{ wallet.name }}</q-item-tile>
                    <q-item-tile class="monospace ellipsis" sublabel>{{ wallet.address }}</q-item-tile>
                </q-item-main>
            </q-item>
            <q-item-separator />
        </template>
        <q-item @click.native="createNewWallet()">
            <!--<q-item-side avatar="statics/guy-avatar.png" />-->
            <q-item-main label="Create new wallet" />
        </q-item>
        <q-item @click.native="restoreWallet()">
            <!--<q-item-side avatar="statics/guy-avatar.png" />-->
            <q-item-main label="Restore wallet from seed" />
        </q-item>
        <q-item @click.native="importWallet()">
            <!--<q-item-side avatar="statics/guy-avatar.png" />-->
            <q-item-main label="Import wallet from file" />
        </q-item>
        <template v-if="wallets.legacy.length">
            <q-item @click.native="importLegacyWallet()">
                <!--<q-item-side avatar="statics/guy-avatar.png" />-->
                <q-item-main label="Import wallet from legacy gui" />
            </q-item>
        </template>
    </q-list>

</q-page>
</template>

<script>
import { mapState } from "vuex"
import Identicon from "components/identicon"
export default {
    computed: mapState({
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
                        label: "CANCEL"
                    }
                }).then(password => {
                    this.$q.loading.show({
                        delay: 0
                    })
                    this.$gateway.send("wallet", "open_wallet", {name: wallet.name, password: password});
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
        importWallet() {
            this.$router.replace({ path: "wallet-select/import" });
        },
        importLegacyWallet() {
            this.$router.replace({ path: "wallet-select/import-legacy" });
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
