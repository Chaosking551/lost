import * as transform from './transform'
import * as annoStatus from '../types/annoStatus'
import * as modes from '../types/modes'

export function backendAnnosToCanvas(backendAnnos, imgSize){
    let annos = [
        ...backendAnnos.bBoxes.map((element) => {
            return {...element, type:'bBox', 
            mode: element.mode ? element.mode : modes.VIEW, 
            status: element.status ? element.status : annoStatus.DATABASE}
        }),
        ...backendAnnos.lines.map((element) => {
            return {...element, type:'line', 
            mode: element.mode ? element.mode : modes.VIEW, 
            status: element.status ? element.status : annoStatus.DATABASE}
        }),
        ...backendAnnos.polygons.map((element) => {
            return {...element, type:'polygon', 
            mode: element.mode ? element.mode : modes.VIEW, 
            status: element.status ? element.status : annoStatus.DATABASE}
        }),
        ...backendAnnos.points.map((element) => {
            return {...element, type:'point', 
            mode: element.mode ? element.mode : modes.VIEW, 
                status: element.status ? element.status : annoStatus.DATABASE
            }
        })
    ]
    annos = annos.map((el) => {
        return {...el, 
            data: transform.toSia(el.data, imgSize, el.type)}
        })
    // this.setState({annos: [...annos]})
    return annos
}

export function canvasToBackendAnnos(annos, imgSize, forBackendPost=false){
    let myAnnos = annos
    const bAnnos = myAnnos.map( el => {
        var annoId 
        if (forBackendPost){
            // If an annotation will be send to backend,
            // ids of new created annoations need to be set to 
            // undefined.
            annoId = (typeof el.id) === "string" ? undefined : el.id
        } else {
            annoId = el.id
        }
        return {
            ...el,
            id: annoId,
            mode: modes.VIEW,
            data: transform.toBackend(el.data, imgSize, el.type)
        }
    })

    const backendFormat = {
            bBoxes: bAnnos.filter((el) => {return el.type === 'bBox'}),
            lines: bAnnos.filter((el) => {return el.type === 'line'}),
            points: bAnnos.filter((el) => {return el.type === 'point'}),
            polygons: bAnnos.filter((el) => {return el.type === 'polygon'}),
    }
    return backendFormat
}