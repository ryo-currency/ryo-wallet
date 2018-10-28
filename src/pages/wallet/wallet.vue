<template>
<q-page padding>

    <AddressHeader :address="info.address" :title="info.name" />

    <div class="row">

        <div style="width: 290px">
            <div class="infoBox">
                <div class="infoBoxContent">
                    <div class="text"><span>Balance</span></div>
                    <div class="value"><span><FormatRyo :amount="info.balance" /></span></div>
                </div>
            </div>
        </div>

        <div>
            <div class="infoBox">
                <div class="infoBoxContent">
                    <div class="text"><span>Unlocked balance</span></div>
                    <div class="value"><span><FormatRyo :amount="info.unlocked_balance" /></span></div>
                </div>
            </div>
        </div>

        <div class="col text-right q-mr-sm">
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
                                    v-close-overlay @click.native="showModal('change_password')">
                                <q-item-main>
                                    <q-item-tile label>Change Password</q-item-tile>
                                </q-item-main>
                            </q-item>
                            <q-item :disabled="!is_ready"
                                    v-close-overlay @click.native="showModal('rescan')">
                                <q-item-main>
                                    <q-item-tile label>Rescan Wallet</q-item-tile>
                                </q-item-main>
                            </q-item>
                            <q-item :disabled="!is_ready"
                                    v-close-overlay @click.native="showModal('key_image')">
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

    </div>

    <h6 class="q-my-none">Recent transactions:</h6>

    <div style="margin: 0 -16px;">
        <TxList :limit="5" />
    </div>

    <q-modal minimized v-model="modals.private_keys.visible" @hide="closePrivateKeys()">
        <div class="modal-header">Show private keys</div>
        <div class="q-ma-lg">

            <template v-if="secret.mnemonic">
                <h6 class="q-mb-xs q-mt-lg">Seed words</h6>
                <p>{{ secret.mnemonic }}</p>
            </template>

            <template v-if="secret.view_key != secret.spend_key">
                <h6 class="q-mb-xs">View key</h6>
                <p>{{ secret.view_key }}</p>
            </template>

            <template v-if="!/^0*$/.test(secret.spend_key)">
                <h6 class="q-mb-xs">Spend key</h6>
                <p>{{ secret.spend_key }}</p>
            </template>

            <q-btn
                color="primary"
                @click="hideModal('private_keys')"
                label="Close"
                />
        </div>
    </q-modal>


    <q-modal minimized v-model="modals.rescan.visible">
        <div class="modal-header">Rescan wallet</div>
        <div class="q-ma-lg">
            <p>Select full rescan or rescan of spent outputs only.</p>

            <div class="q-mt-lg">
                <q-radio v-model="modals.rescan.type" val="full" label="Rescan full blockchain" />
            </div>
            <div class="q-mt-sm">
                <q-radio v-model="modals.rescan.type" val="spent" label="Rescan spent outputs" />
            </div>

            <div class="q-mt-xl text-right">
                <q-btn
                    flat class="q-mr-sm"
                    @click="hideModal('rescan')"
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

    <q-modal minimized v-model="modals.key_image.visible">
        <div class="modal-header">{{modals.key_image.type}} key images</div>
        <div class="q-ma-lg">
            <div class="row q-mb-md">
                <div class="q-mr-xl">
                    <q-radio v-model="modals.key_image.type" val="Export" label="Export" />
                </div>
                <div>
                    <q-radio v-model="modals.key_image.type" val="Import" label="Import" />
                </div>
            </div>

            <template v-if="modals.key_image.type == 'Export'">
                <q-field style="width:450px">
                    <div class="row gutter-sm">
                        <div class="col-9">
                            <q-input v-model="modals.key_image.export_path" stack-label="Key image export directory" disable />
                            <input type="file" webkitdirectory directory id="keyImageExportPath" v-on:change="setKeyImageExportPath" ref="keyImageExportSelect" hidden />
                        </div>
                        <div class="col-3">
                            <q-btn class="float-right" v-on:click="selectKeyImageExportPath">Browse</q-btn>
                        </div>
                    </div>
                </q-field>
            </template>
            <template v-if="modals.key_image.type == 'Import'">
                <q-field style="width:450px">
                    <div class="row gutter-sm">
                        <div class="col-9">
                            <q-input v-model="modals.key_image.import_path" stack-label="Key image import file" disable />
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
                    @click="hideModal('key_image')"
                    label="Close"
                    />
                <q-btn
                    color="primary"
                    @click="doKeyImages()"
                    :label="modals.key_image.type"
                    />
            </div>
        </div>
    </q-modal>

    <q-modal minimized v-model="modals.change_password.visible" @hide="clearChangePassword()">
        <div class="modal-header">Change password</div>
        <div class="q-ma-lg">
            <q-field>
                <q-input v-model="modals.change_password.old_password" type="password" float-label="Old Password" :dark="theme=='dark'" />
            </q-field>

            <q-field>
                <q-input v-model="modals.change_password.new_password" type="password" float-label="New Password" :dark="theme=='dark'" />
            </q-field>

            <q-field>
                <q-input v-model="modals.change_password.new_password_confirm" type="password" float-label="Confirm New Password" :dark="theme=='dark'" />
            </q-field>

            <div class="q-mt-xl text-right">
                <q-btn
                    flat class="q-mr-sm"
                    @click="hideModal('change_password')"
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
            modals: {
                private_keys: {
                    visible: false,
                },
                rescan: {
                    visible: false,
                    type: "full",
                },
                key_image: {
                    visible: false,
                    type: "Export",
                    export_path: "",
                    import_path: "",
                },
                change_password: {
                    visible: false,
                    old_password: "",
                    new_password: "",
                    new_password_confirm: "",
                },
            }
        }
    },
    mounted() {
        const path = require("path")
        this.modals.key_image.export_path = path.join(this.data_dir, "gui")
        this.modals.key_image.import_path = path.join(this.data_dir, "gui", "key_image_export")
    },
    watch: {
        secret: {
            handler(val, old) {
                if(val.view_key == old.view_key) return
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
                        this.showModal("private_keys")
                        break
                }
            },
            deep: true
        }
    },
    methods: {
        showModal (which) {
            if(!this.is_ready) return
            this.modals[which].visible = true
        },
        hideModal (which) {
            this.modals[which].visible = false
        },
        getPrivateKeys () {
            if(!this.is_ready) return
            this.$q.dialog({
                title: "Show private keys",
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
                this.$gateway.send("wallet", "get_private_keys", {password})
            }).catch(() => {
            })
        },
        closePrivateKeys () {
            this.hideModal("private_keys")
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
            this.hideModal("rescan")
            if(this.modals.rescan.type == "full") {
                this.$q.dialog({
                    title: "Rescan wallet",
                    message: "Warning: Some information about previous transactions\nsuch as the recipient's address will be lost.",
                    ok: {
                        label: "RESCAN"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: this.theme=="dark"?"white":"dark"
                    }
                }).then(password => {
                    this.$gateway.send("wallet", "rescan_blockchain")
                }).catch(() => {
                })
            } else {
                this.$gateway.send("wallet", "rescan_spent")
            }
        },
        selectKeyImageExportPath () {
            this.$refs.keyImageExportSelect.click()
        },
        setKeyImageExportPath (file) {
            this.modals.key_image.export_path = file.target.files[0].path
        },
        selectKeyImageImportPath () {
            this.$refs.keyImageImportSelect.click()
        },
        setKeyImageImportPath (file) {
            this.modals.key_image.import_path = file.target.files[0].path
        },
        doKeyImages () {
            this.hideModal("key_image")

            this.$q.dialog({
                title: this.modals.key_image.type + " key images",
                message: "Enter wallet password to continue.",
                prompt: {
                    model: "",
                    type: "password"
                },
                ok: {
                    label: this.modals.key_image.type
                },
                cancel: {
                    flat: true,
                    label: "CANCEL",
                    color: this.theme=="dark"?"white":"dark"
                }
            }).then(password => {
                if(this.modals.key_image.type == "Export")
                    this.$gateway.send("wallet", "export_key_images", {password: password, path: this.modals.key_image.export_path})
                else if(this.modals.key_image.type == "Import")
                    this.$gateway.send("wallet", "import_key_images", {password: password, path: this.modals.key_image.import_path})
            }).catch(() => {
            })

        },
        doChangePassword () {

            let old_password = this.modals.change_password.old_password
            let new_password = this.modals.change_password.new_password
            let new_password_confirm = this.modals.change_password.new_password_confirm

            if(new_password != new_password_confirm) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "New passwords do not match"
                })
            } else {
                this.hideModal("change_password")
                this.$gateway.send("wallet", "change_wallet_password", {old_password, new_password})
            }

        },
        clearChangePassword () {
            this.modals.change_password.old_password = ""
            this.modals.change_password.new_password = ""
            this.modals.change_password.new_password_confirm = ""
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
