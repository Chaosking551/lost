import React, { useState } from 'react'
import DatasourceModal from './types/DatasourceModal'
import ScriptModal from './types/ScriptModal'
import AnnoTaskModal from './types/annoTaskModal/AnnoTaskModal'
import LoopModal from './types/LoopModal'
// import actions from '../../../../../actions/pipeline/pipelineStart'
import IconButton from '../../../../../components/IconButton'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
// import { connect } from 'react-redux'
// const { toggleModal, verifyNode, verifyTab } = actions

const BaseModal = ({ step, data, modalIdOpen, toggleModal, verifyTab }) => {
    // constructor() {
    //     super()
    //     this.verifyNode = this.verifyNode.bind(this)
    //     this.toggleModal = this.toggleModal.bind(this)
    // }

    const [modalData, setModalData] = useState()

    const selectModal = () => {
        switch (modalData.type) {
            case 'datasource':
                return <DatasourceModal {...modalData} />
            case 'script':
                return <ScriptModal {...modalData} />
            case 'annoTask':
                console.log("HEAWW", { ...modalData });
                return (
                    <>
                        <AnnoTaskModal
                            {...modalData}
                            availableLabelTrees={data.availableLabelTrees}
                            availableGroups={data.availableGroups}
                        // selectTab={selectTab}
                        // verifyTab=.verifyTab}
                        />
                    </>
                )
            case 'loop':
                return <LoopModal {...modalData} />
            default:
                break
        }
    }

    // selectTab() {
    //     console.info("SELECT TAB")

    //     return test
    // }

    // const verifyTab = () => {
    //     console.info("VERIFY TAB");
    // }

    const verifyNode = () => {
        let verified = false

        if (!modalData) return

        switch (modalData.type) {
            case 'datasource':
                const { datasource } = modalData.exportData
                if (datasource.selectedPath) {
                    verified = true
                } else {
                    verified = false
                }
                break
            case 'script':
                const { script } = modalData.exportData
                verified = script.arguments
                    ? Object.keys(script.arguments).filter(
                        (el) => !script.arguments[el].value,
                    ).length === 0
                    : true
                break
            case 'annoTask':
                const { annoTask } = modalData.exportData
                if (
                    annoTask.name &&
                    annoTask.instructions &&
                    annoTask.assignee &&
                    annoTask.labelLeaves.length > 0 &&
                    annoTask.workerId &&
                    annoTask.selectedLabelTree
                ) {
                    verified = true
                } else {
                    verified = false
                }
                break
            case 'loop':
                verified = true
                break
            default:
                break
        }

        // verifyNode(modalData.peN, verified)

        const allNodesVerified = data.elements.filter((el) => {
            // because store is not yet updated check current Node validation
            if (el.peN === modalData.peN) {
                return !verified
            }
            return !el.verified
        }).length === 0

        verifyTab(1, allNodesVerified)
    }

    if (data && modalIdOpen > -1) {
        console.info("OPENING");
        const newModalData = data.elements.filter(
            (el) => el.peN === step.modalClickedId,
        )[0]

        setModalData(newModalData)
    }

    return (
        <Modal
            onClosed={verifyNode}
            size="lg"
            // isOpen={step.modalOpened}
            // toggle={() => toggleModal(step.modalClickedId)}
            isOpen={modalIdOpen > -1}
        // toggle={() => {
        //     console.info("MCID", step.modalClickedId)
        //     toggleModal(-1)
        // }}
        >
            {data && modalIdOpen > -1 && modalData && (
                <>
                    <ModalHeader>{modalData.title}</ModalHeader>
                    <ModalBody>{selectModal()}</ModalBody>
                </>
            )}

            <ModalFooter>
                <IconButton
                    color="secondary"
                    isOutline={false}
                    icon={faCheck}
                    text="Okay"
                    onClick={toggleModal}
                />
            </ModalFooter>
        </Modal>
    )
}

// const mapStateToProps = (state) => {
//     return {
//         step: state.pipelineStart.stepper.steps[1],
//         data: state.pipelineStart.step1Data,
//     }
// }

// export default connect(mapStateToProps, { toggleModal, verifyNode, verifyTab })(BaseModal)
export default BaseModal