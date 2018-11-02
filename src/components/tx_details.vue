<template>
<q-modal v-model="isVisible" maximized :content-css="{padding: '50px'}">
    <q-modal-layout>
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn
                flat
                round
                dense
                @click="isVisible = false"
                icon="reply"
                />
            <q-toolbar-title>
                Transaction details
            </q-toolbar-title>
            <q-btn flat class="q-mr-sm" @click="showTxDetails" label="Show tx details" />
            <q-btn color="primary" @click="openExplorer" label="View on explorer" />
        </q-toolbar>

        <div class="layout-padding">

            <div class="row items-center non-selectable">
                <div class="q-mr-sm">
                    <TxTypeIcon :type="tx.type" :tooltip="false" />
                </div>

                <div :class="'tx-'+tx.type" v-if="tx.type=='in'">
                    Incoming transaction
                </div>
                <div :class="'tx-'+tx.type" v-else-if="tx.type=='out'">
                    Outgoing transaction
                </div>
                <div :class="'tx-'+tx.type" v-else-if="tx.type=='pool'">
                    Pending incoming transaction
                </div>
                <div :class="'tx-'+tx.type" v-else-if="tx.type=='pending'">
                    Pending outgoing transaction
                </div>
                <div :class="'tx-'+tx.type" v-else-if="tx.type=='failed'">
                    Failed transaction
                </div>

            </div>

            <div class="row justify-between" style="max-width: 768px">

                <div class="infoBox">
                    <div class="infoBoxContent">
                        <div class="text"><span>Amount</span></div>
                        <div class="value"><span><FormatRyo :amount="tx.amount" /></span></div>
                    </div>
                </div>

                <div class="infoBox">
                    <div class="infoBoxContent">
                        <div class="text"><span>Fee <template v-if="tx.type=='in'||tx.type=='pool'">(paid by sender)</template></span></div>
                        <div class="value"><span><FormatRyo :amount="tx.fee" /></span></div>
                    </div>
                </div>

                <div class="infoBox">
                    <div class="infoBoxContent">
                        <div class="text"><span>Height</span></div>
                        <div class="value"><span>{{ tx.height }}</span></div>
                    </div>
                </div>

                <div class="infoBox">
                    <div class="infoBoxContent">
                        <div class="text"><span>Timestamp</span></div>
                        <div class="value"><span>{{ formatDate(tx.timestamp*1000) }}</span></div>
                    </div>
                </div>

            </div>


            <h6 class="q-mt-xs q-mb-none text-weight-light">Transaction id</h6>
            <p class="monospace break-all">{{ tx.txid }}</p>

            <h6 class="q-mt-xs q-mb-none text-weight-light">Payment id</h6>
            <p class="monospace break-all">{{ tx.payment_id ? tx.payment_id : 'N/A' }}</p>


            <div v-if="tx.type=='in' || tx.type=='pool'">
                <q-list no-border>
                    <q-list-header class="q-px-none">Incoming transaction sent to:</q-list-header>
                    <q-item class="q-px-none">
                        <q-item-side>
                            <Identicon :address="in_tx_address_used.address" ref="identicon" />
                        </q-item-side>
                        <q-item-main>
                            <q-item-tile label>{{ in_tx_address_used.address_index_text }}</q-item-tile>
                            <q-item-tile class="monospace ellipsis" sublabel>{{ in_tx_address_used.address }}</q-item-tile>
                        </q-item-main>

                        <q-context-menu>
                            <q-list link separator style="min-width: 150px; max-height: 300px;">
                                <q-item v-close-overlay
                                        @click.native="copyAddress(in_tx_address_used.address, $event)">
                                    <q-item-main label="Copy address" />
                                </q-item>

                                <q-item v-close-overlay
                                        @click.native="$refs.identicon.saveIdenticon()">
                                    <q-item-main label="Save identicon to file" />
                                </q-item>
                            </q-list>
                        </q-context-menu>

                    </q-item>
                </q-list>
            </div>

            <div v-else-if="tx.type=='out' || tx.type=='pending'">
                <q-list no-border>
                    <q-list-header class="q-px-none">Outgoing transaction sent to:</q-list-header>
                    <template v-if="out_destinations">
                        <q-item class="q-px-none" v-for="destination in out_destinations">
                            <q-item-side>
                                <Identicon :address="destination.address" ref="identicon" />
                            </q-item-side>
                            <q-item-main>
                                <q-item-tile label>{{ destination.name }}</q-item-tile>
                                <q-item-tile class="monospace ellipsis" sublabel>{{ destination.address }}</q-item-tile>
                                <q-item-tile sublabel><FormatRyo :amount="destination.amount" /></q-item-tile>
                            </q-item-main>

                            <q-context-menu>
                                <q-list link separator style="min-width: 150px; max-height: 300px;">
                                    <q-item v-close-overlay
                                            @click.native="copyAddress(destination.address, $event)">
                                        <q-item-main label="Copy address" />
                                    </q-item>

                                    <q-item v-close-overlay
                                            @click.native="$refs.identicon.saveIdenticon()">
                                        <q-item-main label="Save identicon to file" />
                                    </q-item>
                                </q-list>
                            </q-context-menu>

                        </q-item>
                    </template>
                    <template v-else>
                        <q-item class="q-px-none">
                            <q-item-side>
                                <Identicon address="" />
                            </q-item-side>
                            <q-item-main>
                                <q-item-tile label>Destination unknown</q-item-tile>
                            </q-item-main>
                        </q-item>
                    </template>
                </q-list>
            </div>

            <q-field class="q-mt-md">
                <q-input
                    v-model="txNotes" float-label="Transaction notes"
                    :dark="theme=='dark'"
                    type="textarea" rows="2" />
            </q-field>

            <q-field class="q-mt-sm">
                <q-btn
                    :disable="!is_ready"
                    :text-color="theme=='dark'?'white':'dark'"
                    @click="saveTxNotes" label="Save tx notes" />
            </q-field>

        </div>

    </q-modal-layout>

