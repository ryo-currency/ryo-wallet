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
                <Identicon :address="address.address" />
            </q-item-side>
            <q-item-main>
                <q-item-tile class="monospace ellipsis" label>{{ address.address }}</q-item-tile>
                <q-item-tile sublabel>Primary address</q-item-tile>
            </q-item-main>
        </q-item>

        <template v-if="address_list.used.length">
            <q-list-header>My used addresses</q-list-header>
            <q-item v-for="(address, index) in address_list.used" @click.native="details(address)">
                <q-item-side>
                    <Identicon :address="address.address" />
                </q-item-side>
                <q-item-main>
                    <q-item-tile class="monospace ellipsis" label>{{ address.address }}</q-item-tile>
                    <q-item-tile sublabel>Sub-address (Index {{ address.address_index }})</q-item-tile>
                </q-item-main>
            </q-item>
        </template>


        <template v-if="address_list.unused.length">
            <q-list-header>My unused addresses</q-list-header>
            <q-item v-for="(address, index) in address_list.unused" @click.native="details(address)">
                <q-item-side>
                    <Identicon :address="address.address" />
                </q-item-side>
                <q-item-main>
                    <q-item-tile class="monospace ellipsis" label>{{ address.address }}</q-item-tile>
                    <q-item-tile sublabel>Sub-address (Index {{ address.address_index }})</q-item-tile>
                </q-item-main>
            </q-item>
        </template>

    </q-list>
    <AddressDetails ref="addressDetails" />
</q-page>
</template>

<style>
</style>

<script>
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
        }
    },
    components: {
        Identicon,
        AddressDetails,
    }
}
</script>
