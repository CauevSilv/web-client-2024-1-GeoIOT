import type {Coordinates, DrawedGeom, GeometryPoint, LoadedRoutes, StopPoint, ZoneOptions} from "@/components/Types";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import {Fill, Icon, Stroke, Style} from "ol/style";
import {handleTypeError} from "@/utils/errorHandler";
import IconPositionMap from "@/assets/IconPositionMap.png";
import IconStartPin from "@/assets/IconStartPin.png";
import IconEndPin from "@/assets/IconEndPin.png";
import {fetchAllZones, saveGeomData} from "@/services/apiService";
import {Circle, Geometry, LineString, Polygon} from "ol/geom";
import type {Coordinate} from "ol/coordinate";
import {type Ref, ref} from "vue";
import {WKT} from "ol/format";


export function makePointsFromArray(arrayOfGeomPoints: GeometryPoint[]|StopPoint[], pointStyle?:Style): Feature {
    let newPoints: Point[] = [];
    let newFeatures: Feature[] = [];
    if(arrayOfGeomPoints.length == 0){
        return null;
    }
    if(arrayOfGeomPoints.length == 1) {
        newPoints.push(makeSinglePoint(arrayOfGeomPoints[0]));
    }else{
        arrayOfGeomPoints.forEach(point => {
            newPoints.push(makeSinglePoint(point));
        })
        newPoints.forEach(point => {
            newFeatures.push(makeFeature(point, pointStyle));
        })
    }
    return newFeatures;
}
export function makeSinglePoint(pointObject: GeometryPoint|StopPoint): Point {
    try {
        return new Point(pointObject.coordinates);
    }catch(error) {
        return new Point([pointObject.longitude,pointObject.latitude]);
    }
}
export function makeMultiplePointsLegacy(arrayOfGeometryObjects:GeometryPoint[]|StopPoint[]):Point[]{
    let pointFeatures :Point[] =[];
    arrayOfGeometryObjects.forEach((pointObj) => {
        const point = new Feature({
            geometry: new Point([pointObj?.longitude, pointObj?.latitude]),
        });
        pointFeatures.push(point);
    });
    return pointFeatures;
}
export function makeLineString(featureList:Feature[]):LineString{
    let lineCoordinates :Coordinate[] = [];
    featureList.value.forEach((feature) =>{
        let singleCoordinate:Coordinate = [feature.getGeometry().getCoordinates()[0],feature.getGeometry().getCoordinates()[1]]
        lineCoordinates.push(singleCoordinate);
    })
    return new LineString(lineCoordinates);
}
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
        zIndex: zIndex|2
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

export let zoneOptions:Ref<ZoneOptions[]> = ref([]);
export let drawedGeomsFromDb :DrawedGeom[] =[];
export let selectedHotzone = ref<number>();
export let drawingActive = ref(false);
export let buttonsList = ref([]);
export let deletedHotzones = ref<number>();
