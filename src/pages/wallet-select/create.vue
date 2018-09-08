<template>
<q-page>
    <div class="q-mx-md">
        <q-field class="q-mt-none">
            <q-input
                 v-model="wallet.name"
                 float-label="Wallet name"
                 @blur="$v.wallet.name.$touch"
                 :error="$v.wallet.name.$error"
                 />
        </q-field>

        <q-field>
            <q-select
                 v-model="wallet.language"
                 float-label="Seed language"
                 :options="languageOptions"
                 />
        </q-field>

        <q-field>
            <div class="row gutter-md">
                <div><q-radio v-model="wallet.type" val="long" label="Long address" /></div>
                <div><q-radio v-model="wallet.type" val="kurz" label="Short (kurz) address" /></div>
            </div>
        </q-field>

        <p v-if="wallet.type == 'long'">
            Create both public/private view & spend keys.  Allows creation of view-only wallets.
        </p>
        <p v-if="wallet.type == 'kurz'">
            Create shorter style address with only private view & spend keys. Does NOT support view-only wallets.
        </p>

        <q-field>
            <q-input v-model="wallet.password" type="password" float-label="Password" />
        </q-field>

        <q-field>
            <q-input v-model="wallet.password_confirm" type="password" float-label="Confirm Password" />
        </q-field>

        <q-btn color="primary" @click="create" label="Create wallet" />

    </div>
</q-page>
</template>

<script>
import { required } from "vuelidate/lib/validators"
import { mapState } from "vuex"
export default {
    data () {
        return {
            wallet: {
                name: "",
                language: "English",
                type: "long",
                password: "",
                password_confirm: ""
            },

            languageOptions: [

                {label: "English", value: "English"},
                {label: "Deutsch", value: "Deutsch"},
                {label: "Español", value: "Español"},
                {label: "Français", value: "Français"},
                {label: "Italiano", value: "Italiano"},
                {label: "Nederlands", value: "Nederlands"},
                {label: "Português", value: "Português"},
                {label: "Русский", value: "Русский"},
                {label: "日本語", value: "日本語"},
                {label: "简体中文 (中国)", value: "简体中文 (中国)"},
                {label: "Esperanto", value: "Esperanto"},
                {label: "Lojban", value: "Lojban"}

            ]
        }
    },
    computed: mapState({
        status: state => state.gateway.wallet.status,
    }),
    watch: {
        status: {
            handler(val, old){
                if(val.code == old.code) return
                switch(this.status.code) {
                    case 1:
                        break;
                    case 0:
                        this.$q.loading.hide()
                        this.$router.replace({ path: "/wallet-select/created" });
                        break;
                    default:
                        this.$q.loading.hide()
                        this.$q.notify({
                            type: "negative",
                            timeout: 1000,
                            message: this.status.message
                        })
                        break;
                }
            },
            deep: true
        }
    },
    validations: {
        wallet: {
            name: { required }
        }
    },
    methods: {
        create() {
            this.$v.wallet.$touch()

            if (this.$v.wallet.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Enter a wallet name"
                })
                return
            }
            if(this.wallet.password != this.wallet.password_confirm) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Passwords do not match"
                })
                return
            }

            this.$q.loading.show({
                delay: 0
            })

            this.$gateway.send("wallet", "create_wallet", this.wallet);
        },
        cancel() {
            this.$router.replace({ path: "/wallet-select" });
        }
    }
}
</script>

<style>
</style>
