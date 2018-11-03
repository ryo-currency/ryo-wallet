<template>
<q-page padding>

    <AddressHeader :address="info.address" :title="info.name" />

    <template v-if="secret.mnemonic">
        <h6 class="q-mb-xs q-mt-lg">Seed words</h6>
        <div class="row">
            <div class="col">
                {{ secret.mnemonic }}
            </div>
            <div class="q-item-side">
                <q-btn
                    color="primary" style="width:25px;"
                    size="sm" icon="file_copy"
                    @click="copyPrivateKey('mnemonic', $event)">
                    <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                        Copy seed words
                    </q-tooltip>
                </q-btn>
            </div>
        </div>
    </template>

    <template v-if="secret.view_key != secret.spend_key">
        <h6 class="q-mb-xs">View key</h6>
        <div class="row">
            <div class="col" style="word-break:break-all;">
                {{ secret.view_key }}
            </div>
            <div class="q-item-side">
                <q-btn
                    color="primary" style="width:25px;"
                    size="sm" icon="file_copy"
                    @click="copyPrivateKey('view_key', $event)">
                    <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                        Copy view key
                    </q-tooltip>
                </q-btn>
            </div>
        </div>
    </template>

    <template v-if="!/^0*$/.test(secret.spend_key)">
        <h6 class="q-mb-xs">Spend key</h6>
        <div class="row">
            <div class="col" style="word-break:break-all;">
                {{ secret.spend_key }}
            </div>
            <div class="q-item-side">
                <q-btn
                    color="primary" style="width:25px;"
                    size="sm" icon="file_copy"
                    @click="copyPrivateKey('spend_key', $event)">
                    <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
                        Copy spend key
                    </q-tooltip>
                </q-btn>
            </div>
        </div>
    </template>

    <q-field>
        <q-btn class="q-mt-lg" color="primary" @click="open" label="Open wallet" />
    </q-field>

</q-page>
</template>

<script>
const { clipboard } = require("electron")
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
        },
        copyPrivateKey (type, event) {
            event.stopPropagation()
            for(let i = 0; i < event.path.length; i++) {
                if(event.path[i].tagName == "BUTTON") {
                    event.path[i].blur()
                    break
                }
            }

            if(this.secret[type] == null) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Error copying private key",
                })
                return
            }

            clipboard.writeText(this.secret[type])
            let type_human = type.substring(0,1).toUpperCase()+type.substring(1).replace("_"," ")

            this.$q.dialog({
                title: "Copy "+type_human,
                message: "Be careful who you send your private keys to as they control your funds.",
                ok: {
                    label: "OK"
                },
            }).then(() => {
                this.$q.notify({
                    type: "positive",
                    timeout: 1000,
                    message: type_human+" copied to clipboard"
                })
            }).catch(() => {
                this.$q.notify({
                    type: "positive",
                    timeout: 1000,
                    message: type_human+" copied to clipboard"
                })
            })
        },
    },
    components: {
        AddressHeader,
    }

}
</script>

<style>
</style>
