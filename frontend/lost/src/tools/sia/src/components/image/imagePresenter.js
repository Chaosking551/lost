import $ from "cash-dom"

import { keyboard, mouse, state, Observable, svg as SVG } from "l3p-frontend"

import * as color from "shared/color"

import { STATE } from "drawables/drawable.statics"
import BoxPresenter from "drawables/box/BoxPresenter"
import PointPresenter from "drawables/point/PointPresenter"
import MultipointPresenter from "drawables/multipoint/MultipointPresenter"
import DrawablePresenter from "drawables/DrawablePresenter"

import appModel from "../../appModel"
import * as http from "../../http"
import * as imageView from "./imageView"
import { enablePointChange, disablePointChange } from "./change-point"
import { enableMultipointChange, disableMultipointChange } from "./change-multipoint"
import { enableBoxChange, disableBoxChange } from "./change-box"
import { selectDrawable, resetSelection } from "./change-select"


appModel.config.on("update", config => {
    enableSelect()
	if(config.actions.edit.bounds){
		// enable change on current selected drawable
		if(appModel.isADrawableSelected()){
			enableChange(appModel.getSelectedDrawable())
		}
		appModel.state.selectedDrawable.on("update", enableChange)
		appModel.state.selectedDrawable.on(["before-update", "reset"], disableChange)
	}
	if(config.actions.edit.delete){
	    enableDelete()
	}
	if(config.actions.drawing || config.actions.edit.bounds || config.actions.edit.delete){
		// enable redo and undo
		$(window).off("keydown.undo").on("keydown.undo", undo)
		$(window).off("keydown.redo").on("keydown.redo", redo)	
	}
})

// during drawable change
// - hide other drawables
// appModel.controls.changeEvent.on("change", isActive => {
// 	if(isActive){
// 		// hide other drawables
// 		Object.values(appModel.state.drawables).forEach(observableDrawableList => {
// 			Object.values(observableDrawableList.value)
// 				.filter(drawable => drawable !== appModel.getSelectedDrawable())
// 				.forEach(drawable => {
// 					drawable.hide()
// 				})
// 		})
// 	} else {
// 		// show other drawables
// 		Object.values(appModel.state.drawables).forEach(observableDrawableList => {
// 			Object.values(observableDrawableList.value).forEach(drawable => {
// 				drawable.show()
// 			})
// 		})
// 	}
// })

// during drawable creation
// - hide other drawables
// - disable ordinary delete
// - (disable redo and undo)
appModel.controls.creationEvent.on("change", isActive => {
	if(isActive){
		// the toolbars multipoint drawable creation has its own delete handlers 
		disableDelete()
		// hide other drawables
		Object.values(appModel.state.drawables).forEach(observableDrawableList => {
			Object.values(observableDrawableList.value).forEach(drawable => {
				drawable.hide()
			})
		})
		// $(window).off("keydown.undo")
		// $(window).off("keydown.redo")
	} else {
		enableDelete()
		// show other drawables
		Object.values(appModel.state.drawables).forEach(observableDrawableList => {
			Object.values(observableDrawableList.value).forEach(drawable => {
				drawable.show()
			})
		})
		// $(window).on("keydown.undo", undo)
		// $(window).on("keydown.redo", redo)
	}
})
appModel.data.image.url.on("update", url => {
	http.requestImage(url).then(blob => {
		const objectURL = window.URL.createObjectURL(blob)
		imageView.updateImage(objectURL)
	})
})
appModel.data.image.info.on("update", info => imageView.updateInfo(info))

// add and remove drawables when data changes
Object.values(appModel.state.drawables).forEach(observable => {
    observable.on("update", (drawables) => addDrawables(drawables))
    observable.on("reset", (drawables) => removeDrawables(drawables))
    observable.on("add", (drawable) => addDrawable(drawable))
    observable.on("remove", (drawable) => removeDrawable(drawable))
})


$(imageView.html.refs["sia-delete-junk-btn"]).on("click", $event => {
    alert("Function not completely implemented.")
})

export const image = imageView.image
appModel.ui.resized.on("update", () => {
	// (re)create drawables
    createDrawables(appModel.data.drawables.value)
})

