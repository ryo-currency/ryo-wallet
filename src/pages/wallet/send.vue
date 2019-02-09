<template>
<q-page>
    <template v-if="view_only">

        <div class="row q-pt-sm q-mx-md q-mb-none items-center non-selectable" style="height: 44px;">

            <div class="col-8">
                <q-icon name="call_made" size="24px" /> Send Ryo
            </div>

            <div class="col-4">
            </div>

        </div>

        <div class="q-pa-md">

            View-only mode. Please load full wallet in order to send coins.

        </div>

    </template>
    <template v-else>

        <div class="row q-pt-sm q-mx-md q-mb-none items-center non-selectable" style="height: 44px;">

            <div class="col-8">
                <q-icon name="call_made" size="24px" /> Send Ryo
            </div>

            <div class="col-4">
            </div>

        </div>

        <div class="q-pa-md">


            <div class="row items-end gutter-md">

                <div class="col">
                    <q-field class="q-ma-none">
                        <q-input v-model="newTx.amount" float-label="Amount" :dark="theme=='dark'"
                                 type="number" min="0" :max="unlocked_balance / 1e9" />
                    </q-field>
                </div>

                <div>
                    <q-btn @click="newTx.amount = unlocked_balance / 1e9" :text-color="theme=='dark'?'white':'dark'">All coins</q-btn>
                </div>

            </div>

            <q-item class="q-pa-none">
                <q-item-side>
                    <Identicon :address="newTx.address" menu />
                </q-item-side>
                <q-item-main>
                    <q-field>
                        <q-input v-model="newTx.address" float-label="Address"
                                 :dark="theme=='dark'"
                                 @blur="$v.newTx.address.$touch"
                                 :error="$v.newTx.address.$error"
                                 />
                    </q-field>
                </q-item-main>
            </q-item>

            <q-field style="margin-top:0">
                <q-input v-model="newTx.payment_id" float-label="Uniform Payment ID (optional)"
                         :dark="theme=='dark'"
                         @blur="$v.newTx.payment_id.$touch"
                         :error="$v.newTx.payment_id.$error"
                         />
            </q-field>

            <div class="row gutter-md">

                <div class="col-6">
                    <q-field>
                        <q-select :dark="theme=='dark'"
                                  v-model="newTx.ringsize"
                                  float-label="Ring Size"
                                  :options="ringsizeOptions"
                                  />
                    </q-field>
                </div>
                <div class="col-6">
                    <q-field>
                        <q-select :dark="theme=='dark'"
                                  v-model="newTx.priority"
                                  float-label="Priority"
                                  :options="priorityOptions"
                                  />
                    </q-field>
                </div>

            </div>


            <q-field>
                <q-checkbox v-model="newTx.address_book.save" label="Save to address book" :dark="theme=='dark'" />
            </q-field>

            <div v-if="newTx.address_book.save">
                <q-field>
                    <q-input v-model="newTx.address_book.name" float-label="Name" :dark="theme=='dark'" />
                </q-field>
                <q-field>
                    <q-input v-model="newTx.address_book.description" type="textarea" rows="2" float-label="Notes" :dark="theme=='dark'" />
                </q-field>
            </div>

            <q-field class="q-pt-sm">
                <q-btn
                    :disable="!is_able_to_send"
                    color="primary" @click="send()" label="Send" />
            </q-field>

        </div>

        <q-inner-loading :visible="tx_status.sending" :dark="theme=='dark'">
            <q-spinner color="primary" :size="30" />
        </q-inner-loading>

    </template>

</q-page>
</template>

