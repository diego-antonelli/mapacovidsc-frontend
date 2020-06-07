export function getCoresCasos(camada: number) {
    switch (camada) {
        case 1:
            return '#fc8d59';
        case 2:
            return '#ef6548';
        case 3:
            return '#d7301f';
        case 4:
            return '#b30000';
        default:
            return '#7f0000';
    }
}

export function getCoresRecuperados(camada: number) {
    switch (camada) {
        case 1:
            return '#67a9cf';
        case 2:
            return '#3690c0';
        case 3:
            return '#02818a';
        case 4:
            return '#016c59';
        default:
            return '#014636';
    }
}

export function getCoresInternados(camada: number) {
    switch (camada) {
        case 1:
            return '#6baed6';
        case 2:
            return '#4292c6';
        case 3:
            return '#2171b5';
        case 4:
            return '#08519c';
        default:
            return '#08306b';
    }
}

export function getCoresInternadosUTI(camada: number) {
    switch (camada) {
        case 1:
            return '#9e9ac8';
        case 2:
            return '#807dba';
        case 3:
            return '#6a51a3';
        case 4:
            return '#54278f';
        default:
            return '#3f007d';
    }
}

export function getCoresObitos(camada: number) {
    switch (camada) {
        case 1:
            return '#bdbdbd';
        case 2:
            return '#969696';
        case 3:
            return '#737373';
        case 4:
            return '#525252';
        case 5:
            return '#252525';
    }
}
