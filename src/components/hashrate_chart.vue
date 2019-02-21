<script>
import { Line, mixins } from "vue-chartjs"
const { reactiveProp } = mixins

Chart.Tooltip.positioners.custom = (elements, eventPosition) => {
    return {
        x: eventPosition.x,
        y: eventPosition.y
    }
}

export default {
    extends: Line,
    mixins: [reactiveProp],
    data () {
        return {
            gradient: null,
            options: {
                animation: false,
                legend: false,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        type: "time",
                        time: {
                            displayFormats: {
                                hour: "HH:00",
                            }
                        },
                        gridLines : {
                            display : false
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            suggestedMin: 0,
                            suggestedMax: 1000,
                            userCallback: val => this.$options.filters.hashrate(val, 0)
                        }
                    }]
                },
                elements: {
                    line: {
                        tension: 0,
                        borderWidth: 1,
                        borderColor: "rgb(73, 125, 198)",
                    },
                    point: {
                        radius: 0,
                        hitRadius: 5,
                        hoverRadius: 0,
                    }
                },
                tooltips: {
                    mode: "x",
                    intersect: false,
                    position : "custom",
                    enabled: false,
                    custom: function(tooltipModel) {
                        let parentEl = document.getElementById("line-chart").parentElement
                        let tooltipEl = parentEl.querySelector(".hashrate-tooltip")
                        if(!tooltipEl) {
                            tooltipEl = document.createElement("div")
                            tooltipEl.className = "hashrate-tooltip"
                            parentEl.appendChild(tooltipEl)
                        }
                        if(tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0
                            return
                        }
                        tooltipEl.classList.remove('above', 'below', 'no-transform')
                        if(tooltipModel.yAlign) {
                            tooltipEl.classList.add(tooltipModel.yAlign)
                        } else {
                            tooltipEl.classList.add('no-transform')
                        }
                        if(tooltipModel.body) {
                            const title = tooltipModel.title[0]
                            const body = tooltipModel.body[0].lines[0]
                            tooltipEl.innerHTML = `${title}<br/>${body}`
                        }

                        const position = this._chart.canvas.getBoundingClientRect()

                        tooltipEl.style.opacity = 1

                        const y = position.top + tooltipModel.caretY
                        let x = position.left + tooltipModel.caretX

                        if(tooltipModel.caretX > position.width / 2) {
                            x -= tooltipEl.offsetWidth
                        }

                        tooltipEl.style.transform = `translate(${x}px, ${y}px)`
                    },

                    callbacks: {
                        label: (tooltipItem, data) => {
                            return this.$options.filters.hashrate(tooltipItem.yLabel, 2)
                        },
                    }
                },
                customLine: {
                    color: "rgb(73, 125, 198)"
                },

            }
        }
    },
    filters: {
        hashrate: (hashrate, precision = 2) => {
            if(!hashrate) hashrate = 0
            const byteUnits = [" H/s", " kH/s", " MH/s", " GH/s", " TH/s", " PH/s"]
            let i = 0
            if(hashrate > 0) {
                while(hashrate > 1000) {
                    hashrate /= 1000
                    i++
                }
            }
            return parseFloat(hashrate).toFixed(precision) + byteUnits[i]
        },
    },
    methods: {
        extendData() {
            this.chartData.datasets[0].label = "Hashrate"
            this.chartData.datasets[0].backgroundColor = this.gradient

            const min = Math.max(0, Math.min(...this.chartData.datasets[0].data) - 100)
            const max = Math.max(...this.chartData.datasets[0].data) + 100

            if(!isNaN(min) && !isNaN(max)) {
                this.options.scales.yAxes[0].ticks.suggestedMin = min
                this.options.scales.yAxes[0].ticks.suggestedMax = max
            }
        }
    },
    mounted () {
        this.gradient = this.$refs.canvas.getContext("2d").createLinearGradient(0, 0, 0, 400)
        this.gradient.addColorStop(0, "rgba(73, 125, 198, 0.5)")
        this.gradient.addColorStop(1, "rgba(73, 125, 198, 0)")

        this.$on("chart:destroy", () => {
            this.extendData()
        })
        this.extendData()

        this.addPlugin({
            beforeEvent: function(chart, e) {
                if((e.type === "mousemove") && (e.x >= e.chart.chartArea.left) && (e.x <= e.chart.chartArea.right)) {
                    chart.options.customLine.x = e.x
                }
            },
            afterDraw: function(chart, easing) {
                const ctx = chart.chart.ctx
                const chartArea = chart.chartArea
                const x = chart.options.customLine.x

                if(!isNaN(x)) {
                    ctx.save()
                    ctx.strokeStyle = chart.options.customLine.color
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(chart.options.customLine.x, chartArea.bottom)
                    ctx.lineTo(chart.options.customLine.x, chartArea.top)
                    ctx.stroke()
                    ctx.restore()
                }
            }
        })

        this.renderChart(this.chartData, this.options)
    }
}
</script>

<style lang="scss">
.hashrate-tooltip {
    background: rgba(248,248,248,0.5);
    z-index: 99999;
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform, opacity;
    padding: 5px;
    pointer-events: none;
}
body.dark {
    .hashrate-tooltip {
        background: rgba(0,0,0,0.5);
    }
}
</style>