imageView.image.addEventListener("load", () => {   
    const { colorMap } = color.getColorTable(
        imageView.image,
        appModel.data.labelList.value,
        { accuracy: 2 }
    )

    appModel.state.colorTable = colorMap
    
    // the default move step  is 1px, the fast move step depends on current image display size.
    appModel.controls.moveStepFast = Math.ceil(appModel.controls.moveStep * (imageView.getWidth() * imageView.getHeight() * 0.00001))
    if(JSON.parse(sessionStorage.getItem("sia-first-image-loaded"))){
        // @quickfix: lost integration
        const header = document.getElementById("sia-drawer-panel")
        if(header){
            header.scrollIntoView(true)
        }
    } else {
        document.querySelector("main div.card-header").scrollIntoView(true)
        sessionStorage.setItem("sia-first-image-loaded", JSON.stringify(true))
    }
}, false)

// =============================================================================================
// ZOOM
// =============================================================================================
// reset zoom observable on resize
$(window).on("resize", () => {
	// quickfix: i wanted to use observables reset method, but 
	// it currently returns the latest value instead of the initial value. 
	// the reset handlers do not execute as expected aswell. need to fix it.
	appModel.ui.zoom.reset()
})

const svg = imageView.html.ids["sia-imgview-svg"]
const zoomFactor = 0.05
const minZoom = 1
const maxZoom = 0.3
const minZoomLevel = 0
const maxZoomLevel = (minZoom / zoomFactor) - 1
let zoomLevel = 0
let oldZoom = 1
let newZoom = undefined
function resetZoomContext(){
    zoomLevel = 0
    oldZoom = 1
    newZoom = undefined
}
// reset zoom when switching between images (data updates), or when resizing window.
appModel.data.drawables.on("update", resetZoomContext)
$(window).on("resize", resetZoomContext)

$(svg).on("wheel", $event => {
    $event = $event.originalEvent ? $event.originalEvent : $event
	// prevent browser from scrolling
    $event.preventDefault()
    const up = $event.deltaY < 0
    const down = !up
    
    // varies with zoom
    const svgWidth = parseInt(svg.getAttribute("width"))
    const svgHeight = parseInt(svg.getAttribute("height"))

    let mousepos = mouse.getMousePosition($event, svg)
    if((up && (oldZoom <= maxZoom)) || (down && (zoomLevel <= minZoomLevel)) || (up && (zoomLevel >= maxZoomLevel))){
        // console.warn("NO EXEC")
        mousepos = undefined
        return
    }

    // in: decrease svg viewbox
    if(up){
        zoomLevel++
    }
    // out: increase svg viewbox
    else if (down){
        zoomLevel--
    }
    newZoom = Math.ceil((1 - zoomFactor * zoomLevel) * 100) / 100
    appModel.ui.zoom.update(newZoom)
    mousepos = {
        x: (mousepos.x + (SVG.getViewBoxX(svg) * 1 / oldZoom)) * oldZoom,
        y: (mousepos.y + (SVG.getViewBoxY(svg) * 1 / oldZoom)) * oldZoom,
    }
    SVG.setViewBox(svg, {
        x: mousepos.x * (1 - newZoom),
        y: mousepos.y * (1 - newZoom),
        w: svgWidth * newZoom,
        h: svgHeight * newZoom,
    })
    oldZoom = newZoom
})
imageView.image.addEventListener("load", () => {
    appModel.data.image.rawLoadedImage.update(imageView.image)
})
// =============================================================================================

