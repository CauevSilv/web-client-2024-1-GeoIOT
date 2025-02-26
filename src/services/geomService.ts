import type {
    Coordinates,
    DrawedGeom,
    GeometryPoint,
    LoadedRoutes,
    SelectedPerson,
    StopPoint,
    TableProps, ZoneOptions
} from "@/services/Types";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import {Fill, Icon, Stroke, Style} from "ol/style";
import {handleTypeError} from "@/utils/errorHandler";
import IconPositionMap from "@/assets/IconPositionMap.png";
import IconStartPin from "@/assets/IconStartPin.png";
import IconEndPin from "@/assets/IconEndPin.png";
import {saveGeomData} from "@/services/apiService";
import {Circle, LineString, Polygon} from "ol/geom";
import type {Coordinate} from "ol/coordinate";
import {circular} from 'ol/geom/Polygon';
import {type Ref, ref} from "vue";
import {integer} from "@volar/language-server";


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
export function makePolygon(hotzone:DrawedGeom) {
    if(hotzone.shape =='CIRCLE'){
        let geomCenter :Coordinate;
        geomCenter = [hotzone.center?.longitude,hotzone.center?.latitude]
        let newTrueCircle :Circle = new Circle(geomCenter,hotzone.radius);
        return newTrueCircle
    }else{
        let newArray : Coordinate[] = [];
        let newCoordinate :Coordinate= {};
        hotzone.coordinates.forEach((point):Coordinates=> {
            newCoordinate = [point.longitude, point.latitude];
            newArray.push(newCoordinate)
        })
        let newPolygon:Polygon = new Polygon([newArray]);
        return newPolygon
    }

}
export function makeFeature(newGeometry?: Point, pointStyle?:Style, createdPolygon?:Polygon, zIndex?:number): Feature {
    let createdFeature: Feature;
    if(createdPolygon) {
        createdFeature = new Feature({geometry: createdPolygon});
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
    if(pointStyle) {
        createdFeature = new Feature({
            geometry: newGeometry
        });
        createdFeature.setStyle(pointStyle);
    }
    if(!pointStyle){
        createdFeature = new Feature({
            geometry: newGeometry
        });
        createdFeature.setStyle(new Style({
            image: new Circle({
                radius: 3,
                fill: new Fill({ color: 'red' }),
                stroke: new Stroke({
                    color: 'black',
                    width: 1,
                }),
            }),
        }));
    }
    return createdFeature;
}
export function convertToDrawedGeom(feature :Feature,shape :string, drawGeomName: string) :DrawedGeom| null {
    let newDrawedGeom :DrawedGeom = {};
    let newCoordinates:Coordinates[] =[];
    let coordinates : Coordinates = {};
    if(shape == 'CIRCLE'){
        newDrawedGeom.name = drawGeomName;
        newDrawedGeom.shape = shape;
        newDrawedGeom.coordinates = null;
        let centerCoordinate = feature.getGeometry().getCenter()
        coordinates = {longitude: centerCoordinate[0], latitude: centerCoordinate[1]};
        newDrawedGeom.center= coordinates
        newDrawedGeom.radius= feature.getGeometry().getRadius();
        return newDrawedGeom;
    } else {
        newDrawedGeom.name = drawGeomName;
        newDrawedGeom.shape = shape;
        feature.getGeometry().getCoordinates()[0].forEach(point => {
            newCoordinates.push(({longitude: point[0], latitude: point[1]}));
        })
        newDrawedGeom.coordinates = newCoordinates;
        return newDrawedGeom;
    }
}
export function saveGeoms(feature:Feature, drawGeomName: string){
    try{
        if(feature.getGeometry().getRadius()){
            saveGeomData(convertToDrawedGeom(feature,'CIRCLE',drawGeomName)).then((obj) =>{
            });
        }
    } catch (e){
        saveGeomData(convertToDrawedGeom(feature,'POLYGON',drawGeomName));
        handleTypeError(e);
    }
}
export function createStartAndEndPoint(arrayOfGeometryObjects:GeometryPoint[]|StopPoint[],anguloInicial?:number){
    let pointStartStyle:Style = new Style({
        image: new Icon({
            src: IconStartPin,
            scale: 0.7,
            anchor: [0.5, 1],
        }),
    });
    let startPointIconMapStyle:Style = new Style({
        image: new Icon({
            src: IconPositionMap,
            anchor: [0.5, 0.5],
            scale: 0.2,
            rotation: anguloInicial
        }),
    });
    let endPointStyle:Style = new Style({
        image: new Icon({
            src: IconEndPin,
            scale: 0.7,
            anchor: [0.5, 1],
        }),
    })
    let startPoint:Feature = makeFeature(makeSinglePoint(arrayOfGeometryObjects[0]),pointStartStyle);
    let startPointIconMap:Feature= makeFeature(makeSinglePoint(arrayOfGeometryObjects[0]),startPointIconMapStyle);
    let endPoint:Feature = makeFeature(makeSinglePoint(arrayOfGeometryObjects[arrayOfGeometryObjects.length - 1]),endPointStyle);
    let arrayOfFeatures:Feature[] = [startPoint, endPoint,startPointIconMap];
    return arrayOfFeatures;
}
export function locationDtoToDrawedGeom(data):DrawedGeom{
    let newDrawedGeom :DrawedGeom= {};
    let newCoordinates :Coordinates;
    if (data.shape =='CIRCLE'){
        newDrawedGeom.gid = data.idLocation;
        newDrawedGeom.name = data.name;
        newDrawedGeom.shape = data.shape;
        newDrawedGeom.coordinates = undefined;
        newCoordinates = data.center
        newDrawedGeom.center = newCoordinates;
        newDrawedGeom.radius = data.radius;
        return newDrawedGeom;
    } else {
        newDrawedGeom.gid = data.idLocation;
        newDrawedGeom.name = data.name;
        newDrawedGeom.shape = data.shape;
        newCoordinates = data.coordinates
        newDrawedGeom.coordinates = newCoordinates;
        return newDrawedGeom;
    }
}
export let zoneOptions:Ref<ZoneOptions[]> = ref([]);
export let drawedGeomsFromDb :DrawedGeom[] =[];
export let selectedHotzone = ref<number>();
export let drawingActive = ref(false);
export let selectedUsers = ref([]);
export let focusedUser = ref();
export let buttonsList = ref([]);
export let loadedRoutes= ref<LoadedRoutes[]>([]);
export let startPointIconMap = ref<Feature>();
export let deletedHotzones = ref<number>();
