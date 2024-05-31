<template>
<div class="row items-baseline q-my-xl">
    <div class="q-mr-md col-auto">
        Password strength:
    </div>
    <template v-for="n in password_strength.score">
        <div class="q-mr-xs col-auto round-borders" v-bind:style="{ backgroundColor: password_strength_color[0], width: '20px', height: '10px' }" />
    </template>
    <template v-for="n in 4-password_strength.score">
        <div class="q-mr-xs col-auto round-borders" v-bind:style="{ backgroundColor: password_strength_color[1], width: '20px', height: '10px' }" />
    </template>
    <div class="q-ml-md col self-start">
        <ul class="q-ma-none q-pl-md absolute">
            <li v-for="tip in password_strength_tips">{{ tip }}</li>
        </ul>
    </div>
</div>
</template>

<script>
import { mapState } from "vuex"
const zxcvbn = require("zxcvbn")
export default {
    name: "PasswordStrength",
    props: {
        password: {
            type: String,
            default: ""
        }
    },
    computed: {
        ...mapState({
            theme: state => state.gateway.app.config.appearance.theme,
        }),
        password_strength() {
            return zxcvbn(this.password)
        },
        password_strength_tips() {
            let tips = []
            if(this.password == "") {
                tips.push("Using an empty password will leave your wallet unencrypted on your file system")
            } else {
                if(this.password_strength.score < 3) {
                    tips.push("Using an insecure password could allow attackers to brute-force your wallet")
                }
                if(this.password_strength.feedback.warning != "") {
                    tips.push(this.password_strength.feedback.warning)
                }
                if(this.password_strength.feedback.suggestions.length) {
                    tips.concat(this.password_strength.feedback.suggestions)
                }
            }
            return tips
        },
        password_strength_color() {
            let bg_color = this.theme == "dark" ? "#424242" : "#bdbdbd"
            switch(this.password_strength.score) {
                case 0:
                case 1:
                    return ["rgb(244, 67, 54)", bg_color]
                case 2:
                    return ["rgb(255, 193, 7)", bg_color]
                case 3:
                case 4:
                    return ["rgb(139, 195, 74)", bg_color]
            }
        },
        score() {
            return this.password_strength.score
        }
    }
}
</script>

<style>
</style>