<script>
import { mapState } from "vuex"
import { required, decimal } from "vuelidate/lib/validators"
import { payment_id, address } from "src/validators/common"
import Identicon from "components/identicon"
const objectAssignDeep = require("object-assign-deep");
export default {
    computed: mapState({
        notify_no_payment_id: state => state.gateway.app.config.preference.notify_no_payment_id,
        theme: state => state.gateway.app.config.appearance.theme,
        view_only: state => state.gateway.wallet.info.view_only,
        unlocked_balance: state => state.gateway.wallet.info.unlocked_balance,
        tx_status: state => state.gateway.tx_status,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        },
        is_able_to_send (state) {
            return this.$store.getters["gateway/isAbleToSend"]
        }
    }),
    data () {
        return {
            sending: false,
            newTx: {
                amount: 0,
                address: "",
                payment_id: "",
                ringsize: 25,
                priority: 0,
                address_book: {
                    save: false,
                    name: "",
                    description: ""
                }
            },
            ringsizeOptions: [
                {label: "25 ring members (default)", value: 25},
                {label: "100 ring members (top secret)", value: 100},
            ],
            priorityOptions: [
                {label: "Normal (x1 fee)", value: 0},
                {label: "High (x2 fee)", value: 1},
                {label: "High (x4 fee)", value: 2},
                {label: "High (x20 fee)", value: 3},
                {label: "Highest (x144 fee)", value: 4},
            ],
        }
    },
    validations: {
        newTx: {
            amount: {
                required,
                decimal
            },
            address: { required, address },
            payment_id: { payment_id }
        }
    },
    watch: {
        tx_status: {
            handler(val, old){
                if(val.code == old.code) return
                switch(this.tx_status.code) {
                    case 0:
                        this.$q.notify({
                            type: "positive",
                            timeout: 1000,
                            message: this.tx_status.message
                        })
                        this.$v.$reset();
                        this.newTx = {
                            amount: 0,
                            address: "",
                            payment_id: "",
                            ringsize: 25,
                            priority: 0,
                            address_book: {
                                save: false,
                                name: "",
                                description: ""
                            }
                        }
                        break;
                    case -1:
                        this.$q.notify({
                            type: "negative",
                            timeout: 1000,
                            message: this.tx_status.message
                        })
                        break;
                }
            },
            deep: true
        },
        $route (to) {
            if(to.path == "/wallet/send" && to.query.hasOwnProperty("address")) {
                this.autoFill(to.query)
            }
        }
    },
    mounted () {
        if(this.$route.path == "/wallet/send" && this.$route.query.hasOwnProperty("address")) {
            this.autoFill(this.$route.query)
        }
    },
    methods: {

        autoFill: function (info) {
            this.newTx.address = info.address
            this.newTx.payment_id = info.payment_id
        },

        send: function () {

            this.$v.newTx.$touch()

            if(this.newTx.amount < 0) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Amount cannot be negative"
                })
                return
            } else if(this.newTx.amount == 0) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Amount must be greater than zero"
                })
                return
            } else if(this.newTx.amount > this.unlocked_balance / 1e9) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Not enough unlocked balance"
                })
                return
            } else if (this.$v.newTx.amount.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Amount not valid"
                })
                return
            }


            if (this.$v.newTx.address.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Address not valid"
                })
                return
            }

            if (this.$v.newTx.payment_id.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Payment id not valid"
                })
                return
            }

            this.warnPaymentId()
                .then(options => {
                    if(options.length > 0 && options[0] === true) {
                        // user selected do not show again
                        this.$gateway.send("core", "quick_save_config", {
                            preference: {
                                notify_no_payment_id: false
                            }
                        })
                    }

                    this.$q.dialog({
                        title: "Transfer",
                        message: "Enter wallet password to continue.",
                        prompt: {
                            model: "",
                            type: "password"
                        },
                        ok: {
                            label: "SEND"
                        },
                        cancel: {
                            flat: true,
                            label: "CANCEL",
                            color: this.theme=="dark"?"white":"dark"
                        }
                    }).then(password => {
                        this.$store.commit("gateway/set_tx_status", {
                            code: 1,
                            message: "Sending transaction",
                            sending: true
                        })
                        let newTx = objectAssignDeep.noMutate(this.newTx, {password})
                        this.$gateway.send("wallet", "transfer", newTx)
                    }).catch(() => {
                    })

                }).catch(() => {
                })
        },

        warnPaymentId: function () {
            let has_payment_id = false
            if(this.newTx.payment_id != "") {
                has_payment_id = true
            } else {
                switch(this.newTx.address.substring(0, 4)) {
                    case "RYoN":
                    case "Sumi":
                    case "RYoE":
                    case "Suti":
                        has_payment_id = true
                        break
                }
            }

            let is_subaddress = false
            switch(this.newTx.address.substring(0, 4)) {
                case "RYoS":
                case "Subo":
                case "RYoU":
                case "Susu":
                    is_subaddress = true
                    break
            }

            if(this.notify_no_payment_id && !has_payment_id && !is_subaddress) {
                return this.$q.dialog({
                    title: "Transfer",
                    message: "No Payment ID provided. If you are sending to an exchange your funds may be lost.",
                    options: {
                        type: "checkbox",
                        model: [],
                        items: [
                            {label: "Do not show this message again", value: true},
                        ]
                    },
                    ok: {
                        label: "CONTINUE"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: this.theme=="dark"?"white":"dark"
                    }
                })
            } else {
                return new Promise((resolve, reject) => {
                    resolve([])
                })
            }
        }
    },
    components: {
        Identicon
    }
}
</script>

<style>
</style>
