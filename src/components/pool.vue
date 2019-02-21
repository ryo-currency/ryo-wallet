<template>
<q-modal v-model="isVisible" maximized class="pool-modal">
    <q-modal-layout>
        <q-toolbar slot="header" color="dark" inverted>
            <q-btn flat round dense @click="isVisible = false" icon="reply" />
            <q-toolbar-title shrink>
                Solo Mining
            </q-toolbar-title>

            <div class="row col justify-center">
                <q-btn-toggle
                    v-model="page"
                    toggle-color="primary"
                    size="md"
                    :options="tabs"
                    />
            </div>

        </q-toolbar>

        <div v-if="page=='main'">
            <div class="q-pa-md poolDashboard">
                <div class="row gutter-sm">
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Hashrate</span></div>
                                <div class="value"><span>{{ pool.stats.h.hashrate_5min | hashrate }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Hashrate (1 hour)</span></div>
                                <div class="value"><span>{{ pool.stats.h.hashrate_1hr | hashrate }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Hashrate (6 hours)</span></div>
                                <div class="value"><span>{{ pool.stats.h.hashrate_6hr | hashrate }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Hashrate (24 hours)</span></div>
                                <div class="value"><span>{{ pool.stats.h.hashrate_24hr | hashrate }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row gutter-sm q-mt-xs">
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text">Current Effort<span></span></div>
                                <div class="value">{{ pool.stats.effort | percentage }}<span></span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Average Effort</span></div>
                                <div class="value"><span>{{ pool.stats.averageEffort | percentage }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Blocks Found Every</span></div>
                                <div class="value"><span>{{ pool.stats.blockTime | time }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Blocks Found</span></div>
                                <div class="value"><span>{{ pool.stats.blocksFound | commas }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row gutter-sm q-mt-xs">
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Network Hashrate</span></div>
                                <div class="value"><span>{{ pool.stats.networkHashrate | hashrate }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Network Difficulty</span></div>
                                <div class="value"><span>{{ pool.stats.diff | commas }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Blockchain Height</span></div>
                                <div class="value"><span>{{ pool.stats.height | commas }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="infoBox">
                            <div class="infoBoxContent">
                                <div class="text"><span>Connected Workers</span></div>
                                <div class="value"><span>{{ pool.stats.activeWorkers }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row gutter-sm items-baseline">
                    <div class="col-3">
                        <q-field>
                            <q-checkbox v-model="settings.server.enabled" label="Enable Solo Mining" />
                        </q-field>
                    </div>
                    <div class="col-6">
                        <q-field>
                            <q-checkbox v-model="enableStats" label="Privately Share Hashrate" />
                            <q-btn
                                @click="modals.stats = true"
                                class="q-ml-sm"
                                color="theme=='dark'?'white':'dark'"
                                icon="help"
                                size="sm"
                                dense round flat
                                />
                        </q-field>
                    </div>
                    <div class="col-3">
                        <span>Pool status:</span>
                        <template v-if="pool.status == -1">
                            <span class="stateNegative">
                                Error
                            </span>
                        </template>
                        <template v-else-if="pool.status == 0">
                            <span class="stateNegative">
                                Not ready
                            </span>
                        </template>
                        <template v-else-if="pool.status == 1">
                            <span class="stateWait">
                                Waiting for daemon
                            </span>
                        </template>
                        <template v-else-if="pool.status == 2">
                            <span class="stateOK">
                                Ready
                            </span>
                        </template>
                    </div>
                </div>

                <q-field>
                    <q-select
                        stack-label="Mining Address"
                        v-model="settings.mining.address"
                        :display-value="mining_address_display"
                        :options="mining_address_options"
                        :dark="theme=='dark'"
                        popup-max-height="200px"
                        />
                </q-field>


                <div class="row gutter-sm items-end">
                    <div class="col-8">
                        <q-select
                            stack-label="Bind IP"
                            v-model="settings.server.bindIP"
                            :options="app.network_interfaces"
                            :dark="theme=='dark'"
                            popup-max-height="200px"
                            />
                    </div>
                    <div class="col-4">
                        <q-input
                            float-label="Port"
                            v-model="settings.server.bindPort"
                            type="number" :decimals="0" :step="1" min="1024" max="65535"
                            @blur="$v.settings.server.bindPort.$touch"
                            :error="$v.settings.server.bindPort.$error"
                            :dark="theme=='dark'"
                            />
                    </div>
                </div>

                <div class="row justify-between q-mt-lg">
                    <div class="col-auto">
                        <q-btn color="primary" :disabled="!settings_changed" @click="save()" label="Apply Settings" />
                    </div>

                    <div class="col-auto">
                        <q-btn @click="modals.vardiff = true" icon="timer" label="VarDiff Settings" />
                    </div>
                </div>

            </div>

            <q-modal v-model="modals.stats">
                <div class="modal-header">About privately sharing your hashrate</div>
                <div class="q-ma-lg">
                    <div style="max-width: 650px">
                        <p>When constructing a block to be mined, pools are able to reserve a few bytes for including extra information. Pools normally use this space for adding an "extra nonce" and a unique pool identification string.</p>
                        <p>If this feature is enabled, Atom will add only a single byte to the block, which will allow the network to detect that the block was created by solo mining. From the number of blocks identified in this manner, an estimate of total solo mining hashrate can be calculated.</p>
                        <p>Your individual hashrate, wallet address, IP address, or any other sensitive information will not be shared. The only information shared is that the blocks you mine will be able to be identified as mined by Atom. All communication is done through the blockchain and you will not send any information to a central server.<p>
                        <p>If this feature is disabled, Atom will construct blocks in the same way as most public pools, and will not be able to be identified as a solo mined block.</p>

                    </div>
                    <q-field>
                        <q-checkbox v-model="enableStats" label="Privately Share Hashrate" />
                    </q-field>

                    <div class="q-mt-lg">
                        <q-btn
                            color="primary"
                            @click="modals.stats = false"
                            label="OK"
                            />
                    </div>
                </div>
            </q-modal>

            <q-modal v-model="modals.vardiff">
                <div class="modal-header">Variable difficulty settings (advanced)</div>
                <div class="q-mx-lg q-mb-lg q-mt-md">
                    <div style="max-width: 650px">

                        <p>Control the difficulty of work sent to your miners. The default settings will work for all miners, but advanced users may tweak settings specifically for their mining rigs. Changing difficulty settings have no effect on how often you will find blocks.</p>

                        <p>You can override these settings on a per-miner basis by setting a fixed difficulty for that worker. To use a fixed difficulty, enter "<code>diff{{ settings.varDiff.fixedDiffSeparator }}10000</code>" into the mining address or login field of your mining program. The above example will set a fixed difficulty of 10000.</p>

                        <q-field>
                            <q-input
                                v-model="settings.varDiff.startDiff"
                                float-label="Starting Difficulty"
                                type="number" :decimals="0" :step="1" min="1000" max="100000000"
                                :dark="theme=='dark'"
                                @blur="$v.settings.varDiff.startDiff.$touch"
                                :error="$v.settings.varDiff.startDiff.$error"
                                />
                        </q-field>

                        <q-field>
                            <q-checkbox v-model="settings.varDiff.enabled" label="Enable Variable Difficulty" />
                        </q-field>

                        <div class="row gutter-x-sm q-mt-none">
                            <div class="col q-pt-none">
                                <q-input
                                    v-model="settings.varDiff.minDiff"
                                    float-label="Minimum Difficulty"
                                    type="number" :decimals="0" :step="1" min="1000" max="100000000"
                                    :disable="!settings.varDiff.enabled"
                                    @blur="$v.settings.varDiff.minDiff.$touch"
                                    :error="$v.settings.varDiff.minDiff.$error"
                                    :dark="theme=='dark'"
                                    />
                            </div>
                            <div class="col q-pt-none">
                                <q-input
                                    v-model="settings.varDiff.maxDiff"
                                    float-label="Maximum Difficulty"
                                    type="number" :decimals="0" :step="1" min="1000" max="100000000"
                                    :disable="!settings.varDiff.enabled"
                                    @blur="$v.settings.varDiff.maxDiff.$touch"
                                    :error="$v.settings.varDiff.maxDiff.$error"
                                    :dark="theme=='dark'"
                                    />
                            </div>
                            <div class="col q-pt-none">
                                <q-input
                                    v-model="settings.varDiff.variancePercent"
                                    float-label="Allowed Variance"
                                    suffix="%"
                                    type="number" :decimals="0" :step="1" min="20" max="80"
                                    :disable="!settings.varDiff.enabled"
                                    @blur="$v.settings.varDiff.variancePercent.$touch"
                                    :error="$v.settings.varDiff.variancePercent.$error"
                                    :dark="theme=='dark'"
                                    />
                            </div>
                        </div>

                        <div class="row gutter-sm q-mt-none">
                            <div class="col q-pt-none">
                                <q-input
                                    v-model="settings.varDiff.targetTime"
                                    float-label="Share Target Time"
                                    suffix="seconds"
                                    type="number" :decimals="0" :step="1" min="15" max="600"
                                    :disable="!settings.varDiff.enabled"
                                    @blur="$v.settings.varDiff.targetTime.$touch"
                                    :error="$v.settings.varDiff.targetTime.$error"
                                    :dark="theme=='dark'"
                                    />
                            </div>
                            <div class="col q-pt-none">
                                <q-input
                                    v-model="settings.varDiff.retargetTime"
                                    float-label="Adjustment Interval"
                                    suffix="seconds"
                                    type="number" :decimals="0" :step="1" min="30" max="1200"
                                    :disable="!settings.varDiff.enabled"
                                    @blur="$v.settings.varDiff.retargetTime.$touch"
                                    :error="$v.settings.varDiff.retargetTime.$error"
                                    :dark="theme=='dark'"
                                    />
                            </div>
                            <div class="col q-pt-none">
                                <q-input
                                    v-model="settings.varDiff.maxJump"
                                    float-label="Maximum Adjustment"
                                    suffix="%"
                                    type="number" :decimals="0" :step="1" min="20" max="200"
                                    :disable="!settings.varDiff.enabled"
                                    @blur="$v.settings.varDiff.maxJump.$touch"
                                    :error="$v.settings.varDiff.maxJump.$error"
                                    :dark="theme=='dark'"
                                    />
                            </div>
                        </div>

                    </div>

                    <div class="row justify-between q-mt-lg">
                        <div class="col-auto">
                            <q-btn
                                color="primary"
                                @click="modals.vardiff = false"
                                label="OK"
                                />
                        </div>
                        <div class="col-auto">
                            <q-btn @click="resetVarDiff()" label="Reset Defaults" />
                        </div>
                    </div>

                </div>
            </q-modal>

        </div>

        <div v-if="page=='workers'">
            <div class="q-pa-md poolWorkers">

                <hashrate-chart :chart-data="hashrate_data"></hashrate-chart>

                <h6 class="text-weight-light q-mt-xs q-mb-md">Workers</h6>
                <q-table
                    table-style="overflow-y:hidden"
                    color="primary"
                    row-key="miner"
                    :data="workers"
                    :columns="cols_workers"
                    :visible-columns="cols_workers_visible"
                    selection="multiple"
                    :selected.sync="selected_workers"
                    :dark="theme=='dark'"
                    :rows-per-page-options="[0]"
                    :pagination.sync="pagination_workers"
                    hide-bottom dense
                    >
                    <q-tr slot="body" slot-scope="props" :props="props" @click.native="props.selected=!props.selected" class="cursor-pointer">
                        <q-td auto-width>
                            <q-checkbox color="primary" v-model="props.selected" />
                        </q-td>
                        <q-td v-for="col in props.cols" :key="col.name" :props="props">
                            {{ col.value }}
                        </q-td>
                    </q-tr>
                </q-table>

                <div class="q-pa-sm q-mt-sm text-weight-light" v-if="workers.length == 0">
                    No workers connected
                </div>

                <h6 class="text-weight-light q-mb-md">Getting Started</h6>

                <p class="text-weight-light">
                    Point your miner to <code>{{ address_port }}</code> to start solo mining.
                </p>
                <div class="row gutter-sm items-baseline">
                    <div>
                        <p class="text-weight-light">
                            Example configurations:
                        </p>
                    </div>
                    <div>
                        <q-btn @click="modals.xmr_stak = true">xmr-stak</q-btn>
                    </div>
                </div>

                <q-modal v-model="modals.xmr_stak">
                    <div class="modal-header">Config example: xmr-stak</div>
                    <div class="q-ma-lg">
                        <pre>
"pool_list" :
[
    {
        "pool_address" : "{{ address_port }}",
        "wallet_address" : "diff.auto",
        "rig_id" : "Worker_Name",
        "pool_password" : "x",
        "use_nicehash" : false,
        "use_tls" : false,
        "tls_fingerprint" : "",
        "pool_weight" : 1
    },
],
"currency" : "cryptonight_gpu",
                        </pre>

                        <div class="q-mt-lg">
                            <q-btn
                                color="primary"
                                @click="modals.xmr_stak = false"
                                label="Close"
                                />
                        </div>
                    </div>
                </q-modal>

            </div>
        </div>

        <div v-if="page=='blocks'">
            <div class="q-pa-md">
                <h6 class="text-weight-light q-mt-xs q-mb-md">Blocks Found</h6>

                <template v-if="pool.blocks.length == 0">
                    <div class="q-pa-sm q-mt-sm text-weight-light">
                        No blocks found
                    </div>
                </template>
                <template v-else>

                    <q-table
                        class="blockTable"
                        row-key="hash"
                        :data="pool.blocks"
                        :columns="cols_blocks"
                        selection="none"
                        :dark="theme=='dark'"
                        :rows-per-page-options="[0]"
                        :pagination.sync="pagination_blocks"
                        :hide-bottom="pool.blocks.length <= 100"
                        dense
                        >
                        <q-tr slot="body" slot-scope="props" :props="props" class="cursor-pointer" @click.native="showBlockDetails(props.row)">
                            <q-td key="status" :props="props">
                                <template v-if="props.row.status == 0">
                                    <q-icon name="lock" />
                                    <q-tooltip anchor="center right" self="center left" :offset="[5, 0]">
                                        Pending ({{ props.row.height + 1 + 60 - pool.stats.height }} to go)
                                    </q-tooltip>
                                </template>
                                <template v-if="props.row.status == 1">
                                    <q-icon class="iconOrphaned" name="close" />
                                    <q-tooltip anchor="center right" self="center left" :offset="[5, 0]">
                                        Orphaned
                                    </q-tooltip>
                                </template>
                                <template v-if="props.row.status == 2">
                                    <q-icon name="check" />
                                    <q-tooltip anchor="center right" self="center left" :offset="[5, 0]">
                                        Confirmed
                                    </q-tooltip>
                                </template>
                            </q-td>
                            <q-td key="hash" :props="props" auto-width>
                                <div class="monospace ellipsis text-weight-bold">{{ props.row.hash }}</div>
                            </q-td>
                            <q-td key="height" :props="props">{{ props.row.height }}</q-td>
                            <q-td key="timeFound" :props="props">
                                <div class="ellipsis">{{ props.row.timeFound | date }}</div>
                            </q-td>
                            <q-td key="miner" :props="props">
                                <div class="ellipsis">{{ props.row.miner }}</div>
                            </q-td>
                            <q-td key="reward" :props="props">
                                <template v-if="props.row.reward == -1">
                                    <q-icon name="access_time" /> Waiting...
                                </template>
                                <template v-else>
                                    <FormatRyo :amount="props.row.reward" />
                                </template>
                            </q-td>
                            <q-td key="effort" :props="props">
                                <div style="display:inline-block">
                                    <span class="luckGood" v-if="props.row.hashes / props.row.diff < 1">
                                        {{ props.row.hashes / props.row.diff | percentage }}
                                    </span>
                                    <span class="luckMid" v-else-if="props.row.hashes / props.row.diff < 1.5">
                                        {{ props.row.hashes / props.row.diff | percentage }}
                                    </span>
                                    <span class="luckBad" v-else>
                                        {{ props.row.hashes / props.row.diff | percentage }}
                                    </span>
                                    <q-tooltip anchor="center left" self="center right" :offset="[10, 0]">
                                        {{ props.row.hashes | commas }} hashes submitted / {{ props.row.diff | commas }} network difficulty
                                    </q-tooltip>
                                </div>
                            </q-td>
                        </q-tr>
                    </q-table>
                </template>

                <q-modal maximized v-model="modals.block">

                    <q-modal-layout>
                        <q-toolbar slot="header" color="dark" inverted>
                            <q-btn flat round dense @click="modals.block = false" icon="reply" />
                            <q-toolbar-title>
                                Block {{ block.height }}
                            </q-toolbar-title>
                            <q-btn color="primary" @click="openExplorer(block.hash)" label="View on explorer" />

                        </q-toolbar>


                        <div class="q-px-md q-pb-md poolDashboard">

                            <div class="row gutter-sm q-mt-none">
                                <div class="col">
                                    <div class="infoBox" style="height: 105px">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Mined To</span></div>
                                            <div class="value">
                                                <q-item class="q-px-none">
                                                    <q-item-side>
                                                        <Identicon :address="block.minedTo" ref="identicon" />
                                                    </q-item-side>
                                                    <q-item-main>
                                                        <q-item-tile label>{{ block.minedToName }}</q-item-tile>
                                                        <q-item-tile class="monospace ellipsis" sublabel>{{ block.minedTo }}</q-item-tile>
                                                    </q-item-main>
                                                </q-item>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <div class="row gutter-sm q-mt-xs">
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Hashes Submitted</span></div>
                                            <div class="value"><span>{{ block.hashes | commas }}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text">Block Difficulty<span></span></div>
                                            <div class="value">{{ block.diff | commas }}<span></span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Block Effort</span></div>
                                            <div class="value"><span>{{ block.hashes / block.diff | percentage }}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row gutter-sm q-mt-xs">
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Found By</span></div>
                                            <div class="value"><span>{{ block.miner }}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text">Block Height<span></span></div>
                                            <div class="value">{{ block.height | commas }}<span></span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Block Reward</span></div>
                                            <div class="value">
                                                <span>
                                                    <template v-if="block.reward == -1">
                                                        <q-icon name="access_time" /> Waiting...
                                                    </template>
                                                    <template v-else>
                                                        <FormatRyo :amount="block.reward" />
                                                    </template>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row gutter-sm q-mt-xs">
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Block Status</span></div>
                                            <div class="value">
                                                <span v-if="block.status == 0">
                                                    Pending
                                                </span>
                                                <span v-if="block.status == 1">
                                                    Orphaned
                                                </span>
                                                <span v-if="block.status == 2">
                                                    Confirmed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Unlock Time</span></div>
                                            <div class="value">
                                                <span v-if="block.status == 0">
                                                    {{ block.height + 1 + 60 - pool.stats.height }} to go
                                                </span>
                                                <span v-if="block.status == 1">
                                                    N/A
                                                </span>
                                                <span v-if="block.status == 2">
                                                    N/A
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Time Found</span></div>
                                            <div class="value"><span>{{ block.timeFound | date }}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="row gutter-sm q-mt-xs">
                                <div class="col">
                                    <div class="infoBox">
                                        <div class="infoBoxContent">
                                            <div class="text"><span>Block Hash</span></div>
                                            <div class="value monospace ellipsis"><small>{{ block.hash }}</small></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </q-modal-layout>
                </q-modal>

            </div>
        </div>

    </q-modal-layout>

</q-modal>
</template>

<script>
import Vue from "vue"
import { required, between } from "vuelidate/lib/validators"
import { mapState } from "vuex"
import HashrateChart from "components/hashrate_chart"
import FormatRyo from "components/format_ryo"
import Identicon from "components/identicon"
import distanceInWords from "date-fns/distance_in_words"
export default {
    name: "PoolModal",
    computed: {
        ...mapState({
            theme: state => state.gateway.app.config.appearance.theme,
            app: state => state.gateway.app,
            wallets: state => state.gateway.wallets,
            daemon: state => state.gateway.daemon,
            pool: state => state.gateway.pool,
            config: state => state.gateway.app.config
        }),
        tabs: function() {
            let tabs = [
                {label: "Dashboard", value: "main", icon: "dashboard"},
                {label: "Workers", value: "workers", icon: "person"},
                {label: "Blocks", value: "blocks", icon: "view_list"},
            ]
            return tabs
        },
        workers: function() {
            return this.pool.workers.slice(1)
        },
        hashrate_data: function() {
            let labels = []
            let data = {}

            Object.keys(this.pool.workers[0].hashrate_graph).map(key => {
                labels.push(+key)
            })

            data = {...this.pool.workers[0].hashrate_graph}

            const selected_workers = this.selected_workers.map(worker => worker.miner)
            for(let i = 1; i < this.pool.workers.length; i++) {
                const worker = this.pool.workers[i]
                if(selected_workers.includes(worker.miner)) {
                    Object.keys(worker.hashrate_graph).map(key => {
                        if(data.hasOwnProperty(key)) {
                            data[key] += worker.hashrate_graph[key]
                        }
                    })
                }
            }

            data = Object.values(data)
            data.pop()

            return {
                labels,
                datasets: [
                    {
                        data
                    }
                ]
            }
        },
        mining_address_options: function() {
            let options = []
            for(let i = 0; i < this.wallets.list.length; i++) {
                const wallet = this.wallets.list[i]

                let instance = new this.Identicon({
                    propsData: { address: wallet.address }
                })
                const identicon = instance.img
                instance.$destroy()

                options.push({
                    label: wallet.name,
                    sublabel: wallet.address,
                    avatar: identicon,
                    value: wallet.address,
                    className: "identicon-dropdown"
                })
            }
            return options
        },
        address_port: function() {
            if(this.settings.server.bindIP == "0.0.0.0") {
                for(let i = 0; i < this.app.network_interfaces.length; i++) {
                    const net_interface = this.app.network_interfaces[i]
                    if(net_interface.label.indexOf("Local network only") === 0) {
                        return `${net_interface.value}:${this.settings.server.bindPort}`
                    }
                }
            }
            return `${this.settings.server.bindIP}:${this.settings.server.bindPort}`
        },
        mining_address_display: function() {
            for(let i = 0; i < this.wallets.list.length; i++) {
                const wallet = this.wallets.list[i]
                if(wallet.address == this.settings.mining.address) {
                    return `${wallet.name} - ${wallet.address}`
                }
            }
            return "Select wallet address"
        },
        settings_changed: function () {
            this.settings.mining.uniform = !this.enableStats
            return this.currentSettings != JSON.stringify(this.settings)
        },
        cols_workers_visible: function() {
            return this.cols_workers.map(col => col.name).filter(name => name != "active")
        }
    },
    beforeCreate: function () {
        this.Identicon = Vue.extend(this.$options.components["Identicon"])
    },
    mounted: function () {
        this.settings = this.config.pool

        let mining_address_found = false
        for(let i = 0; i < this.wallets.list.length; i++) {
            const wallet = this.wallets.list[i]
            if(wallet.address == this.settings.mining.address) {
                mining_address_found = true
            }
        }
        if(!mining_address_found && this.wallets.list.length) {
            this.settings.mining.address = this.wallets.list[0].address
        }

        this.currentSettings = JSON.stringify(this.settings)
        this.enableStats = !this.settings.mining.uniform
        this.selected_workers = this.pool.workers.slice(1)
    },
    watch: {
        workers: function(workers, workersOld) {
            workersOld = workersOld.map(worker => worker.miner)
            for(let i = 1; i < workers.length; i++) {
                const worker = workers[i]
                if(!workersOld.includes(worker.miner)) {
                    this.selected_workers.push(worker)
                }
            }

        },
    },
    methods: {
        save() {
            this.$v.settings.$touch()

            if(this.settings.mining.address == "") {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Mining address cannot be empty"
                })
                return
            }


            if(this.$v.settings.varDiff.$error) {
                this.modals.vardiff = true
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Invalid vardiff settings"
                })
                return
            }
            if(this.settings.varDiff.minDiff >= this.settings.varDiff.maxDiff) {
                this.modals.vardiff = true
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Minimum difficulty too large"
                })
                return
            }

            if(this.$v.settings.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Invalid settings"
                })
                return
            }

            this.settings.mining.uniform = !this.enableStats

            if(this.currentSettings == JSON.stringify(this.settings)) {
                this.$q.notify({
                    type: "warning",
                    timeout: 1000,
                    message: "No settings changed"
                })
                return
            }

            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Settings saved"
            })

            this.currentSettings = JSON.stringify(this.settings)
            this.$gateway.send("core", "save_pool_config", this.settings)
        },
        showBlockDetails(block) {
            this.block = {...block, minedToName: ""}
            for(let i = 0; i < this.wallets.list.length; i++) {
                const wallet = this.wallets.list[i]
                if(wallet.address == block.minedTo) {
                    this.block.minedToName = wallet.name
                }
            }
            this.modals.block = true
        },
        openExplorer(hash) {
            this.$gateway.send("core", "open_explorer", {type: "block", id: hash})
        },
        resetVarDiff() {
            this.settings.varDiff = JSON.parse(JSON.stringify(this.varDiffDefaults))
        }
    },
    validations: {
        settings: {
            server: {
                bindPort: { between: between(1024, 65535) },
            },
            varDiff: {
                startDiff: { between: between(1000, 100000000) },
                minDiff: { between: between(1000, 100000000) },
                maxDiff: { between: between(1000, 100000000) },
                targetTime: { between: between(15, 600) },
                retargetTime: { between: between(30, 1200) },
                variancePercent: { between: between(20, 80) },
                maxJump: { between: between(20, 200) },
            },
        },
    },
    data () {
        return {
            page: "main",
            isVisible: false,
            modals: {
                xmr_stak: false,
                block: false,
                stats: false,
                vardiff: false,
            },
            block: {
                hash: "",
                height: 0,
                reward: 0,
                miner: "",
                timeFound: 0,
                minedTo: "",
                diff: 1,
                hashes: 1,
                status: 0,
                minedToName: ""
            },
            enableStats: false,
            currentSettings: "",
            settings: {
                server: {
                    enabled: false,
                    bindIP: "0.0.0.0",
                    bindPort: 3333,
                },
                mining: {
                    address: "",
                    uniform: true,
                },
                varDiff: {
                    enabled: true,
                    startDiff: 5000,
                    minDiff: 1000,
                    maxDiff: 100000000,
                    targetTime: 60,
                    retargetTime: 30,
                    variancePercent: 30,
                    maxJump: 100,
                    fixedDiffSeparator: "."
                },
            },
            varDiffDefaults: {
                enabled: true,
                startDiff: 5000,
                minDiff: 1000,
                maxDiff: 100000000,
                targetTime: 60,
                retargetTime: 30,
                variancePercent: 30,
                maxJump: 100,
                fixedDiffSeparator: "."
            },
            cols_blocks: [
                {
                    name: "status",
                    field: "status",
                    label: "",
                    sortable: false,
                    style: "width: 24px"
                },
                {
                    required: true,
                    name: "hash",
                    field: "hash",
                    label: "Block Hash",
                    align: "left",
                    sortable: false
                },
                {
                    name: "height",
                    field: "height",
                    label: "Height",
                    sortable: true,
                    style: "width: 100px"
                },
                {
                    name: "timeFound",
                    field: "timeFound",
                    label: "Time Found",
                    sortable: true,
                    style: "width: 180px"
                },
                {
                    name: "miner",
                    field: "miner",
                    label: "Found By",
                    sortable: true,
                    style: "width: 100px"
                },
                {
                    name: "reward",
                    field: "reward",
                    label: "Reward",
                    sortable: true,
                    style: "width: 100px"
                },
                {
                    name: "effort",
                    field: "effort",
                    label: "Effort",
                    sortable: true,
                    style: "width: 70px"
                },
            ],
            pagination_blocks: {
                sortBy: "height",
                descending: true,
                page: 1,
                rowsPerPage: 100
            },
            cols_workers: [
                {
                    name: "active",
                    field: "active",
                    label: "Active",
                    align: "left",
                    sortable: true,
                    sort: (a, b) => (a == b) ? 0 : a ? -1 : 1
                },
                {
                    required: true,
                    name: "miner",
                    field: "miner",
                    label: "Worker Name",
                    align: "left",
                    sortable: true
                },
                {
                    name: "hashrate_5min",
                    field: "hashrate_5min",
                    label: "Hashrate",
                    format: val => this.$options.filters.hashrate(val),
                    sortable: true
                },
                {
                    name: "hashrate_1hr",
                    field: "hashrate_1hr",
                    label: "Hashrate (1 hour)",
                    format: val => this.$options.filters.hashrate(val),
                    sortable: true
                },
                {
                    name: "hashrate_6hr",
                    field: "hashrate_6hr",
                    label: "Hashrate (6 hours)",
                    format: val => this.$options.filters.hashrate(val),
                    sortable: true
                },
                {
                    name: "hashrate_24hr",
                    field: "hashrate_24hr",
                    label: "Hashrate (24 hours)",
                    format: val => this.$options.filters.hashrate(val),
                    sortable: true
                },
                {
                    name: "lastShare",
                    field: "lastShare",
                    label: "Last Share Submitted",
                    format: val => distanceInWords(Date.now(), val, {addSuffix:true}),
                    sortable: true
                },
                {
                    name: "hashes",
                    field: "hashes",
                    label: "Total Hashes",
                    format: val => this.$options.filters.commas(val),
                    sortable: true
                },
            ],
            selected_workers: [],
            pagination_workers: {
                page: 1,
                rowsPerPage: 0,
                sortBy: "active",
                descending: false,
            }
        }
    },
    filters: {
        date: (value) => {
            let date = new Date(value)
            return date.toLocaleString()
        },
        hashrate: (hashrate) => {
            if(!hashrate) hashrate = 0
            const byteUnits = [" H/s", " kH/s", " MH/s", " GH/s", " TH/s", " PH/s"]
            let i = 0
            if(hashrate > 0) {
                while(hashrate > 1000) {
                    hashrate /= 1000
                    i++
                }
            }
            return parseFloat(hashrate).toFixed(2) + byteUnits[i]
        },
        percentage: (val) => {
            return Math.round(val * 100) + "%"
        },
        commas: (num) => {
            return num.toLocaleString()
        },
        time: (val) => {
            if(val == null) {
                return "Never"
            }
            return distanceInWords(0, val)
        }
    },
    components: {
        HashrateChart,
        FormatRyo,
        Identicon
    }
}
</script>

<style lang="scss">
.blockTable {
    &>div {
        overflow-y:hidden;
    }
    table {
        table-layout: fixed;
    }

    .luckGood, .blockReward {
        /*color: #17a600;*/
        color: #008000;
    }
    .luckMid {
        color: #df9d00;
    }
    .luckBad, .iconOrphaned {
        color: #a60000;
    }
}
.poolDashboard {
    .infoBox {
        margin: 0;
        padding: 10px;
        height: 80px;
        border-radius: 3px;
        -webkit-box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
        box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
        vertical-align: top;
    }
    .stateOK {
        /*color: #17a600;*/
        color: #008000;
    }
    .stateWait {
        color: #df9d00;
    }
    .stateNegative {
        color: #a60000;
    }
}
.poolWorkers {
    .q-table, .q-table-dark {
        tbody {
            tr.selected:not(:hover) {
                background:unset;
            }
        }
    }
}
body.dark {
    .blockTable {
        .luckGood, .blockReward {
            color: #90ee90;
        }
    }
    .poolDashboard {
        .stateOK {
            color: #90ee90;
        }
    }
}
.identicon-dropdown {
    .q-item-avatar{
        image-rendering: crisp-edges;
        box-shadow: inset rgba(255, 255, 255, 0.6) 0 2px 2px, inset rgba(0, 0, 0, 0.3) 0 -2px 6px;
        border-radius: 2px;
    }
}
</style>
