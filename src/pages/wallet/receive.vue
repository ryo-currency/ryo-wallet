<template>
<q-page>

    <div class="row q-pt-sm q-mx-md q-mb-none items-center non-selectable" style="height: 44px;">

        <div class="col-8">
            <q-icon name="call_received" size="24px" /> Receive Ryo
        </div>

        <div class="col-4">
        </div>

    </div>

    <q-list link no-border :dark="theme=='dark'">

        <q-list-header>My primary address</q-list-header>
        <q-item v-for="(address, index) in address_list.primary" @click.native="details(address)">
            <q-item-side>
                <Identicon :address="address.address" ref="primaryIdenticon" />
            </q-item-side>
            <q-item-main>
                <q-item-tile class="monospace ellipsis" label>{{ address.address }}</q-item-tile>
                <q-item-tile sublabel>Primary address</q-item-tile>
            </q-item-main>
            <q-item-side>
                <q-btn
                    color="primary" style="width:25px;"
                    size="sm" icon="file_copy"
                    @click="copyAddress(address.address, $event)">
                    <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                        Copy address
                    </q-tooltip>
                </q-btn>
            </q-item-side>

            <q-context-menu>
                <q-list link separator style="min-width: 150px; max-height: 300px;">
                    <q-item v-close-overlay
                            @click.native="details(address)">
                        <q-item-main label="Show details" />
                    </q-item>

                    <q-item v-close-overlay
                            @click.native="copyAddress(address.address, $event)">
                        <q-item-main label="Copy address" />
                    </q-item>

                    <q-item v-close-overlay
                            @click.native="$refs.primaryIdenticon[0].saveIdenticon()">
                        <q-item-main label="Save identicon to file" />
                    </q-item>
                </q-list>
            </q-context-menu>

        </q-item>

        <template v-if="address_list.used.length">
            <q-list-header>My used addresses</q-list-header>
            <q-item v-for="(address, index) in address_list.used" @click.native="details(address)">
                <q-item-side>
                    <Identicon :address="address.address" :ref="`${index}-usedIdenticon`" />
                </q-item-side>
                <q-item-main>
                    <q-item-tile class="monospace ellipsis" label>{{ address.address }}</q-item-tile>
                    <q-item-tile sublabel>Sub-address (Index {{ address.address_index }})</q-item-tile>
                </q-item-main>
                <q-item-side>
                    <q-btn
                        color="primary" style="width:25px;"
                        size="sm" icon="file_copy"
                        @click="copyAddress(address.address, $event)">
                        <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                            Copy address
                        </q-tooltip>
                    </q-btn>
                </q-item-side>

                <q-context-menu>
                    <q-list link separator style="min-width: 150px; max-height: 300px;">
                        <q-item v-close-overlay
                                @click.native="details(address)">
                            <q-item-main label="Show details" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="copyAddress(address.address, $event)">
                            <q-item-main label="Copy address" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="$refs[`${index}-usedIdenticon`][0].saveIdenticon()">
                            <q-item-main label="Save identicon to file" />
                        </q-item>
                    </q-list>
                </q-context-menu>

            </q-item>
        </template>


        <template v-if="address_list.unused.length">
            <q-list-header>My unused addresses</q-list-header>
            <q-item v-for="(address, index) in address_list.unused" @click.native="details(address)">
                <q-item-side>
                    <Identicon :address="address.address" :ref="`${index}-unusedIdenticon`" />
                </q-item-side>
                <q-item-main>
                    <q-item-tile class="monospace ellipsis" label>{{ address.address }}</q-item-tile>
                    <q-item-tile sublabel>Sub-address (Index {{ address.address_index }})</q-item-tile>
                </q-item-main>
                <q-item-side>
                    <q-btn
                        color="primary" style="width:25px;"
                        size="sm" icon="file_copy"
                        @click="copyAddress(address.address, $event)">
                        <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                            Copy address
                        </q-tooltip>
                    </q-btn>
                </q-item-side>

                <q-context-menu>
                    <q-list link separator style="min-width: 150px; max-height: 300px;">
                        <q-item v-close-overlay
                                @click.native="details(address)">
                            <q-item-main label="Show details" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="copyAddress(address.address, $event)">
                            <q-item-main label="Copy address" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="$refs[`${index}-unusedIdenticon`][0].saveIdenticon()">
                            <q-item-main label="Save identicon to file" />
                        </q-item>
                    </q-list>
                </q-context-menu>

           </q-item>
        </template>

    </q-list>
    <AddressDetails ref="addressDetails" />
</q-page>
</template>

<style>
</style>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
import Identicon from "components/identicon"
import AddressDetails from "components/address_details"
export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        address_list: state => state.gateway.wallet.address_list
    }),
    methods: {
        details (address) {
            this.$refs.addressDetails.address = address;
            this.$refs.addressDetails.isVisible = true;
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
        AddressDetails,
    }
}
</script>
