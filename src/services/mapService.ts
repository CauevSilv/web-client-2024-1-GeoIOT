import {Feature, Map, View} from "ol";
import {Tile as TileLayer, Vector as VectorLayer} from "ol/layer";
import {OSM, Vector as VectorSource, XYZ} from "ol/source";
import {Fill, Stroke, Style} from "ol/style";

export function createMap(center: number[], zoom: number, projection: string, darkOrWhiteMap?) {
    return new Map({
        target: 'map',
        layers: [
            new TileLayer({
                properties: {layerName: 'TileLayer'},
                source: (new XYZ({
                    url: `https://api.maptiler.com/maps/${darkOrWhiteMap}/{z}/{x}/{y}.png?key=h0XJNXXoyzrwdtWPRe9B`
                }))
            }),
        ],
        view: new View({
            center: center.value,
            zoom: zoom.value,
            projection: projection.value,
        }),
    })
}
export function createNewVectorLayer(featureArray?: Feature[], layername?: string, drawSource?: VectorSource, zIndex?: number) {
    if (drawSource) {
            return new VectorLayer({
                source: drawSource,
                properties: {layerName: layername},
                zIndex:1
        })
    } if (featureArray) {
    return new VectorLayer({
        source: new VectorSource({
            features: featureArray,
        }),
        style: new Style({
            fill: new Fill({
                color: 'rgba(255, 0, 0)'
            }),
            stroke: new Stroke({
                color: '#000000',
                width: 1
            })
        }),
        properties: {layerName: layername},
        zIndex: zIndex|2,
    });
    } else {
        return new VectorLayer({
            source: new VectorSource(),
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 0, 0)'
                }),
                stroke: new Stroke({
                    color: '#000000',
                    width: 1
                })
            }),
            properties: {layerName: layername},
            zIndex: zIndex|3,
        });
    }
}
export function createTileLayer(layername?: string, darkOrWhiteMap?: string) {
    return new TileLayer({
        source: new XYZ({
            url: `https://api.maptiler.com/maps/${darkOrWhiteMap}/{z}/{x}/{y}.png?key=h0XJNXXoyzrwdtWPRe9B`
        }),
        properties: {layerName: 'TileLayer'},
    })
}

