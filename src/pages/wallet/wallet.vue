<template>
<q-page padding>

    <AddressHeader :address="info.address" :header="info.name" :subheader="info.address" />


    <div class="row justify-between" style="max-width: 768px">

        <div class="infoBox">
            <div class="infoBoxContent">
                <div class="text"><span>Balance</span></div>
                <div class="value"><span><FormatRyo :amount="info.balance" /></span></div>
            </div>
        </div>

        <div class="infoBox">
            <div class="infoBoxContent">
                <div class="text"><span>Unlocked balance</span></div>
                <div class="value"><span><FormatRyo :amount="info.unlocked_balance" /></span></div>
            </div>
        </div>

        <div class="infoBox q-pt-md">
            <q-btn
                 :disable="!is_ready"
                 flat @click="getPrivateKeys()">Show seed words</q-btn>
            <q-btn
                 :disable="!is_ready"
                 flat @click="rescan_modal_show = true">Rescan Wallet</q-btn>
        </div>

    </div>


    <div>

        <h6 class="q-my-none">Recent transactions:</h6>

        <TxList :limit="5" />

    </div>

    <q-inner-loading :visible="spinner">
        <q-spinner color="primary" :size="30" />
    </q-inner-loading>

    <q-modal minimized v-model="private_keys_modal_show" @hide="closePrivateKeys()">
        <div class="q-ma-md">
            <h6 class="q-mb-xs q-mt-lg">Seed words</h6>
            <p>{{ secret.mnemonic }}</p>

            <template v-if="secret.view_key != secret.spend_key">
                <h6 class="q-mb-xs">View key</h6>
                <p>{{ secret.view_key }}</p>
            </template>

            <h6 class="q-mb-xs">Spend key</h6>
            <p>{{ secret.spend_key }}</p>

            <q-btn
                 color="primary"
                 @click="private_keys_modal_show = false"
                 label="Close"
                 />
        </div>
    </q-modal>


    <q-modal minimized v-model="rescan_modal_show">
        <div class="q-ma-md">

            <h4 class="q-mt-lg q-mb-md">Rescan wallet</h4>
            <p>Select full rescan or rescan of spent outputs only.</p>

            <div class="q-mt-lg">
                <q-radio v-model="rescan_type" val="full" label="Rescan full blockchain" />
            </div>
            <div class="q-mt-sm">
                <q-radio v-model="rescan_type" val="spent" label="Rescan spent outputs" />
            </div>

            <div class="q-mt-xl text-right">
                <q-btn
                     flat class="q-mr-sm"
                     @click="rescan_modal_show = false"
                     label="Close"
                     />
                <q-btn
                     color="primary"
                     @click="rescanWallet()"
                     label="Rescan"
                     />
            </div>
        </div>
    </q-modal>

</q-page>
</template>

<script>
import { mapState } from "vuex"
import AddressHeader from "components/address_header"
import FormatRyo from "components/format_ryo"
import TxList from "components/tx_list"
export default {
    computed: mapState({
        info: state => state.gateway.wallet.info,
        secret: state => state.gateway.wallet.secret,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        }
    }),
    data () {
        return {
            spinner: false,
            private_keys_modal_show: false,
            rescan_modal_show: false,
            rescan_type: "full"
        }
    },
    watch: {
        secret: {
            handler(val, old) {
                if(val.view_key == old.view_key) return
                this.spinner = false
                console.log(this.secret.view_key)
                switch(this.secret.view_key) {
                    case "":
                        break
                    case -1:
                        this.$q.notify({
                            type: "negative",
                            timeout: 1000,
                            message: this.secret.mnemonic
                        })
                        this.$store.commit("gateway/set_wallet_data", {
                            secret: {
                                mnemonic: "",
                                spend_key: "",
                                view_key: ""
                            }
                        })
                        break
                    default:
                        this.private_keys_modal_show = true
                        break
                }
            },
            deep: true
        }
    },
    methods: {
        getPrivateKeys () {
            this.$q.dialog({
                title: "Show seed words",
                message: "Enter wallet password to continue.",
                prompt: {
                    model: "",
                    type: "password"
                },
                ok: {
                    label: "SHOW"
                },
                cancel: {
                    flat: true,
                    label: "CANCEL"
                }
            }).then(password => {
                //this.spinner = true
                this.$gateway.send("wallet", "get_private_keys", {password})
            })
        },
        closePrivateKeys () {
            this.private_keys_modal_show = false
            setTimeout(() => {
                this.$store.commit("gateway/set_wallet_data", {
                    secret: {
                        mnemonic: "",
                        spend_key: "",
                        view_key: ""
                    }
                })
            }, 500)
        },
        rescanWallet () {
            this.rescan_modal_show = false
            if(this.rescan_type == "full") {
                this.$gateway.send("wallet", "rescan_blockchain")
            } else {
                this.$gateway.send("wallet", "rescan_spent")
            }
        }
    },
    components: {
        FormatRyo,
        AddressHeader,
        TxList
    },
}
</script>

<style lang="scss">
.layout-padding {
    padding: 15px 16px !important;
}
</style>
