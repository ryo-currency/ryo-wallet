<template>
    <div>
        <q-btn class="menu" label="" size="md" flat>
            <q-icon name="menu" />
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
                    <q-item v-if="daemon_type != 'remote'" v-close-overlay @click.native="openPool">
                        <q-item-main>
                            <q-item-tile label>Solo Mining</q-item-tile>
                        </q-item-main>
                    </q-item>
                    <q-item v-close-overlay @click.native="showAbout(true)">
                        <q-item-main>
                            <q-item-tile label>About</q-item-tile>
                        </q-item-main>
                    </q-item>
                    <q-item v-close-overlay @click.native="showHelp(true)">
                        <q-item-main>
                            <q-item-tile label>Help</q-item-tile>
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
        <pool-modal ref="poolModal" />
        <q-modal minimized ref="aboutModal">
            <div class="about-modal">

                <img class="q-mb-md" src="statics/ryo-wallet.svg" height="42" />

                <p class="q-my-sm">Version: ATOM v{{version}}-v{{daemonVersion}}</p>
                <p class="q-my-sm">Copyright (c) 2022, Ryo Currency Project</p>
                <p class="q-my-sm">All rights reserved.</p>

                <div class="q-mt-md q-mb-lg external-links">
                    <p>
                        <a @click="openExternal('https://ryo-currency.com/')" href="#">https://ryo-currency.com/</a>
                    </p>
                    <p>
                        <a @click="openExternal('https://t.me/ryocurrency')" href="#">Telegram</a> -
                        <a @click="openExternal('https://discord.gg/GFQmFtx')" href="#">Discord</a> -
                        <a @click="openExternal('https://www.reddit.com/r/ryocurrency/')" href="#">Reddit</a> -
                        <a @click="openExternal('https://twitter.com/RyocurrencyO')" href="#">Twitter</a> -
                        <a @click="openExternal('https://bitcointalk.org/index.php?topic=4413010.0')" href="#">Bitcointalk</a> -
                        <a @click="openExternal('https://github.com/ryo-currency')" href="#">Github</a>
                    </p>
                </div>

                <q-btn
                        color="primary"
                        @click="showAbout(false)"
                        label="Close"
                />
            </div>
        </q-modal>

        <q-modal minimized ref="helpModal">
            <div class="about-modal">

                <img class="q-mb-md" src="statics/ryo-wallet.svg" height="42" />

                <div class="q-mt-md q-mb-lg external-links">
                <ul>
                    <li><a @click="openExternal('https://ryo-currency.com/atom/#solo-mining')" href="#">How to solo mine Ryo using Atom?</a></li>
                    <li><a @click="openExternal('https://ryo-currency.com/atom/#view-only')" href="#">View-only wallets / keys management</a></li>
                    <li><a @click="openExternal('https://ryo-currency.com/atom/#locked-balance')" href="#">Locked balance display</a></li>
                    <li><a @click="openExternal('https://ryo-currency.com/atom/#checking-balance')" href="#">An incoming transaction is not appearing</a></li>
                    <li><a @click="openExternal('https://ryo-currency.com/atom/#tx-limit')" href="#">Error: Can't get random outputs</a></li>
                </ul>
                </div>


                <div class="q-mt-md q-mb-lg external-links">
                    <p> Check more at:
                        <a @click="openExternal('https://ryo-currency.com/atom/')" href="#">https://ryo-currency.com/atom</a>
                    </p>
                    Join RYO socials:
                    <p>
                        <a @click="openExternal('https://t.me/ryocurrency')" href="#">Telegram</a> -
                        <a @click="openExternal('https://discord.gg/GFQmFtx')" href="#">Discord</a> -
                        <a @click="openExternal('https://www.reddit.com/r/ryocurrency/')" href="#">Reddit</a> -
                        <a @click="openExternal('https://twitter.com/RyocurrencyO')" href="#">Twitter</a> -
                        <a @click="openExternal('https://bitcointalk.org/index.php?topic=4413010.0')" href="#">Bitcointalk</a> -
                        <a @click="openExternal('https://github.com/ryo-currency')" href="#">Github</a>
                    </p>
                </div>

                <q-btn
                        color="primary"
                        @click="showHelp(false)"
                        label="Close"
                />
            </div>
        </q-modal>
    </div>
</template>

<script>
    import { version, daemonVersion } from "../../package.json"
    import { mapState } from "vuex"
    import SettingsModal from "components/settings"
    import PoolModal from "components/pool"
    export default {
        name: "MainMenu",
        props: {
            disableSwitchWallet: {
                type: Boolean,
                required: false,
                default: false
            }
        },
        data() {
            return {
                version: "",
                daemonVersion: ""
            }
        },
        mounted () {
            this.version = version
            this.daemonVersion = daemonVersion
        },
        computed: mapState({
            theme: state => state.gateway.app.config.appearance.theme,
            daemon_type: state => state.gateway.app.config.daemon.type
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
            showHelp (toggle) {
                if(toggle)
                    this.$refs.helpModal.show()
                else
                    this.$refs.helpModal.hide()
            },
            openSettings () {
                this.$refs.settingsModal.isVisible = true
            },
            openPool () {
                this.$refs.poolModal.isVisible = true
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
            SettingsModal,
            PoolModal
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
