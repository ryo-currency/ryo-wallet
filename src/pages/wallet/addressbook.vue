<template>
<q-page>

    <div class="row q-pt-sm q-mx-md q-mb-none items-center non-selectable" style="height: 44px;">

        <div class="col-8">
            <q-icon name="person" size="24px" /> Address book
        </div>

        <div class="col-4">
        </div>

    </div>

    <template v-if="address_book_starred.length || address_book.length">
    <q-list link no-border>

        <q-item v-for="(entry, index) in address_book_starred" @click.native="details(entry)">
            <q-item-side>
                <Identicon :address="entry.address" />
            </q-item-side>
            <q-item-main>
                <q-item-tile class="monospace ellipsis" label>{{ entry.address }}</q-item-tile>
                <q-item-tile sublabel>{{ entry.name }}</q-item-tile>
            </q-item-main>
            <q-item-side class="self-start">
                <q-icon size="24px" name="star" />
            </q-item-side>
        </q-item>
        <q-item v-for="(entry, index) in address_book" @click.native="details(entry)">
            <q-item-side>
                <Identicon :address="entry.address" />
            </q-item-side>
            <q-item-main>
                <q-item-tile class="monospace ellipsis" label>{{ entry.address }}</q-item-tile>
                <q-item-tile sublabel>{{ entry.name }}</q-item-tile>
            </q-item-main>
            <q-item-side class="self-start">
                <q-icon size="24px" name="star_border" />
            </q-item-side>
        </q-item>
    </q-list>
    </template>
    <template v-else>
        <p class="q-ma-md">Address book is empty</p>
    </template>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
             :disable="!is_ready"
             round
             color="primary"
             @click="addEntry"
             icon="add"
             />
    </q-page-sticky>
    <AddressBookDetails ref="addressBookDetails" />

</q-page>
</template>

<script>
import { mapState } from "vuex"
import Identicon from "components/identicon"
import AddressBookDetails from "components/address_book_details"
export default {
    computed: mapState({
        address_book: state => state.gateway.wallet.address_list.address_book,
        address_book_starred: state => state.gateway.wallet.address_list.address_book_starred,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        }
    }),
    methods: {
        details: function (entry) {
            this.$refs.addressBookDetails.entry = entry
            this.$refs.addressBookDetails.mode = "view"
            this.$refs.addressBookDetails.isVisible = true
        },
        addEntry: function () {
            this.$refs.addressBookDetails.entry = null
            this.$refs.addressBookDetails.mode = "new"
            this.$refs.addressBookDetails.isVisible = true
        }
    },
    components: {
        Identicon,
        AddressBookDetails
    }
}
</script>

<style>
</style>
