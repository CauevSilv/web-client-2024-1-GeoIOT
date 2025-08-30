import {Feature, Map, View} from "ol";
import {Tile as TileLayer, Vector as VectorLayer} from "ol/layer";
import {OSM, Vector as VectorSource, XYZ} from "ol/source";
import {Fill, Stroke, Style} from "ol/style";

export function createMap(center: number[], zoom: number, projection: string) {
    return new Map({
        target: 'map',
        layers: [
            new TileLayer({
                properties: {layerName: 'TileLayer'},
                source: (new OSM())
            }),
        ],
        view: new View({
            center: center,
            zoom: zoom,
            projection: projection,
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
        zIndex: zIndex ? 2 : 2,
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

