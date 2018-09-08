<template>
<q-layout view="hHh Lpr lFf">
    <q-layout-header>
        <q-btn-dropdown icon="menu" label="" size="md" flat>
            <!-- dropdown content -->
            <q-list link>
                <q-item>
                    <q-item-main>
                        <q-item-tile label>Switch Wallet</q-item-tile>
                    </q-item-main>
                </q-item>
                <q-item>
                    <q-item-main>
                        <q-item-tile label>Settings</q-item-tile>
                    </q-item-main>
                </q-item>
                <q-item>
                    <q-item-main>
                        <q-item-tile label>Exit Ryo GUI Wallet</q-item-tile>
                    </q-item-main>
                </q-item>
            </q-list>
        </q-btn-dropdown>

        <q-tabs class="col" align="justify" color="dark" inverted>
            <q-tab slot="title"><span><q-icon name="attach_money" /> Wallet</span></q-tab>
            <q-tab slot="title"><span><q-icon name="call_received" /> Receive</span></q-tab>
            <q-tab slot="title"><span><q-icon name="call_made" /> Send</span></q-tab>
            <q-tab slot="title"><span><q-icon name="person" /> Address Book</span></q-tab>
            <q-tab slot="title"><span><q-icon name="history" /> TX History</span></q-tab>

        </q-tabs>
    </q-layout-header>

    <q-page-container>
        <router-view />
    </q-page-container>


    <q-layout-footer>
        <div class="row">
            <div>
                Daemon: {{ status }}
            </div>
            <div>
                Height: {{ height }}
            </div>

        </div>
        <q-progress :percentage="progress" stripe animate />
    </q-layout-footer>

</q-layout>
</template>

<script>
import {
    openURL
} from "quasar"
import {
    mapState
} from "vuex"

export default {
    name: "LayoutDefault",
    data() {
        return {
            selectedTab: "tab-1",
            progress: 40
        }
    },
    computed: {
        ...mapState({
            status: state => state.gateway.info.status,
            height: state => state.gateway.info.height
        })
    },
    methods: {
        openURL
    }
}
</script>

<style>
.q-layout-header {
    box-shadow: none;
    border-bottom: 1px solid #ddd;
}


.q-layout-header .q-btn-dropdown {
    height: 48px;
    width: 50px;
    position: absolute;
    z-index: 1;
    border-radius: 0;
}

.q-layout-header .q-btn-dropdown .q-btn-dropdown-arrow {
    display: none;
}

.q-layout-header .q-tabs {
    padding-left: 50px;
}

.q-layout-header .q-tabs-head {
    padding: 0;
}

.q-layout-header .q-tabs .q-tab {
    text-transform: none;
}

.q-layout-header .q-tabs .q-icon {
    font-size: 22px;
}
</style>
