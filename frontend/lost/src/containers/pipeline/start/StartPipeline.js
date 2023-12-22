import React, { useEffect, useState } from 'react'
import Stepper from 'react-stepper-wizard'
import { connect } from 'react-redux'
import actions from '../../../actions/pipeline/pipelineStart'

import '../globalComponents/node.scss'
import '../globalComponents/pipeline.scss'
import SelectPipeline from './1/SelectPipeline'
import ShowStartPipeline from './2/ShowStartPipeline'
import StartPipelineForm from './3/StartPipelineForm'
import StartRunPipeline from './4/StartPipeline'
import BaseContainer from '../../../components/BaseContainer'
const { verifyTab, toggleModal } = actions

const defaultStepperData = {
    "style": {
        "container": {
            "paddingTop": 24,
            "paddingBottom": 40
        },
        "shape": {
            "size": 60,
            "borderWidth": 4,
            "borderRadius": "50%"
        },
        "line": {
            "borderWidth": 3,
            "borderColor": "gray",
            "padding": 0
        }
    },
    "steps": [
        {
            "text": "1",
            "icon": "fa-puzzle-piece",
            "shapeBorderColor": "#092F38",
            "shapeBackgroundColor": "white",
            "shapeContentColor": "#092F38",
            "verified": false,
            "enabled": true
        },
        {
            "text": "2",
            "icon": "fa-pencil",
            "shapeBorderColor": "#092F38",
            "shapeBackgroundColor": "white",
            "shapeContentColor": "#092F38",
            "verified": false,
            "modalOpened": false,
            "modalClickedId": 0,
            "svgStyle": {
                "width": "100%"
            },
            "enabled": false
        },
        {
            "text": "3",
            "icon": "fa-info",
            "shapeBorderColor": "#092F38",
            "shapeBackgroundColor": "white",
            "shapeContentColor": "#092F38",
            "verified": false,
            "enabled": false
        },
        {
            "text": "4",
            "icon": "fa-check",
            "shapeBorderColor": "#092F38",
            "shapeBackgroundColor": "white",
            "shapeContentColor": "#092F38",
            "verified": false,
            "enabled": false
        }
    ],
}

const StartPipeline = ({ initialStepperData, step0Data, step1Data }) => {

    const [pipelineName, setPipelineName] = useState("")
    const [pipelineDescription, setPipelineDescription] = useState("")
    const [isTab0Verified, setIsTab0Verified] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [stepperData, setStepperdata] = useState()

    // const changeCurrentStep = (newStep) => {
    //     selectTab(newStep)
    // }

    useEffect(() => {
        const _newStepperData = { ...initialStepperData }
        _newStepperData.currentStep = currentStep
        _newStepperData.steps[0].verified = isTab0Verified
        setStepperdata(null)
        setStepperdata(_newStepperData)

        console.info("New Stepper Data", _newStepperData.steps[0].enabled, currentStep)
    }, [currentStep])

    const renderContent = () => {

        switch (currentStep) {
            case 0: return (
                <SelectPipeline
                    step0Data={step0Data}
                    selectTab={setCurrentStep}
                    setIsTab0Verified={setIsTab0Verified}
                />
            )
            case 1: return (
                <ShowStartPipeline
                    step={stepperData.steps[1]}
                    step1Data={step1Data}
                // verifyTab={verifyTab}
                // selectTab={setCurrentStep}
                // toggleModal={toggleModal}
                />
            )
            case 2: return (
                <StartPipelineForm
                    pipelineName={pipelineName}
                    setPipelineName={setPipelineName}
                    pipelineDescription={pipelineDescription}
                    setPipelineDescription={setPipelineDescription}
                    verifyTab={verifyTab}
                />
            )
            case 3: return (
                <StartRunPipeline
                    step0Data={step0Data}
                    step1Data={step1Data}
                    pipelineName={pipelineName}
                    pipelineDescription={pipelineDescription}
                />
            )
            default:
                break
        }
    }

    if (stepperData === undefined) return

    return (
        <BaseContainer className='pipeline-start-container'>
            <Stepper
                stepperData={stepperData}
                // changeCurrentStep={changeCurrentStep}
                changeCurrentStep={setCurrentStep}
            />
            {renderContent()}
        </BaseContainer>
    )
}

const mapStateToProps = (state) => {
    return {
        initialStepperData: state.pipelineStart.stepper,
        step0Data: state.pipelineStart.step0Data,
        step1Data: state.pipelineStart.step1Data,
    }
}
export default connect(
    mapStateToProps,
    { toggleModal }
)(StartPipeline)