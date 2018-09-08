<template>
<q-modal v-model="isVisible" maximized class="settings-modal">
    <q-modal-layout>
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn flat round dense @click="isVisible = false" icon="reply" />
            <q-toolbar-title>
                Settings
            </q-toolbar-title>
            <q-btn color="primary" @click="save" label="Save" />
        </q-toolbar>

        <div class="sidebar">
            <q-list link no-border>
                <q-item @click.native="page = 'general'">
                    <q-item-side icon="settings" />
                    <q-item-main label="General" />
                </q-item>
                <q-item @click.native="page = 'peers'">
                    <q-item-side icon="cloud_queue" />
                    <q-item-main label="Peers" />
                </q-item>
            </q-list>
        </div>

        <div class="body" v-if="page=='general'">
            <div class="q-pa-lg">
                <SettingsGeneral ref="settingsGeneral"></SettingsGeneral>
            </div>
        </div>

        <div class="body" v-if="page=='peers'">
            <q-list link no-border>
                <q-list-header>Peer list</q-list-header>

                <q-item v-for="(entry, index) in daemon.connections" @click.native="showPeerDetails(entry)">
                    <q-item-main>
                        <q-item-tile label>{{ entry.address }}</q-item-tile>
                        <q-item-tile sublabel>{{ entry.height }}</q-item-tile>
                    </q-item-main>
                </q-item>

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
        pending_config: state => state.gateway.app.pending_config
    }),
    data () {
        return {
            page: "general",
            isVisible: false,
        }
    },
    watch: {
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
                    label: "Close",
                    flat: true,
                }
            }).then(() => {
                this.$q.notify("Banned "+entry.address)
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
.settings-modal {
    .sidebar {
        /*
        position:absolute;
        width: 170px;
        padding: 10px 0;
       */
        display:none;
    }
    .body {
        /*
        margin-left:170px;
       */
        padding: 10px 0 10px 10px;
    }
}
.modal-body.modal-message.modal-scroll {
    white-space: pre;
}
</style>
