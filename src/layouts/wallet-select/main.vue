<template>
<q-layout view="hHh Lpr lFf">
    <q-layout-header class="shift-title">

        <template v-if="show_menu">
            <main-menu :disable-switch-wallet="true" />
        </template>
        <template v-else>
            <q-btn class="cancel" icon="reply"
                   flat round dense
                   @click="cancel()" />
        </template>

        <q-toolbar-title v-if="page_title=='Ryo'">
            <div style="margin-top:7px">
                <img src="statics/ryo-wallet.svg" height="32">
            </div>
        </q-toolbar-title>
        <q-toolbar-title v-else>
            {{ page_title }}
        </q-toolbar-title>

    </q-layout-header>

    <q-page-container>
        <router-view ref="page" />
    </q-page-container>

    <status-footer />

</q-layout>
</template>

<script>
import { mapState } from "vuex"

import SettingsModal from "components/settings"
import StatusFooter from "components/footer"
import MainMenu from "components/mainmenu"

export default {
    data() {
        return {
        }
    },
    computed: {
        show_menu () {
            return this.$route.name === "wallet-select"
        },
        page_title () {
            switch(this.$route.name) {
                case "wallet-create":
                    return "Create new wallet"
                case "wallet-restore":
                    return "Restore wallet from seed"
                case "wallet-import":
                    return "Import wallet from file"
                case "wallet-import-view-only":
                    return "Restore view-only wallet"
                case "wallet-import-legacy":
                    return "Import wallet from legacy gui"
                case "wallet-created":
                    return "Wallet created/restored"

                default:
                case "wallet-select":
                    return "Ryo"
            }
        }
    },
    methods: {
        cancel() {
            this.$router.replace({ path: "/wallet-select" });
            this.$gateway.send("wallet", "close_wallet")
            setTimeout(() => {
                // short delay to prevent wallet data reaching the
                // websocket moments after we close and reset data
                this.$store.dispatch("gateway/resetWalletData")
            }, 250);
        }
    },
    components: {
        StatusFooter,
        MainMenu
    }
}
</script>

<style>
</style>