// =============================================================================================
// CAMERA
// =============================================================================================
// initially enable camera feature
enableCamera()
function enableCamera(){
	let mousePrev = undefined
	let button = undefined
	// start inside svg
    $(svg).on("mousedown.cameraStart", $event => {
		// don't execute on right mouse button
		// don't execute if not zoomed
		if(mouse.button.isRight($event.button) || zoomLevel === 0){
			return
		}
		// execute if left mouse button on free space
		// execute if mid mouse button
		if(
			(mouse.button.isLeft($event.button) && !$event.target.closest(".drawable"))
			|| mouse.button.isMid($event.button)
		){
			// remember mouse button that was used at start
			button = $event.button

			// disable browser mid button default
			if(mouse.button.isMid($event.button)){
				$event.preventDefault()
			}

			// disable browser wheel scroll
			$(window).on("wheel.cameraStart", $event => $event.preventDefault())

			// set cursor
			mouse.setGlobalCursor(mouse.CURSORS.ALL_SCROLL, {
				noPointerEvents: true,
				noSelection: true,
			})
			
			// execute on mousemove
			// initialize mouse start (prev) position
			mousePrev = mousePrev === undefined
				? mouse.getMousePosition($event, svg)
				: mousePrev
			$(window).on("mousemove.cameraUpdate", $event => {
				const mouseCurr = mouse.getMousePosition($event, svg)
				const distance = {
					x: mousePrev.x - mouseCurr.x,
					y: mousePrev.y - mouseCurr.y,
				}
				if(distance.x !== 0 || distance.y !== 0){
					const svgWidth = parseInt(svg.getAttribute("width"))
					const svgHeight = parseInt(svg.getAttribute("height"))
					const vbXMax = svgWidth * (1 - newZoom)
					const vbYMax = svgHeight * (1 - newZoom)
					const viewBox = svg.getAttribute("viewBox").split(" ")
				
					let xDest = parseInt(viewBox[0]) + (distance.x * (vbXMax/svgWidth) * newZoom)
					let yDest = parseInt(viewBox[1]) + (distance.y * (vbYMax/svgHeight) * newZoom)
				
					xDest = xDest < 0 ? 0 : xDest
					yDest = yDest < 0 ? 0 : yDest
					xDest = xDest > vbXMax ? vbXMax : xDest
					yDest = yDest > vbYMax ? vbYMax : yDest
					xDest = Math.round(xDest)
					yDest = Math.round(yDest)

					SVG.setViewBox(svg, {
						x: xDest,
						y: yDest,
					})
					mousePrev = mouseCurr
				}
			})	
		}
    })
	// stop inside window
	$(window).on("mouseup.cameraStop", $event => {
		if($event.button === button){
			$(window).off("wheel.cameraStart")
			$(window).off("mousemove.cameraUpdate")
			mouse.unsetGlobalCursor()
			mousePrev = undefined
			button = undefined
		}
	})
}
function disableCamera(){
    $(svg).off("mousedown.cameraStart")
    $(window).off("mouseup.cameraStop")
    $(window).off("mousemove.cameraUpdate")
}
// =============================================================================================

