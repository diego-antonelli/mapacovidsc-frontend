export abstract class Preloader {
    private static layers = {};

    public static checkLayer(uf: string): boolean {
        return this.layers.hasOwnProperty(uf);
    }

    public static addLayer(uf, layer): void {
        this.layers[uf] = layer;
    }

    public static getLayer(uf): any {
        if (this.checkLayer(uf)) {
            return this.layers[uf];
        }
        return null;
    }
}
