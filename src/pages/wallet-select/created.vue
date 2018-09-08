<template>
<q-page padding>

    <AddressHeader :address="info.address" :header="info.name" :subheader="info.address" />


    <h6 class="q-mb-xs">Seed words</h6>
    <p>{{ secret.mnemonic }}</p>

    <template v-if="secret.view_key != secret.spend_key">
        <h6 class="q-mb-xs">View key</h6>
        <p>{{ secret.view_key }}</p>
    </template>

    <h6 class="q-mb-xs">Spend key</h6>
    <p>{{ secret.spend_key }}</p>

    <q-btn class="q-mt-lg" color="primary" @click="open" label="Open wallet" />

</q-page>
</template>

<script>
import { mapState } from "vuex"
import AddressHeader from "components/address_header"
export default {
    computed: mapState({
        info: state => state.gateway.wallet.info,
        secret: state => state.gateway.wallet.secret,
    }),
    methods: {
        open() {
            setTimeout(() => {
                this.$store.commit("gateway/set_wallet_data", {
                    secret: {
                        mnemonic: "",
                        spend_key: "",
                        view_key: ""
                    }
                })
            }, 500)
            this.$router.replace({ path: "/wallet" });
        }
    },
    components: {
        AddressHeader,
    }

}
</script>

<style>
</style>
