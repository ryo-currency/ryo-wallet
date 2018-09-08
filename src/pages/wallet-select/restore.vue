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
            <q-input
                 v-model="wallet.seed"
                 float-label="Mnemonic seed"
                 type="textarea"
                 @blur="$v.wallet.seed.$touch"
                 :error="$v.wallet.seed.$error"
                 />
        </q-field>

        <q-field>
            <q-input v-model="wallet.refresh_start_height" type="number"
                     min="0" float-label="Restore height"
                     @blur="$v.wallet.refresh_start_height.$touch"
                     :error="$v.wallet.refresh_start_height.$error"
                     />
        </q-field>

        <q-field>
            <q-input v-model="wallet.password" type="password" float-label="Password" />
        </q-field>

        <q-field>
            <q-input v-model="wallet.password_confirm" type="password" float-label="Confirm Password" />
        </q-field>

        <q-btn color="primary" @click="restore_wallet" label="Restore wallet" />

    </div>
</q-page>
</template>

<script>
import { required, numeric } from "vuelidate/lib/validators"
import { mapState } from "vuex"
export default {
    data () {
        return {
            wallet: {
                name: "",
                seed: "",
                refresh_start_height: 0,
                password: "",
                password_confirm: ""
            },
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
            name: { required },
            seed: { required },
            refresh_start_height: { numeric }
        }
    },
    methods: {
        restore_wallet() {
            this.$v.wallet.$touch()

            if (this.$v.wallet.name.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Enter a wallet name"
                })
                return
            }
            if (this.$v.wallet.seed.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Enter seed words"
                })
                return
            }

            let seed = this.wallet.seed.trim().replace(/\s{2,}/g, " ").split(" ")
            if(seed.length !== 14 && seed.length !== 24 && seed.length !== 25 && seed.length !== 26) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Invalid seed word length"
                })
                return
            }

            if (this.$v.wallet.refresh_start_height.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Invalid restore height"
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

            this.$gateway.send("wallet", "restore_wallet", this.wallet);
        },
        cancel() {
            this.$router.replace({ path: "/wallet-select" });
        }
    }
}
</script>

<style>
</style>
