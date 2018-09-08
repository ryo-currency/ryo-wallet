<template>
<q-page>

    <div class="row q-pt-sm q-mx-md q-mb-sm items-center non-selectable">

        <div class="col-8">
            <q-icon name="history" size="24px" /> Transaction history
        </div>

        <div class="col-4">
            <q-select
                 v-model="tx_type"
                 float-label="Filter by transaction type"
                 :options="tx_type_options"
                 />
        </div>

    </div>
    <TxList :type="tx_type" />
</q-page>
</template>

<script>
import { mapState } from "vuex"
import TxList from "components/tx_list"
export default {
    data () {
        return {
            tx_type: "all",
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
        tx_list: state => state.gateway.wallet.transactions.tx_list
    }),

    components: {
        TxList
    }

}
</script>

<style lang="scss">
</style>
