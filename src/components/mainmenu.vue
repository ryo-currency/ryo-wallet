<template>
<div>
    <q-btn class="menu" icon="menu" label="" size="md" flat>
        <q-popover>
            <q-list separator link>
                <q-item v-close-overlay @click.native="switchWallet" v-if="!disableSwitchWallet">
                    <q-item-main>
                        <q-item-tile label>Switch Wallet</q-item-tile>
                    </q-item-main>
                </q-item>
                <q-item v-close-overlay @click.native="openSettings">
                    <q-item-main>
                        <q-item-tile label>Settings</q-item-tile>
                    </q-item-main>
                </q-item>
                <q-item v-close-overlay @click.native="showAbout(true)">
                    <q-item-main>
                        <q-item-tile label>About</q-item-tile>
                    </q-item-main>
                </q-item>
                <q-item v-close-overlay @click.native="exit">
                    <q-item-main>
                        <q-item-tile label>Exit Ryo GUI Wallet</q-item-tile>
                    </q-item-main>
                </q-item>
            </q-list>
        </q-popover>

    </q-btn>
    <settings-modal ref="settingsModal" />
    <q-modal minimized ref="aboutModal">
        <div class="about-modal">

            <img class="q-mb-md" src="statics/ryo-wallet.svg" height="42" />

            <p class="q-my-sm">Version: ATOM v1.0.2-0.3.1.2</p>
            <p class="q-my-sm">Copyright (c) 2018, Ryo Currency Project</p>
            <p class="q-my-sm">All rights reserved.</p>

            <div class="q-mt-md q-mb-lg external-links">
                <p>
                    <a @click="openExternal('https://ryo-currency.com/')" href="#">https://ryo-currency.com/</a>
                </p>
                <p>
                    <a @click="openExternal('https://t.me/ryocurrency')" href="#">Telegram</a> -
                    <a @click="openExternal('https://discord.gg/GFQmFtx')" href="#">Discord</a> -
                    <a @click="openExternal('https://www.reddit.com/r/ryocurrency/')" href="#">Reddit</a>
                </p>
            </div>

            <q-btn
                color="primary"
                @click="showAbout(false)"
                label="Close"
                />
        </div>
    </q-modal>
</div>
</template>

<script>
import { mapState } from "vuex"
import SettingsModal from "components/settings"
export default {
    name: "MainMenu",
    props: {
        disableSwitchWallet: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
    }),
    methods: {
        openExternal (url) {
            this.$gateway.send("core", "open_url", {url})
        },
        showAbout (toggle) {
            if(toggle)
                this.$refs.aboutModal.show()
            else
                this.$refs.aboutModal.hide()
        },
        openSettings () {
            this.$refs.settingsModal.isVisible = true
        },
        switchWallet () {
            this.$q.dialog({
                title: "Switch wallet",
                message: "Are you sure you want to close the current wallet?",
                ok: {
                    label: "CLOSE"
                },
                cancel: {
                    flat: true,
                    label: "CANCEL",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(() => {
                this.$router.replace({ path: "/wallet-select" })
                this.$gateway.send("wallet", "close_wallet")
                setTimeout(() => {
                    // short delay to prevent wallet data reaching the
                    // websocket moments after we close and reset data
                    this.$store.dispatch("gateway/resetWalletData")
                }, 250);
            }).catch(() => {
            })
        },
        exit () {
            this.$gateway.confirmClose("Are you sure you want to exit?")
        }
    },
    components: {
        SettingsModal
    }
}
</script>

<style lang="scss">
.about-modal {

    padding: 25px;

    .external-links {

        a {

            color: #497dc6;
            text-decoration: none;

            &:hover,
            &:active,
            &:visited {
                text-decoration: underline;
            }

        }

    }

}

</style>
