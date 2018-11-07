<template>
<q-item class="address-header">
    <q-item-side>
        <Identicon :address="address" :size="12" ref="identicon" />
    </q-item-side>
    <q-item-main class="self-start">
        <q-item-tile label>{{ title }}</q-item-tile>
        <q-item-tile class="monospace break-all" sublabel>{{ address }}</q-item-tile>
        <q-item-tile v-if="payment_id" sublabel>Payment id: {{ payment_id }}</q-item-tile>
        <q-item-tile v-if="extra" sublabel>{{ extra }}</q-item-tile>
    </q-item-main>
    <q-item-side>
        <q-btn
            color="primary" style="width:25px;"
            size="sm" icon="file_copy"
            ref="copy"
            @click="copyAddress">
            <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                Copy address
            </q-tooltip>
        </q-btn>

    </q-item-side>

    <q-context-menu>
        <q-list link separator style="min-width: 150px; max-height: 300px;">
            <q-item v-close-overlay
                    @click.native="copyAddress(address, $event)">
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

<script>
const { clipboard } = require("electron")
import Identicon from "components/identicon"
export default {
    name: "AddressHeader",
    props: {
        title: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        payment_id: {
            type: String,
            required: false
        },
        extra: {
            type: String,
            required: false
        }
    },
    data () {
        return {}
    },
    methods: {
        copyAddress () {
            this.$refs.copy.$el.blur()
            clipboard.writeText(this.address)
            if(this.payment_id) {
                this.$q.dialog({
                    title: "Copy address",
                    message: "There is a payment id associated with this address.\nBe sure to copy the payment id separately.",
                    ok: {
                        label: "OK"
                    },
                }).then(() => {
                    this.$q.notify({
                        type: "positive",
                        timeout: 1000,
                        message: "Address copied to clipboard"
                    })
                }).catch(() => {
                    this.$q.notify({
                        type: "positive",
                        timeout: 1000,
                        message: "Address copied to clipboard"
                    })
                })
            } else {
                this.$q.notify({
                    type: "positive",
                    timeout: 1000,
                    message: "Address copied to clipboard"
                })
            }
        },
    },
    components: {
        Identicon
    }
}
</script>

<style lang="scss">
.address-header {
    padding: 0;
    img {
        float:left;
        margin-right: 15px;
    }
    h3 {
        margin: 15px 0 0;
    }
    p {
        word-break: break-all;
    }
    &::after {
        content: "";
        clear: both;
        display: table;
    }

    .q-item-main {
        .q-item-label {
            font-size:2em;
        }
    }
}
</style>
