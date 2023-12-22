import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import AnnoTaskNode from './nodes/AnnoTaskNode'
import DataExportNode from './nodes/DataExportNode'
import DatasourceNode from './nodes/DatasourceNode'
import ScriptNode from './nodes/ScriptNode'
import Graph from 'react-directed-graph'
// import actions from '../../../../actions/pipeline/pipelineStart'
import Modals from './modals'
import Loop from './nodes/LoopNode'
import VisualOutputNode from './nodes/VisualOutputNode'
import { CRow } from '@coreui/react'
import HelpButton from '../../../../components/HelpButton'

// const { toggleModal, selectTab } = actions

const ShowStartPipeline = ({ step1Data, step }) => {

    const graphRef = useRef()

    // const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalIdOpen, setModalIdOpen] = useState(-1)

    const toggleModal = (modalId) => {
        // setIsModalOpen(!isModalOpen)

        if (isNaN(modalId)) setModalIdOpen(-1)

        console.info("SETMODALIDOPEN", modalId)
        setModalIdOpen(modalId)
    }

    const renderNodes = () => {
        return step1Data.elements.map((el) => {
            switch (el.type) {
                case 'datasource':
                    return <DatasourceNode key={el.id} {...el} />
                case 'script':
                    return <ScriptNode key={el.id} {...el} />
                case 'annoTask':
                    return <AnnoTaskNode key={el.id} {...el} />
                case 'dataExport':
                    return <DataExportNode key={el.id} {...el} />
                case 'visualOutput':
                    return <VisualOutputNode key={el.id} {...el} />
                case 'loop':
                    return <Loop key={el.id} {...el} />
                default:
                    break
            }
            return undefined
        })
    }

    const nodesOnClick = (id) => {
        const element = step1Data.elements.filter((el) => el.peN === id)[0]
        const isDataExport = 'dataExport' in element
        const isVisualOutput = 'visualOutput' in element
        if (!isDataExport && !isVisualOutput) {
            toggleModal(id)
            // setModalIdOpen(id)
        }
    }

    const renderGraph = () => {
        if (step1Data) {
            return (
                <Graph
                    enableZooming={true}
                    centerGraph={true}
                    svgStyle={step.svgStyle}
                    ref={graphRef}
                    nodesOnClick={nodesOnClick}
                >
                    {renderNodes()}
                </Graph>
            )
        }
    }

    return (
        <div className="pipeline-start-2">
            <CRow className="justify-content-center">
                <HelpButton
                    id={'pipeline-start-fillout'}
                    text={`Configure your pipeline according to your preferences.
                        Orange elements still need your configuration. 
                        Click on the element to configure it. 
                        Only when all elements are configured and green, 
                        you can assign a name and a description in the next step.`}
                />
            </CRow>
            {renderGraph()}
            <Modals modalIdOpen={modalIdOpen} toggleModal={toggleModal} data={step1Data} step={step} />
        </div>
    )
}

// const mapStateToProps = (state) => {
//     return {
//         // step: state.pipelineStart.stepper.steps[1],
//         // step1Data: state.pipelineStart.step1Data,
//     }
// }

// export default connect(mapStateToProps, { toggleModal, selectTab })(
//     ShowStartPipeline,
// )

export default ShowStartPipeline