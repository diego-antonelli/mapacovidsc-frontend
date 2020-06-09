export function getCoresCasos(camada: number) {
    switch (camada) {
        case 1:
            return '#eabeb2';
        case 2:
            return '#d67e66';
        case 3:
            return '#c23d19';
        case 4:
            return '#962000';
        default:
            return '#5e1400';
    }
}

export function getCoresRecuperados(camada: number) {
    switch (camada) {
        case 1:
            return '#99c3bb';
        case 2:
            return '#4d9689';
        case 3:
            return '#026957';
        case 4:
            return '#01493c';
        default:
            return '#001f1a';
    }
}

export function getCoresInternados(camada: number) {
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
            return '#b5b5b6';
        case 2:
            return '#909092';
        case 3:
            return '#47474a';
        case 4:
            return '#2a2a2c';
        case 5:
            return '#0e0e0e';
    }
}
