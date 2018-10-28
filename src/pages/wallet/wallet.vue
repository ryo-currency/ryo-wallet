<template>
<q-page padding>

    <AddressHeader :address="info.address" :title="info.name" />


    <div class="row justify-between" style="max-width: 768px">

        <div class="infoBox">
            <div class="infoBoxContent">
                <div class="text"><span>Balance</span></div>
                <div class="value"><span><FormatRyo :amount="info.balance" /></span></div>
            </div>
        </div>

        <div class="infoBox">
            <div class="infoBoxContent">
                <div class="text"><span>Unlocked balance</span></div>
                <div class="value"><span><FormatRyo :amount="info.unlocked_balance" /></span></div>
            </div>
        </div>

        <div class="infoBox q-pt-md">

            <q-btn icon-right="more_vert" label="Wallet actions" size="md" flat>
                <q-popover anchor="bottom right" self="top right">
                    <q-list separator link>
                        <q-item :disabled="!is_ready"
                                v-close-overlay @click.native="getPrivateKeys()">
                            <q-item-main>
                                <q-item-tile label>Show Private Keys</q-item-tile>
                            </q-item-main>
                        </q-item>
                        <q-item :disabled="!is_ready"
                                v-close-overlay @click.native="showModal('change_password_modal_show')">
                            <q-item-main>
                                <q-item-tile label>Change Password</q-item-tile>
                            </q-item-main>
                        </q-item>
                        <q-item :disabled="!is_ready"
                                v-close-overlay @click.native="showModal('rescan_modal_show')">
                            <q-item-main>
                                <q-item-tile label>Rescan Wallet</q-item-tile>
                            </q-item-main>
                        </q-item>
                        <q-item :disabled="!is_ready"
                                v-close-overlay @click.native="showModal('key_image_modal_show')">
                            <q-item-main>
                                <q-item-tile label>Manage Key Images</q-item-tile>
                            </q-item-main>
                        </q-item>
                        <q-item :disabled="!is_ready"
                                v-close-overlay @click.native="deleteWallet()">
                            <q-item-main>
                                <q-item-tile label>Delete Wallet</q-item-tile>
                            </q-item-main>
                        </q-item>
                    </q-list>
                </q-popover>

            </q-btn>

        </div>
    </div>


    <h6 class="q-my-none">Recent transactions:</h6>

    <div style="margin: 0 -16px;">

        <TxList :limit="5" />

    </div>

    <q-inner-loading :visible="spinner">
        <q-spinner color="primary" :size="30" />
    </q-inner-loading>

    <q-modal minimized v-model="private_keys_modal_show" @hide="closePrivateKeys()">
        <div class="q-ma-md">

            <template v-if="secret.mnemonic">
                <h6 class="q-mb-xs q-mt-lg">Seed words</h6>
                <p>{{ secret.mnemonic }}</p>
            </template>

            <template v-if="secret.view_key != secret.spend_key">
                <h6 class="q-mb-xs">View key</h6>
                <p>{{ secret.view_key }}</p>
            </template>

            <template v-if="secret.spend_key != '0000000000000000000000000000000000000000000000000000000000000000'">
                <h6 class="q-mb-xs">Spend key</h6>
                <p>{{ secret.spend_key }}</p>
            </template>

            <q-btn
                color="primary"
                @click="private_keys_modal_show = false"
                label="Close"
                />
        </div>
    </q-modal>


    <q-modal minimized v-model="rescan_modal_show">
        <div class="q-ma-md">

            <h4 class="q-mt-lg q-mb-md">Rescan wallet</h4>
            <p>Select full rescan or rescan of spent outputs only.</p>

            <div class="q-mt-lg">
                <q-radio v-model="rescan_type" val="full" label="Rescan full blockchain" />
            </div>
            <div class="q-mt-sm">
                <q-radio v-model="rescan_type" val="spent" label="Rescan spent outputs" />
            </div>

            <div class="q-mt-xl text-right">
                <q-btn
                    flat class="q-mr-sm"
                    @click="rescan_modal_show = false"
                    label="Close"
                    />
                <q-btn
                    color="primary"
                    @click="rescanWallet()"
                    label="Rescan"
                    />
            </div>
        </div>
    </q-modal>

    <q-modal minimized v-model="key_image_modal_show">
        <div class="q-ma-md">

            <h4 class="q-mt-lg q-mb-md">{{key_image_import_export}} key images</h4>

            <div class="row q-mb-md">
                <div class="q-mr-xl"><q-radio v-model="key_image_import_export" val="Export" label="Export" /></div>
                <div><q-radio v-model="key_image_import_export" val="Import" label="Import" /></div>
            </div>

            <template v-if="key_image_import_export == 'Export'">
                <q-field style="width:450px">
                    <div class="row gutter-sm">
                        <div class="col-9">
                            <q-input v-model="key_image_export_path" stack-label="Key image export directory" disable />
                            <input type="file" webkitdirectory directory id="keyImageExportPath" v-on:change="setKeyImageExportPath" ref="keyImageExportSelect" hidden />
                        </div>
                        <div class="col-3">
                            <q-btn class="float-right" v-on:click="selectKeyImageExportPath">Browse</q-btn>
                        </div>
                    </div>
                </q-field>
            </template>
            <template v-if="key_image_import_export == 'Import'">
                <q-field style="width:450px">
                    <div class="row gutter-sm">
                        <div class="col-9">
                            <q-input v-model="key_image_import_path" stack-label="Key image import file" disable />
                            <input type="file" id="keyImageImportPath" v-on:change="setKeyImageImportPath" ref="keyImageImportSelect" hidden />
                        </div>
                        <div class="col-3">
                            <q-btn class="float-right" v-on:click="selectKeyImageImportPath">Browse</q-btn>
                        </div>
                    </div>
                </q-field>
            </template>

            <div class="q-mt-xl text-right">
                <q-btn
                    flat class="q-mr-sm"
                    @click="key_image_modal_show = false"
                    label="Close"
                    />
                <q-btn
                    color="primary"
                    @click="doKeyImages()"
                    :label="this.key_image_import_export"
                    />
            </div>
        </div>
    </q-modal>

    <q-modal minimized v-model="change_password_modal_show" @hide="clearChangePassword()">
        <div class="q-ma-md">

            <h4 class="q-mt-lg q-mb-md">Change password</h4>

            <q-field>
                <q-input v-model="change_password_password_old" type="password" float-label="Old Password" :dark="theme=='dark'" />
            </q-field>

            <q-field>
                <q-input v-model="change_password_password_new" type="password" float-label="New Password" :dark="theme=='dark'" />
            </q-field>

            <q-field>
                <q-input v-model="change_password_password_confirm" type="password" float-label="Confirm New Password" :dark="theme=='dark'" />
            </q-field>

            <div class="q-mt-xl text-right">
                <q-btn
                    flat class="q-mr-sm"
                    @click="change_password_modal_show = false"
                    label="Close"
                    />
                <q-btn
                    color="primary"
                    @click="doChangePassword()"
                    label="Change"
                    />
            </div>
        </div>
    </q-modal>