function undo($event){
    if(keyboard.isShortcutHit($event, {
        mod: "Control",
        key: "Z",
    })){
        $event.preventDefault()
        state.undo()
    }
}
function redo($event){
    if(keyboard.isShortcutHit($event, {
        mod: ["Control", "Shift"],
        key: "Z",
    })){
        $event.preventDefault()
        state.redo()
    }
}
function enableSelect(){
    // console.warn("enable select")
    // mouse
    let unselect = false
    $(imageView.html.ids["sia-imgview-svg-container"]).on("click.selectDrawable", ($event) => {
        // return on right or middle mouse button, prevent context menu.
        if (!mouse.button.isLeft($event.button)) {
            $event.preventDefault()
            return
        }
        let drawable = $event.target.closest(".drawable")
        if(drawable){
            drawable = drawable.drawablePresenter
            if(drawable instanceof DrawablePresenter){
                selectDrawable(drawable)
            }
        }
    })
    $(imageView.html.ids["sia-imgview-svg-container"]).on("mousedown.resetSelectionStart", ($event) => {
        // return on right or middle mouse button, prevent context menu.
        if (!mouse.button.isLeft($event.button)) {
            $event.preventDefault()
            return
        }
        if(appModel.isADrawableSelected()){            
            let next = $event.target.closest(".drawable")
            next = (next !== null) ? next.drawablePresenter : undefined
            if (!next){
                unselect = true
            } else {
                unselect = false
            }
        }
    })
    $(window).on("mouseup.resetSelectionEnd", ($event) => {
        // return on right or middle mouse button, prevent context menu.
        if(!mouse.button.isLeft($event.button)) {
            $event.preventDefault()
            return
        }
        if(appModel.isADrawableSelected()){
            // @WORKAROUND: firefox bug? HTMLDocument does not inherit from HTMLElement (spec) => no closest() method. 
            let next = undefined
            try {
                next = $event.target.closest(".drawable")
            } catch(e){
                next = null
            }
            next = (next !== null) ? next.drawablePresenter : undefined
            if(unselect && !next){
                resetSelection()
            }
            unselect = false
        }
    })
    // key
    $(window).on("keydown.selectDrawable", ($event) => {
        // important:
        // we use the drawable index array instead of the raw data.
        // deleted drawables should not be selected.
        if(keyboard.isKeyHit($event, "Tab")) {
            $event.stopPropagation()
            $event.preventDefault()

            if(appModel.hasDrawables()){
                // a variable containing the index of the next drawable of 'drawableIds'.
                let nextIndex = -1

                // if a drawables is selected, select the next drawable.
                // if user pressed shift select the previous drawable if any.
                // unselect the selected drawable.
                if(appModel.isADrawableSelected()){
                    let selectedDrawable = appModel.getSelectedDrawable()
                    // just return if only one drawable exist and is allready selected.
                    if(appModel.state.drawableIdList.length === 1){
                        return
                    }
                    if(selectedDrawable.parent){
                        selectedDrawable = selectedDrawable.parent
                    }
                    let currentDrawableIndex = appModel.getDrawableIndex(selectedDrawable)
                    selectedDrawable.unselect()
                    if(keyboard.isModifierHit($event, "Shift")){
                        nextIndex = currentDrawableIndex >= 1
                            // the previous index
                            ? currentDrawableIndex - 1
                            // the last index
                            : appModel.state.drawableIdList.length - 1
                        nextIndex = nextIndex === -1 
                            ? 0
                            : nextIndex
                    } else {
                        // the next or first
                        nextIndex = (currentDrawableIndex + 1) % appModel.state.drawableIdList.length
                    }
                }
                // else if no drawable is selected
                else {
                    // if a drawable was selected before use its index.
                    if(appModel.state.selectedDrawableId){
                        nextIndex = appModel.state.drawableIdList.indexOf(appModel.state.selectedDrawableId)
                        nextIndex = nextIndex === -1 
                            ? 0
                            : nextIndex
                    }
                    // else no drawable was selected before, use index 0 to select the drawable that was added first.
                    else {
                        nextIndex = 0
                    }
                }
                // find the actual drawable in the model data by id, using the index, and execute selection.
                const nextId = appModel.state.drawableIdList[nextIndex]
                const next = appModel.getDrawableById(nextId)
                selectDrawable(next)

                // align browser view. 
                document.querySelector("main div.card-header").scrollIntoView(true)
            }
        }
    })
    $(window).on("keydown.resetSelection", ($event) => {
        if (keyboard.isKeyHit($event, "Escape")){
            if(appModel.isADrawableSelected()){
                $event.preventDefault()
                resetSelection()
            }
        }
    })    
}
function disableSelect(){
    // console.warn("disable select")
    // mouse
    $(imageView.html.ids["sia-imgview-svg-container"]).off("click.selectDrawable")
    $(imageView.html.ids["sia-imgview-svg-container"]).off("mousedown.resetSelectionStart")
    $(window).off("mouseup.resetSelectionEnd")
    // Key
    $(window).off("keydown.selectDrawable")
    $(window).off("keydown.resetSelection")
}
export function enableDelete(){
    $(window).on("keydown.drawableDelete", ($event) => {
        if(keyboard.isKeyHit($event, "Delete")){
            if(appModel.isADrawableSelected()){
				console.log("image delete drawable")
                $event.preventDefault()
                const selectedDrawable = appModel.getSelectedDrawable()
                if(selectedDrawable.isDeletable()){
                    // console.warn("enabled mouse delete handler")
                    // for multipoint drawables:
                    if(selectedDrawable.parent){
                        if(selectedDrawable.parent.model.type === "line"){
                            if(selectedDrawable.parent.model.points.length <= 2) return
                        } else if(selectedDrawable.parent.model.type === "polygon"){
                            if(selectedDrawable.parent.model.points.length <= 3) return
                        }
                        /*
                            DEACTIVATED CAUSE NEEDED TO DEACTIVATE LINE POINT ADD/INSERT REDO UNDO:
                            state.add({
                                do: {
                                    data: {
                                        pointIndex: selectedDrawable.parent.model.points.indexOf(selectedDrawable),
                                        parent: selectedDrawable.parent,
                                    },
                                    fn: (data) => {
                                        const { pointIndex, parent } = data
                                        parent.removePoint(parent.model.points[pointIndex])
                                        const pointToSelect = parent.pointSelectionList.getTailNode().getData()
                                        selectDrawable(pointToSelect)
                                    }
                                }, 
                                undo: {
                                    data: {
                                        relPosition: {
                                            x: selectedDrawable.getX() / imageView.getWidth(),
                                            y: selectedDrawable.getY() / imageView.getHeight(),
                                        },
                                        parent: selectedDrawable.parent,
                                        action: selectedDrawable.parent.model.points.indexOf(selectedDrawable) === 0 
                                                || selectedDrawable.parent.model.points.indexOf(selectedDrawable) === selectedDrawable.parent.model.points.length - 1
                                                    ? "add"
                                                    : "insert"
                                    },
                                    fn: (data) => {
                                        const { relPosition, parent, action } = data
                                        const absPosition = {
                                            x: relPosition.x * imageView.getWidth(),
                                            y: relPosition.y * imageView.getHeight(),
                                        }
                                        const insertedPoint = parent.insertPoint(absPosition, action)
                                        selectDrawable(insertedPoint)
                                    }
                                }
                            })
                        */
                        selectedDrawable.parent.removePoint(selectedDrawable)
                        const pointToSelect = selectedDrawable.parent.pointSelectionList.getTailNode().getData()
                        selectDrawable(pointToSelect)
                    } 
                    // for drawables:
                    else {
                        // add redo and undo
                        state.add(new state.StateElement({
                            do: {
                                data: { drawable: selectedDrawable },
                                fn: (data) => {
                                    data.drawable.delete()
                                    appModel.deleteDrawable(data.drawable)
                                }
                            },
                            undo: {
                                data: { drawable: selectedDrawable },
                                fn: (data) => {
                                    appModel.addDrawable(data.drawable)
                                    selectDrawable(data.drawable)
                                }
                            }
                        }))
                        selectedDrawable.delete()
                        appModel.deleteDrawable(selectedDrawable)
                    }
                }
            }
        }
    })
}
export function disableDelete(){
    $(window).off("keydown.drawableDelete")
}

