import React, { useEffect } from 'react'
import { Form, FormGroup, Label, Input } from 'reactstrap'
import { CRow, CCol } from '@coreui/react'
import HelpButton from '../../../../components/HelpButton'

const StartPipelineForm = ({ pipelineName, pipelineDescription, setPipelineName, setPipelineDescription, verifyTab }) => {

    useEffect(() => {
        const isVerified = pipelineName.length > 0 && pipelineDescription.length > 0
        verifyTab(2, isVerified)
    }, [pipelineName, pipelineDescription, verifyTab])

    return (
        <>
            <CRow>
                <CCol sm="3"></CCol>
                <CCol sm="6">
                    <Form>
                        <FormGroup>
                            <Label for="name">Pipeline Name</Label>
                            <HelpButton
                                id={'pipeline-start-name'}
                                text={
                                    'Give your pipeline a name so that you can identify it later.'
                                }
                            />
                            <Input
                                value={pipelineName}
                                onChange={(e) => setPipelineName(e.target.value)}
                                type="text"
                                name="name"
                                id="name"
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="description">Pipeline Description</Label>
                            <HelpButton
                                id={'pipeline-start-desc'}
                                text={
                                    'Give your pipeline a description so that you still know later what you started it for.'
                                }
                            />
                            <Input
                                value={pipelineDescription}
                                onChange={(e) => setPipelineDescription(e.target.value)}
                                type="text"
                                name="description"
                                id="description"
                            />
                        </FormGroup>
                    </Form>
                </CCol>
                <CCol sm="3"></CCol>
            </CRow>
        </>
    )
}

export default StartPipelineForm