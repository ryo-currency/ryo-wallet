<template>
<q-modal v-model="isVisible" maximized class="settings-modal">
    <q-modal-layout>
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn flat round dense @click="isVisible = false" icon="reply" />
            <q-toolbar-title shrink>
                Settings
            </q-toolbar-title>

            <div class="row col justify-center q-pr-xl">
                <q-btn-toggle
                    v-model="page"
                    toggle-color="primary"
                    size="md"
                    :options="tabs"
                    />
            </div>

            <q-btn color="primary" @click="save" label="Save" />
        </q-toolbar>

        <div v-if="page=='general'">
            <div class="q-pa-lg">
                <SettingsGeneral ref="settingsGeneral"></SettingsGeneral>
            </div>
        </div>

        <div v-if="page=='preferences'">
            <div class="q-pa-md">
                <h6 class="q-mb-md q-mt-none" style="font-weight: 300">Appearance:</h6>

                <q-btn-toggle
                    v-model="theme"
                    toggle-color="primary"
                    size="md"
                    :options="[
                              {label: 'Light theme', value: 'light', icon: 'brightness_5'},
                              {label: 'Dark theme', value: 'dark', icon: 'brightness_2'},
                              ]"
                    />


                <h6 class="q-mb-md" style="font-weight: 300">Preferences:</h6>
                <div>
                    <q-checkbox v-model="minimize_to_tray" label="Minimize to Tray" />
                </div>

                <h6 class="q-mb-md" style="font-weight: 300">Notifications:</h6>
                <div>
                    <q-checkbox v-model="notify_no_payment_id" label="Notify when making transaction without Payment ID" />
                </div>
                <div>
                    <q-checkbox v-model="notify_empty_password" label="Notify when creating or restoring a wallet with an insecure password" />
                </div>

            </div>
        </div>

        <div v-if="page=='peers'">
            <q-list :dark="theme=='dark'" no-border>
                <q-list-header>Peer list</q-list-header>

                <q-item link v-for="(entry, index) in daemon.connections" @click.native="showPeerDetails(entry)">
                    <q-item-main>
                        <q-item-tile label>{{ entry.address }}</q-item-tile>
                        <q-item-tile sublabel>Height: {{ entry.height }}</q-item-tile>
                    </q-item-main>
                </q-item>

                <template v-if="daemon.bans.length">

                    <q-list-header>Banned peers (bans will cleared if wallet is restarted)</q-list-header>
                    <q-item v-for="(entry, index) in daemon.bans">
                        <q-item-main>
                            <q-item-tile label>{{ entry.host }}</q-item-tile>
                            <q-item-tile sublabel>Banned until {{ new Date(Date.now() + entry.seconds * 1000).toLocaleString() }}</q-item-tile>
                        </q-item-main>
                    </q-item>

                </template>

            </q-list>

        </div>

    </q-modal-layout>

</q-modal>
</template>

<script>
import { mapState } from "vuex"
import SettingsGeneral from "components/settings_general"
export default {
    name: "SettingsModal",
    computed: mapState({
        daemon: state => state.gateway.daemon,
        pending_config: state => state.gateway.app.pending_config,
        config: state => state.gateway.app.config,
        tabs: function(state) {
            let tabs = [
                {label: 'General', value: 'general', icon: 'settings'},
                {label: 'Preferences', value: 'preferences', icon: 'person'},
            ]
            if(state.gateway.app.config.daemon.type != 'remote') {
                tabs.push({label: 'Peers', value: 'peers', icon: 'cloud_queue'})
            }
            return tabs
        }
    }),
    data () {
        return {
            page: "general",
            theme: null,
            minimize_to_tray: null,
            notify_no_payment_id: null,
            notify_empty_password: null,
            isVisible: false
        }
    },
    mounted: function () {
        this.theme = this.config.appearance.theme
        this.minimize_to_tray = this.config.preference.minimize_to_tray === null ? false : this.config.preference.minimize_to_tray
        this.notify_no_payment_id = this.config.preference.notify_no_payment_id
        this.notify_empty_password = this.config.preference.notify_empty_password
    },
    watch: {
        theme: function (theme, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                appearance: {
                    theme: this.theme
                }
            })
        },
        minimize_to_tray: function (minimize_to_tray, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    minimize_to_tray: this.minimize_to_tray
                }
            })
        },
        notify_no_payment_id: function (notify_no_payment_id, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    notify_no_payment_id: this.notify_no_payment_id
                }
            })
        },
        notify_empty_password: function (notify_empty_password, old) {
            if(old == null) return
            this.$gateway.send("core", "quick_save_config", {
                preference: {
                    notify_empty_password: this.notify_empty_password
                }
            })
        },
        isVisible: function () {
            if(this.isVisible == false) {
                this.$store.dispatch("gateway/resetPendingConfig")
            }
        }
    },
    methods: {
        save() {
            this.$gateway.send("core", "save_config", this.pending_config);
            this.isVisible = false
        },
        showPeerDetails (entry) {
            this.$q.dialog({
                title: "Peer details",
                message: JSON.stringify(entry, null, 2),
                ok: {
                    label: "Ban peer",
                    color: "negative",
                },
                cancel: {
                    flat: true,
                    label: "Close",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(() => {

                this.$q.dialog({
                    title: "Ban peer",
                    message: "Enter length to ban peer in seconds.\nDefault 3600 = 1 hour.",
                    prompt: {
                        model: "",
                        type: "number"
                    },
                    ok: {
                        label: "Ban peer",
                        color: "negative"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: this.theme=="dark"?"white":"dark"
                    }
                }).then(seconds => {
                    this.$gateway.send("daemon", "ban_peer", {host: entry.host, seconds})
                }).catch(() => {

                })
            }).catch(() => {

            })
        }
    },
    components: {
        SettingsGeneral
    }
}
</script>

<style lang="scss">
</style>