export function enableChange(drawable: DrawablePresenter){
    drawable = drawable === undefined ? appModel.getSelectedDrawable() : drawable
    if(drawable instanceof DrawablePresenter){
        if(drawable.isChangable()){
            // console.warn("enabled change handlers")
            switch(drawable.getClassName()){
                case "PointPresenter":
					enablePointChange(drawable)
                    break
                case "MultipointPresenter":
                    enableMultipointChange(drawable)
                    break
                case "BoxPresenter":
                    enableBoxChange(drawable)
                    break
                case "Object":
                    if(Object.keys(drawable).length === 0){
                        break                
                    }
                    break
                default: throw new Error(`unknown drawable ${drawable} of type ${drawable.getClassName()}.`)
            }
        } else {
            // preserve shortcuts (should still prevent default even if the funciton is not activated)
            $(window).on("keydown", $event => {
                // prevent browser from scrolling if using arrow keys.
                if(keyboard.isKeyHit($event, ["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"])){
                    $event.preventDefault()
                }
            })

        }
    }
}
export function disableChange(drawable: DrawablePresenter){
    // console.warn("disabled change handlers")
    drawable = drawable === undefined ? appModel.getSelectedDrawable() : drawable
    if(drawable instanceof DrawablePresenter){
        switch(drawable.getClassName()){
            case "PointPresenter":
				disablePointChange(drawable)
                break
            case "MultipointPresenter":
				disableMultipointChange(drawable)
                break
            case "BoxPresenter":
				disableBoxChange(drawable)
                break
            default: throw new Error(`unknown drawable ${drawable} of type ${drawable.getClassName()}.`)
        }
    }
}