</q-modal>
</template>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
import { date } from "quasar"
const { formatDate } = date
import Identicon from "components/identicon"
import TxTypeIcon from "components/tx_type_icon"
import FormatRyo from "components/format_ryo"
export default {
    name: "TxDetails",
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        in_tx_address_used (state) {
            let i
            let used_addresses = state.gateway.wallet.address_list.primary.concat(state.gateway.wallet.address_list.used)
            for(i=0; i < used_addresses.length; i++) {
                if(used_addresses[i].address_index == this.tx.subaddr_index.minor) {
                    let address_index_text = ""
                    if(used_addresses[i].address_index === 0) {
                        address_index_text = "Primary address"
                    } else {
                        address_index_text = "Sub-address (Index: "+used_addresses[i].address_index+")"
                    }
                    return {
                        address: used_addresses[i].address,
                        address_index: used_addresses[i].address_index,
                        address_index_text: address_index_text
                    }
                }
            }
            return false
        },
        out_destinations (state) {
            if(!this.tx.destinations)
                return false
            let i, j
            let destinations = []
            let address_book = state.gateway.wallet.address_list.address_book
            for(i=0; i < this.tx.destinations.length; i++) {
                let destination = this.tx.destinations[i]
                destination.name = ""
                for(j=0; j < address_book.length; j++) {
                    console.log(destination.address, address_book[j].address)
                    if(destination.address == address_book[j].address) {
                        destination.name = address_book[j].description
                        break;
                    }
                }
                destinations.push(destination)
            }
            return destinations
        },
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        }
    }),
    data () {
        return {
            isVisible: false,
            txNotes: "",
            tx: {
                address: "",
                amount: 0,
                double_spend_seen: false,
                fee: 0,
                height: 0,
                note: "",
                payment_id: "",
                subaddr_index: {major: 0, minor: 0},
                timestamp: 0,
                txid: "",
                type: "",
                unlock_time:0
            }
        }
    },
    methods: {
        showTxDetails () {
            this.$q.dialog({
                title: "Transaction details",
                message: JSON.stringify(this.tx, null, 2),
                ok: {
                    label: "close",
                    color: "primary",
                },
            }).then(() => {
            }).catch(() => {
            });
        },
        openExplorer () {
            this.$gateway.send("core", "open_explorer", {type: "tx", id: this.tx.txid})
        },
        saveTxNotes () {

            this.$q.notify({
                timeout: 1000,
                type: "positive",
                message: "Transaction notes saved"
            })
            this.$gateway.send("wallet", "save_tx_notes", {txid: this.tx.txid, note: this.txNotes})
        },
        formatDate (timestamp) {
            return date.formatDate(timestamp, "YYYY-MM-DD hh:mm a")
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
    components: {
        Identicon,
        TxTypeIcon,
        FormatRyo
    }
}
</script>

<style>
</style>
