<template>
<q-page>
    <div class="q-mx-md">

        <q-field class="q-mt-none">
            <q-input
                 v-model="wallet.name"
                 float-label="New wallet name"
                 @blur="$v.wallet.name.$touch"
                 :error="$v.wallet.name.$error"
                 />
        </q-field>

        <q-field>
            <div class="row gutter-sm">
                <div class="col-8">
                    <q-input v-model="wallet.path" stack-label="Wallet file" disable />
                    <input type="file" id="walletPath" v-on:change="setWalletPath" ref="fileInput" hidden />
                </div>
                <div class="col-4">
                    <q-btn v-on:click="selectFile">Select wallet file</q-btn>
                </div>
            </div>
        </q-field>

        <q-field>
            <q-input v-model="wallet.password" type="password" float-label="Password" />
        </q-field>

        <q-field>
            <q-input v-model="wallet.password_confirm" type="password" float-label="Confirm Password" />
        </q-field>

        <q-btn color="primary" @click="import_wallet" label="Import wallet" />

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
                path: "",
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
            name: { required }
        }
    },
    methods: {
        selectFile () {
            this.$refs.fileInput.click()
        },
        setWalletPath (file) {
            this.wallet.path = file.target.files[0].path
        },
        import_wallet() {
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

            this.$gateway.send("wallet", "import_wallet", this.wallet);
        },
        cancel() {
            this.$router.replace({ path: "/wallet-select" });
        }
    }
}
</script>

<style>
</style>