// mutates appModel
export function createDrawables(drawablesRawData: any){
    console.log("%c creating drawables from raw data: ", "background: #282828; color: #FE8019", drawablesRawData)
    // reset current drawable if any
    appModel.state.selectedDrawable.reset()

    // reset state control values
    appModel.state.drawableIdList.length = 0
    appModel.state.selectedDrawableId = undefined
    
    // create drawables
    if(Object.values(drawablesRawData).find(d => d && d.length > 0) !== undefined){
        Object.keys(drawablesRawData).forEach(key => {
            let drawablesRaw = drawablesRawData[key]
            if(drawablesRaw === undefined){
                return
            }

            // determine constructor
            switch(key){
                case "bBoxes":
               	bulkCreate(BoxPresenter, key, drawablesRaw) 
                break
                case "points":
                bulkCreate(PointPresenter, key, drawablesRaw)
                break
                case "lines":
                bulkCreate(MultipointPresenter, key, drawablesRaw)
                break
                case "polygons":
                bulkCreate(MultipointPresenter, key, drawablesRaw)
                break
                default:
                throw new Error(`raw data named '${key}' was not expected.`)
            }
            // a function to create all drawables depending on constructor.
            // @param: 'data' not used.
            function bulkCreate(DrawablePresenterConstructor: DrawablePresenter, key: String, data: Array<any>){
                const drawableInstances = []
                data.forEach(data => {
                    // console.warn(`drawable type: '${key}', drawable raw data:`)
                    data.status = data.status === undefined
                        ? STATE.DATABASE
                        : data.status
                    if(key === "lines"){
                        data.type = "line"
                    } else if(key === "polygons"){
                        data.type = "polygon"
                    }
                    const drawable = new DrawablePresenterConstructor(data)
                    // keep drawable id
                    if(!appModel.state.drawables.isInInitialState){
                        // @thesis: Wyh am i searching for the drawable id here?
                        // Do i keep track of all drawable ids? If I, why do I?
                        let oldDrawable = appModel.state.drawables[key].value.find(drawable => drawable.model.id === drawablesRaw.id)
                        let oldId = (oldDrawable !== undefined) ? oldDrawable.model.id : undefined
                        if(oldId !== undefined){
                            drawable.model.id = oldId
                        }
                    }
                    // on refresh we might have deleted boxes here. don't add them to the drawableIdList.
                    if(!drawable.model.status.has(STATE.DELETED)){
                        appModel.state.drawableIdList.push(drawable.mountId)
                    }
                    drawableInstances.push(drawable)
                })
                appModel.state.drawables[key].update(drawableInstances)
            }
        })
    } else {
        console.log("%c No drawables in data. ", "background: #282828; color: #FE8019")
    }
}

// does not mutate appModel
function addDrawable(drawable: DrawablePresenter){
    if(!drawable.model.status.has(STATE.DELETED)){
        imageView.addDrawable(drawable)
    }
}
// does not mutate appModel
function addDrawables(drawables: Array<DrawablePresenter>){
    drawables = drawables.filter(d => !d.model.status.has(STATE.DELETED))
    imageView.addDrawables(drawables)
}
// does not mutate appModel
function removeDrawable(drawable: DrawablePresenter){
    imageView.removeDrawable(drawable.view)
}
// does not mutate appModel
function removeDrawables(){
    Object.values(appModel.state.drawables).forEach(drawables => {
        drawables.value.forEach(d => imageView.removeDrawable(d.view))
    })
}


export function resize(width: Number, height: Number){
    imageView.resize(width, height)

    // resize drawables
    const drawables = appModel.state.drawables
    Object.keys(drawables).forEach(key => {
        drawables[key].value.forEach(d => d.resize()) 
    })
}