</q-page>
</template>

<script>
import { mapState } from "vuex"
import AddressHeader from "components/address_header"
import FormatRyo from "components/format_ryo"
import TxList from "components/tx_list"
export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        info: state => state.gateway.wallet.info,
        secret: state => state.gateway.wallet.secret,
        data_dir: state => state.gateway.app.config.app.data_dir,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        }
    }),
    data () {
        return {
            spinner: false,
            private_keys_modal_show: false,
            rescan_modal_show: false,
            rescan_type: "full",
            key_image_modal_show: false,
            key_image_import_export: "Export",
            key_image_export_path: '',
            key_image_import_path: '',
            change_password_modal_show: false,
            change_password_password_old: "",
            change_password_password_new: "",
            change_password_password_confirm: "",
        }
    },
    mounted() {
        const path = require("path")
        this.key_image_export_path = path.join(this.data_dir, "gui")
        this.key_image_import_path = path.join(this.data_dir, "gui", "key_image_export")
    },
    watch: {
        secret: {
            handler(val, old) {
                if(val.view_key == old.view_key) return
                this.spinner = false
                switch(this.secret.view_key) {
                    case "":
                        break
                    case -1:
                        this.$q.notify({
                            type: "negative",
                            timeout: 1000,
                            message: this.secret.mnemonic
                        })
                        this.$store.commit("gateway/set_wallet_data", {
                            secret: {
                                mnemonic: "",
                                spend_key: "",
                                view_key: ""
                            }
                        })
                        break
                    default:
                        this.private_keys_modal_show = true
                        break
                }
            },
            deep: true
        }
    },
    methods: {
        showModal (which) {
            if(!this.is_ready) return
            this[which] = true;
        },
        getPrivateKeys () {
            if(!this.is_ready) return
            this.$q.dialog({
                title: "Show seed words",
                message: "Enter wallet password to continue.",
                prompt: {
                    model: "",
                    type: "password"
                },
                ok: {
                    label: "SHOW"
                },
                cancel: {
                    flat: true,
                    label: "CANCEL",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(password => {
                //this.spinner = true
                this.$gateway.send("wallet", "get_private_keys", {password})
            }).catch(() => {
            })
        },
        closePrivateKeys () {
            this.private_keys_modal_show = false
            setTimeout(() => {
                this.$store.commit("gateway/set_wallet_data", {
                    secret: {
                        mnemonic: "",
                        spend_key: "",
                        view_key: ""
                    }
                })
            }, 500)
        },
        rescanWallet () {
            this.rescan_modal_show = false
            if(this.rescan_type == "full") {
                this.$gateway.send("wallet", "rescan_blockchain")
            } else {
                this.$gateway.send("wallet", "rescan_spent")
            }
        },
        selectKeyImageExportPath () {
            this.$refs.keyImageExportSelect.click()
        },
        setKeyImageExportPath (file) {
            this.key_image_export_path = file.target.files[0].path
        },
        selectKeyImageImportPath () {
            this.$refs.keyImageImportSelect.click()
        },
        setKeyImageImportPath (file) {
            this.key_image_import_path = file.target.files[0].path
        },
        doChangePassword () {

            let old_password = this.change_password_password_old
            let new_password = this.change_password_password_new
            let new_password_confirm = this.change_password_password_confirm

            if(new_password != new_password_confirm) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "New passwords do not match"
                })
            } else {
                this.change_password_modal_show = false
                this.$gateway.send("wallet", "change_wallet_password", {old_password, new_password})
            }

        },
        clearChangePassword () {
            this.change_password_password_old = ""
            this.change_password_password_new = ""
            this.change_password_password_confirm = ""
        },
        doKeyImages () {
            this.key_image_modal_show = false

            this.$q.dialog({
                title: this.key_image_import_export + " key images",
                message: "Enter wallet password to continue.",
                prompt: {
                    model: "",
                    type: "password"
                },
                ok: {
                    label: this.key_image_import_export
                },
                cancel: {
                    flat: true,
                    label: "CANCEL",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(password => {
                if(this.key_image_import_export == "Export")
                    this.$gateway.send("wallet", "export_key_images", {password: password, path: this.key_image_export_path})
                else if(this.key_image_import_export == "Import")
                    this.$gateway.send("wallet", "import_key_images", {password: password, path: this.key_image_import_path})
            }).catch(() => {
            })

        },
        deleteWallet () {
            this.$q.dialog({
                title: "Delete wallet",
                message: "Are you absolutely sure you want to delete your wallet?\nMake sure you have your private keys backed up.\nTHIS PROCESS IS NOT REVERSIBLE!",
                ok: {
                    label: "DELETE",
                    color: "red"
                },
                cancel: {
                    flat: true,
                    label: "CANCEL",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(() => {
                this.$q.dialog({
                    title: "Delete wallet",
                    message: "Enter wallet password to continue.",
                    prompt: {
                        model: "",
                        type: "password"
                    },
                    ok: {
                        label: "DELETE",
                        color: "red"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: this.theme=="dark"?"white":"dark"
                    }
                }).then(password => {
                    this.$gateway.send("wallet", "delete_wallet", {password})
                }).catch(() => {
                })
            }).catch(() => {
            })
        }
    },
    components: {
        FormatRyo,
        AddressHeader,
        TxList
    },
}
</script>

<style lang="scss">
.layout-padding {
    padding: 15px 16px !important;
}
</style>
