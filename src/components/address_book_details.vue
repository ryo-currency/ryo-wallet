<template>
<q-modal v-model="isVisible" maximized class="address-book-details">

    <q-modal-layout v-if="mode == 'edit' || mode == 'new'">
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn flat round dense icon="reply" @click="close()" />
            <q-toolbar-title v-if="mode=='new'">
                Add address book entry
            </q-toolbar-title>
            <q-toolbar-title v-else-if="mode=='edit'">
                Edit address book entry
            </q-toolbar-title>


            <q-btn v-if="mode=='edit'" flat no-ripple @click="cancelEdit()" label="Cancel" />
            <q-btn class="q-ml-sm" color="primary" @click="save()" label="Save" />


        </q-toolbar>
        <div>

            <q-list no-border>

                <q-item>
                    <q-item-side class="self-start">
                        <Identicon :address="newEntry.address" />
                    </q-item-side>
                    <q-item-main>
                        <q-field>
                            <q-input v-model="newEntry.address" float-label="Address"
                                     @blur="$v.newEntry.address.$touch"
                                     :error="$v.newEntry.address.$error"
                                     />
                        </q-field>
                    </q-item-main>
                </q-item>

                <q-item>
                    <q-item-main>
                        <q-field>
                            <q-input v-model="newEntry.name" float-label="Name" />
                        </q-field>
                    </q-item-main>
                    <q-item-side class="self-start q-pa-sm">
                        <q-checkbox
                             v-model="newEntry.starred"
                             checked-icon="star"
                             unchecked-icon="star_border"
                             class="star-entry"
                             />
                    </q-item-side>
                </q-item>

                <q-item>
                    <q-item-main>
                        <q-field>
                            <q-input v-model="newEntry.payment_id" float-label="Payment ID (optional)"
                                     @blur="$v.newEntry.payment_id.$touch"
                                     :error="$v.newEntry.payment_id.$error"
                                     />
                        </q-field>
                    </q-item-main>
                </q-item>

                <q-item>
                    <q-item-main>
                        <q-field>
                            <q-input v-model="newEntry.description" type="textarea" float-label="Notes (optional)" />
                        </q-field>
                    </q-item-main>
                </q-item>


                <q-item v-if="mode=='edit'">
                    <q-item-main>
                        <q-field>
                            <q-btn class="float-right" color="red" @click="deleteEntry()" label="Delete" />
                        </q-field>
                    </q-item-main>
                </q-item>


            </q-list>
        </div>
    </q-modal-layout>

    <q-modal-layout v-else>
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn flat round dense icon="reply" @click="close()" />
            <q-toolbar-title>
                Address book details
            </q-toolbar-title>
            <q-btn class="q-mr-sm"
                 flat no-ripple
                 :disable="!is_ready"
                 @click="edit()" label="Edit" />
            <q-btn color="primary" @click="copyAddress" label="Copy address" />
        </q-toolbar>
        <div class="layout-padding">

            <template v-if="entry != null">

                <AddressHeader :address="entry.address"
                               :header="entry.name"
                               :subheader="entry.address"
                               :extra="/^0*$/.test(entry.payment_id) ? '' : 'Payment id: '+entry.payment_id"
                               :extra2="entry.description ? 'Notes: '+entry.description : ''"
                               />



                <div class="q-mt-lg">

                    <div class="non-selectable">
                        <q-icon name="history" size="24px" />
                        <span class="vertical-middle q-ml-xs">Recent outgoing transactions to this address</span>
                    </div>

                    <TxList type="in" :limit="5" :to-outgoing-address="entry.address" />

                </div>

            </template>

        </div>
    </q-modal-layout>


</q-modal>
</template>

<script>
import { mapState } from "vuex"
const { clipboard } = require("electron")
import Identicon from "components/identicon"
import AddressHeader from "components/address_header"
import TxList from "components/tx_list"
import { payment_id, address } from "src/validators/common"
import { required } from "vuelidate/lib/validators"
export default {
    name: "AddressBookDetails",
    data () {
        return {
            isVisible: false,
            entry: null,
            mode: "view",
            newEntry: {
                index: false,
                address: "",
                payment_id: "",
                name: "",
                description: "",
                starred: false
            }
        }
    },
    computed: mapState({
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        }
    }),
    validations: {
        newEntry: {
            address: { required, address },
            payment_id: { payment_id }
        }
    },
    methods: {
        save () {
            this.$v.newEntry.$touch()

            if (this.$v.newEntry.address.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Address not valid"
                })
                return
            }

            if (this.$v.newEntry.payment_id.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Payment id not valid"
                })
                return
            }

            this.$gateway.send("wallet", "add_address_book", this.newEntry)
            this.close()
        },
        deleteEntry () {
            this.$gateway.send("wallet", "delete_address_book", this.newEntry)
            this.close()
        },
        sendToAddress () {

        },
        copyAddress () {
            clipboard.writeText(this.entry.address)
            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Address copied to clipboard"
            })
        },
        edit () {
            this.mode = "edit"
            this.newEntry = this.entry
        },
        cancelEdit () {
            this.mode = "view"
            this.$v.$reset();
            this.newEntry = {
                index: false,
                address: "",
                payment_id: "",
                name: "",
                description: "",
                starred: false
            }
        },
        close () {
            this.isVisible = false
            this.$v.$reset();
            this.newEntry = {
                index: false,
                address: "",
                payment_id: "",
                name: "",
                description: "",
                starred: false
            }
        }
    },

    components: {
        AddressHeader,
        Identicon,
        TxList
    }
}
</script>

<style lang="scss">
.address-book-details {

    .q-field {
        margin: 0 10px 20px;
    }
    .q-checkbox.star-entry .q-checkbox-icon {
        font-size:40px;
        margin-left: 10px;
    }
}
</style>
