<template>
<q-page>
    <div class="q-mx-md">
        <q-field class="q-mt-none">
            <q-input
                v-model="wallet.name"
                float-label="Wallet name"
                @blur="$v.wallet.name.$touch"
                :error="$v.wallet.name.$error"
                :dark="theme=='dark'"
                />
        </q-field>

        <q-field>
            <q-select
                v-model="wallet.language"
                float-label="Seed language"
                :options="languageOptions"
                :dark="theme=='dark'"
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
            <q-input v-model="wallet.password" type="password" float-label="Password" :dark="theme=='dark'" />
        </q-field>

        <q-field>
            <q-input v-model="wallet.password_confirm" type="password" float-label="Confirm Password" :dark="theme=='dark'" />
        </q-field>

        <PasswordStrength :password="wallet.password" ref="password_strength" />

        <q-field>
            <q-btn color="primary" @click="create" label="Create wallet" />
        </q-field>

    </div>

    <WalletLoading ref="loading" />

</q-page>
</template>

<script>
import PasswordStrength from "components/password_strength"
import { required } from "vuelidate/lib/validators"
import { mapState } from "vuex"
import WalletLoading from "components/wallet_loading"
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
        notify_empty_password: state => state.gateway.app.config.preference.notify_empty_password,
        theme: state => state.gateway.app.config.appearance.theme,
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
                        this.$refs.loading.hide()
                        this.$router.replace({ path: "/wallet-select/created" });
                        break;
                    default:
                        this.$refs.loading.hide()
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

            this.warnEmptyPassword()
                .then(options => {
                    if(options.length > 0 && options[0] === true) {
                        // user selected do not show again
                        this.$gateway.send("core", "quick_save_config", {
                            preference: {
                                notify_empty_password: false
                            }
                        })
                    }

                    this.$refs.loading.show()

                    this.$gateway.send("wallet", "create_wallet", this.wallet);

                }).catch(() => {
                })
        },
        cancel() {
            this.$router.replace({ path: "/wallet-select" });
        },
        warnEmptyPassword: function () {
            let message = ""
            if(this.wallet.password == "") {
                message = "Using an empty password will leave your wallet unencrypted on your file system!"
            } else if(this.$refs.password_strength.score < 3) {
                message = "Using an insecure password could allow attackers to brute-force your wallet! Consider using a password with better strength."
            }
            if(this.notify_empty_password && message != "") {
                return this.$q.dialog({
                    title: "Warning",
                    message: message,
                    options: {
                        type: "checkbox",
                        model: [],
                        items: [
                            {label: "Do not show this message again", value: true},
                        ]
                    },
                    ok: {
                        label: "CONTINUE"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: this.theme=="dark"?"white":"dark"
                    }
                })
            } else {
                return new Promise((resolve, reject) => {
                    resolve([])
                })
            }
        }
    },
    components: {
        PasswordStrength,
        WalletLoading
    }
}
</script>

<style>
</style>
