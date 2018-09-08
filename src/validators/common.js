//import { validateAddress } from "./address_tools"

export const payment_id = (input) => {
    return input.length === 0 || (/^[0-9A-Fa-f]+$/.test(input) && (input.length == 16 || input.length == 64))
}

export const address = (input) => {

    if(!(/^[0-9A-Za-z]+$/.test(input))) return false

    switch (input.substring(0,4)) {
        case "Sumo":
        case "RYoL":
        case "Suto":
        case "RYoT":
            return input.length === 99

        case "Subo":
        case "Suso":
            return input.length == 98

        case "RYoS":
        case "RYoU":
            return input.length == 99

        case "Sumi":
        case "RYoN":
        case "Suti":
        case "RYoE":
            return input.length === 110

        case "RYoK":
        case "RYoH":
            return input.length === 55

        default:
            return false
    }
}
