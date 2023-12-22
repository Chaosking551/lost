import React, { useEffect } from 'react'
import actions from '../../../../actions/pipeline/pipelineStart'
import { connect } from 'react-redux'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import IconButton from '../../../../components/IconButton'
import Datatable from '../../../../components/Datatable'
import HelpButton from '../../../../components/HelpButton'
// const { getTemplates, getTemplate } = actions
const { getTemplates, verifyTab, getTemplate } = actions

const SelectPipeline = ({ step0Data, getTemplates, getTemplate, selectTab, setIsTab0Verified }) => {

    useEffect(() => {
        const fetchData = async () => {
            await getTemplates('all')
        }
        fetchData()
    }, [getTemplates])

    const selectRow = async (id) => {
        await getTemplate(id)
        setIsTab0Verified(true)
        selectTab(1)
    }

    const renderDatatable = () => {
        if (step0Data) {
            if (step0Data.error) {
                return (
                    <div className="pipeline-error-message">{step0Data.error}</div>
                )
            }
            const tableData = step0Data.response.templates.map((el) => ({
                ...el,
            }))
            return (
                <Datatable
                    columns={[
                        {
                            Header: 'Name / Project',
                            accessor: 'name',
                            Cell: (row) => {
                                return (
                                    <>
                                        {' '}
                                        <b>{row.original.name.split('.')[1]}</b>{' '}
                                        <div className="small text-muted">
                                            {`${row.original.name.split('.')[0]}`}
                                        </div>
                                    </>
                                )
                            },
                        },
                        {
                            Header: 'Description',
                            accessor: 'description',
                            Cell: (row) => {
                                return (
                                    <HelpButton
                                        id={row.original.id}
                                        text={row.original.description}
                                    />
                                )
                            },
                        },
                        // {
                        //     Header: 'Imported on',
                        //     Cell: (row) => {
                        //         return new Date(row.original.date).toLocaleString()
                        //     },
                        //     accessor: 'date',
                        //     sortMethod: (date1, date2) => {
                        //         if (new Date(date1) > new Date(date2)) {
                        //             return -1
                        //         }
                        //         return 1
                        //     },
                        // },
                        {
                            Header: 'Start',
                            Cell: (row) => {
                                return (
                                    <IconButton
                                        color="primary"
                                        size="m"
                                        isOutline={false}
                                        onClick={() => selectRow(row.original.id)}
                                        icon={faPlay}
                                        text="Start"
                                    />
                                )
                            },
                            accessor: 'id',
                        },
                    ]}
                    // getTrProps={(state, rowInfo) => ({
                    //     onClick: () => selectRow(rowInfo.original.id),
                    // })}
                    defaultSorted={[
                        {
                            id: 'date',
                            desc: false,
                        },
                    ]}
                    data={tableData}
                    defaultPageSize={10}
                    className="-striped -highlight"
                />
            )
        }
    }

    return <div className="pipeline-start-1">{renderDatatable()}</div>
}

const mapStateToProps = (state) => {
    return {
        // step0Data: state.pipelineStart.step0Data,
    }
}

export default connect(mapStateToProps, {
    getTemplates,
    // selectTab,
    verifyTab,
    getTemplate,
})(SelectPipeline)
