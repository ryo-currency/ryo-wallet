<template>
<q-page>

    <div class="row q-pt-sm q-mx-md q-mb-sm items-center non-selectable">

        <div class="col-5">
            <q-icon name="history" size="24px" /> Transaction history
        </div>

        <div class="col-5 q-px-sm">
            <q-input v-model="tx_txid"
                     stack-label="Filter by txid"
                     :dark="theme=='dark'"
                     />
        </div>

        <div class="col-2">
            <q-select :dark="theme=='dark'"
                      v-model="tx_type"
                      float-label="Filter by transaction type"
                      :options="tx_type_options"
                      />
        </div>

    </div>
    <TxList :type="tx_type" :txid="tx_txid" />
</q-page>
</template>

<script>
import { mapState } from "vuex"
import TxList from "components/tx_list"
export default {
    data () {
        return {
            tx_type: "all",
            tx_txid: "",
            tx_type_options: [
                {label: "All", value: "all"},
                {label: "Incoming", value: "in"},
                {label: "Outgoing", value: "out"},
                {label: "Pending incoming", value: "pool"},
                {label: "Pending outgoing", value: "pending"},
                {label: "Failed", value: "failed"},
            ]

        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        tx_list: state => state.gateway.wallet.transactions.tx_list
    }),

    components: {
        TxList
    }

}
</script>

<style lang="scss">
</style>
