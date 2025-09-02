import type {DrawedGeom, ZoneOptions} from "@/components/Types";
import Feature from "ol/Feature";
import {Fill, Stroke, Style} from "ol/style";
import {fetchAllZones, saveGeomData} from "@/services/apiService";
import {Geometry} from "ol/geom";
import {type Ref, ref} from "vue";
import {WKT} from "ol/format";
import {Map} from "ol";
import type {Layer} from "ol/layer";


export function makePolygon(geomwkt:DrawedGeom) {
    const wkt = new WKT();
    const newPolygon:Geometry = wkt.readGeometry(geomwkt);
    return newPolygon
}
export function makeFeature(createdPolygon?:Geometry[], zIndex?:number): Feature | undefined {
    let createdFeature: Feature;
    createdFeature = new Feature({geometries: createdPolygon});
    createdFeature.setStyle(new Style({
        fill: new Fill({
            color: 'rgba(0,196,255,0.04)'
        }),
        stroke: new Stroke({
            color: '#000000',
            width: 2
        }),
        zIndex: zIndex ? 2 : 2
    }))
    return createdFeature;
}
export function convertToDrawedGeom(feature :Feature, drawGeomName: string) : DrawedGeom {
    const format = new WKT();
    return {name: drawGeomName, geomwkt: format.writeGeometry(feature.getGeometry()!)}

}
export function saveGeoms(feature:Feature, drawGeomName: string){
    saveGeomData(convertToDrawedGeom(feature,drawGeomName));
}
export function locationDtoToDrawedGeom(data):DrawedGeom{
    let newDrawedGeom :DrawedGeom= {geomwkt: ""};
    newDrawedGeom.gid = data.idLocation;
    newDrawedGeom.name = data.name;
    newDrawedGeom.geomwkt = data.geomWkt;
    return newDrawedGeom;
}

export function  fetchGeoms() {
    fetchAllZones().then((geoms) =>{
        zoneOptions.value = geoms.map(geom => ({
            label: geom.name,
            value: geom.idLocation
        })).filter((geom, index, self) =>
            index === self.findIndex(g => g.label === geom.label)
        );
        geoms.forEach(geom => {
            drawedGeomsFromDb.push(<DrawedGeom>locationDtoToDrawedGeom(geom));
        })
    });
}

export let map = ref<Map>();
export let drawLayer = ref<Layer>();
export let zoneOptions:Ref<ZoneOptions[]> = ref([]);
export let drawedGeomsFromDb :DrawedGeom[] =[];
export let selectedHotzone = ref<number>();
export let drawingActive = ref(false);
export let deletedHotzones = ref<number>();
