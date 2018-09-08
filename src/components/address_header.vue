<template>
<q-item class="address-header">
    <q-item-side>
        <Identicon :address="address" :size="12" />
    </q-item-side>
    <q-item-main class="self-start">
        <q-item-tile label>{{ header }}</q-item-tile>
        <q-item-tile class="monospace break-all" sublabel>{{ subheader }}</q-item-tile>
        <q-item-tile v-if="extra" sublabel>{{ extra }}</q-item-tile>
        <q-item-tile v-if="extra2" sublabel>{{ extra2 }}</q-item-tile>
    </q-item-main>
</q-item>
</template>

<script>
import Identicon from "components/identicon"
export default {
    name: "AddressHeader",
    props: {
        address: {
            type: String,
            required: true
        },
        header: {
            type: String,
            required: true
        },
        subheader: {
            type: String,
            required: true
        },
        extra: {
            type: String,
            required: false
        },
        extra2: {
            type: String,
            required: false
        }
    },
    data () {
        return {}
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
