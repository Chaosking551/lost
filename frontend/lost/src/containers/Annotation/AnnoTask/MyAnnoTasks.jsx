import React, { useState, useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Progress, Card, CardHeader, CardBody, Row, Col } from 'reactstrap'
import { CRow, CCol, CFormInput, CButtonToolbar } from '@coreui/react'
import { getColor } from './utils'
import AmountPerLabel from './AmountPerLabel'
import IconButton from '../../../components/IconButton'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { createColumnHelper } from '@tanstack/react-table'
import 'react-table/react-table.css'
import { faChartBar, faCheck, faPencil, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FaFilter, FaTrashAlt } from 'react-icons/fa'

import DropdownInput from '../../../components/DropdownInput'
import SingleInputDateRangePicker from '../../../components/SingleInputDateRangePicker'
import DataTable from '../../../components/NewDataTable'
import actions from '../../../actions'
import * as atActions from '../../../actions/annoTask/anno_task_api'

const { getAnnoTaskStatistic } = actions

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '85%',
        height: '85%',
        maxWidth: '75rem',
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
}

const MyAnnoTasks = ({ callBack, annoTasks }) => {
    const { t } = useTranslation()
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [aTData, setATData] = useState([])
    const [page, setPage] = useState(0)
    const [pages, setPages] = useState(null)
    const [pageSize, setPageSize] = useState(10)
    const [annoTaskListRandKey, setAnnoTaskListRandKey] = useState()
    const [datatableInfo, setDatatableInfo] = useState()
    const dispatch = useDispatch()
    const specificAnnoTaskStatistic = useSelector(
        (state) => state.annoTask.annoTaskStatistic,
    )
    const [resetFilters, setResetFilters] = useState(false)
    const [beginFilterDate, setBeginFilterDate] = useState()
    const [endFilterDate, setEndFilterDate] = useState()
    const [filteredStates, setFilteredStates] = useState([])
    const [filteredName, setFilteredName] = useState('')

    const openModal = useCallback(() => setModalIsOpen(true), [])
    const closeModal = useCallback(() => setModalIsOpen(false), [])

    const handleRowClick = useCallback(
        (annoTask) => {
            const { id, type, status } = annoTask
            if (status === 'inProgress') {
                callBack(id, type)
            }
        },
        [callBack],
    )
    const {
        isLoading: isLoadingAnnoTaskListData,
        data: annoTaskListData,
        status,
        mutate,
    } = atActions.useAnnotaskListFiltered()

    const {
        data: filterLabels,
        isLoading: filterLabelsLoading,
        refetch: fetchFilterLabels,
    } = atActions.useFilterLabels()

    const handleStatisticsClick = useCallback(
        (annoTask) => {
            dispatch(getAnnoTaskStatistic(annoTask.id))
            openModal()
        },
        [dispatch, openModal],
    )
    useEffect(() => {
        fetchFilterLabels()
    }, [])

    const refetch = () => {
        mutate({
            pageSize: datatableInfo.pageSize,
            page: datatableInfo.page,
            annoTaskListRandKey,
            sorted: datatableInfo.sorted,
            filterOptions: {
                beginFilterDate,
                endFilterDate,
                filteredStates,
                filteredName,
            },
        })
    }
    useEffect(() => {
        if (annoTaskListRandKey) {
            refetch()
            fetchFilterLabels()
        }
    }, [annoTaskListRandKey])

    useEffect(() => {
        setAnnoTaskListRandKey(Date.now().toString())
    }, [])

    useEffect(() => {
        if (datatableInfo) {
            setPageSize(datatableInfo.pageSize)
            setPage(datatableInfo.page)
            setAnnoTaskListRandKey(Date.now().toString())
        }
    }, [datatableInfo])

    useEffect(() => {
        if (annoTaskListData) {
            setPages(annoTaskListData.pages)
            setATData(annoTaskListData.rows)
        }
    }, [annoTaskListData])

    const handleStateUpdate = (label) => {
        setFilteredStates(label)
    }

    const applyFilter = () => {
        setAnnoTaskListRandKey(Date.now().toString())
    }

    useEffect(() => {
        setResetFilters(false)
    }, [resetFilters])

    const resetFilter = () => {
        setResetFilters(true)
        setFilteredName('')
    }

    const renderStatistic = () => {
        if (specificAnnoTaskStatistic) {
            return (
                <div>
                    <Row>
                        <Col xs="3" md="3" xl="3">
                            <div className="callout callout-danger">
                                <small className="text-muted">Working on</small>
                                <br />
                                <strong>{specificAnnoTaskStatistic.name}</strong>
                            </div>
                        </Col>
                        <Col xs="3" md="3" xl="3">
                            <div className="callout callout-info">
                                <small className="text-muted">Pipeline</small>
                                <br />
                                <strong>{specificAnnoTaskStatistic.pipelineName}</strong>
                            </div>
                        </Col>
                        <Col xs="3" md="3" xl="3">
                            <div className="callout callout-warning">
                                <small className="text-muted">Annotations</small>
                                <br />
                                <strong className="h4">
                                    {specificAnnoTaskStatistic.finished}/
                                    {specificAnnoTaskStatistic.size}
                                </strong>
                            </div>
                        </Col>
                        <Col xs="3" md="3" xl="3">
                            <div className="callout callout-success">
                                <small className="text-muted">Seconds/Annotation</small>
                                <br />
                                <strong className="h4">
                                    &#8709;{' '}
                                    {specificAnnoTaskStatistic.statistic.secondsPerAnno}
                                </strong>
                            </div>
                        </Col>
                    </Row>
                    <AmountPerLabel
                        stats={specificAnnoTaskStatistic.statistic.amountPerLabel}
                    />
                </div>
            )
        } else {
            return <div>No Data available.</div>
        }
    }

    const renderStatisticModal = () => (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            style={customStyles}
            ariaHideApp={false}
            contentLabel="Logfile"
        >
            <Card style={{ height: '90%' }}>
                <CardHeader>
                    <i className="icon-chart"></i> Statistics
                </CardHeader>
                <CardBody style={{ height: '100%' }}>{renderStatistic()}</CardBody>
            </Card>
            <CRow className="justify-content-end" style={{ marginRight: '5px' }}>
                <IconButton
                    isOutline={false}
                    color="secondary"
                    icon={faTimes}
                    text="Close"
                    onClick={closeModal}
                />
            </CRow>
        </Modal>
    )

    const defineColumns = () => {
        const columnHelper = createColumnHelper()

        let columns = []

        columns = [
            ...columns,
            columnHelper.accessor('name', {
                header: 'Name',
                cell: ({ row }) => (
                    <>
                        <div>{row.original.name}</div>
                        <div className="small text-muted">ID: {row.original.id}</div>
                    </>
                ),
                size: 250,
            }),
            columnHelper.accessor('pipelineName', {
                header: 'Pipeline',
                cell: ({ row }) => (
                    <>
                        <div>{row.original.pipelineName}</div>
                        <div className="small text-muted">
                            Created by: {row.original.pipelineCreator}
                        </div>
                    </>
                ),
            }),
            columnHelper.accessor('group', {
                header: 'Group / User',
                cell: ({ row }) => <div>{row.original.group}</div>,
            }),
            columnHelper.accessor('progress', {
                header: 'Progress',
                cell: ({ row }) => {
                    const progress = Math.floor(
                        (row.original.finished / row.original.size) * 100,
                    )
                    return (
                        <>
                            <div className="clearfix">
                                <div className="float-left">
                                    <strong>{progress}%</strong>
                                </div>
                                <div className="float-right">
                                    <small className="text-muted">
                                        Started at:{' '}
                                        {new Date(
                                            row.original.createdAt,
                                        ).toLocaleString()}
                                    </small>
                                </div>
                            </div>
                            <Progress
                                className="progress-xs"
                                color={getColor(progress)}
                                value={progress}
                            />
                            <div className="small text-muted">
                                {row.original.finished}/{row.original.size}
                            </div>
                        </>
                    )
                },
                size: 300,
            }),
            columnHelper.accessor('type', {
                header: 'Annotation Type',
                cell: ({ row }) => <strong>{row.original.type}</strong>,
            }),
            columnHelper.accessor('lastActivity', {
                header: 'Activity',
                cell: ({ row }) => (
                    <>
                        {row.original.lastActivity ? (
                            <>
                                <strong>
                                    {new Date(row.original.lastActivity).toLocaleString()}
                                </strong>
                                <div className="small text-muted">
                                    by {row.original.lastAnnotator}
                                </div>
                            </>
                        ) : (
                            ''
                        )}
                    </>
                ),
            }),
            columnHelper.display({
                id: 'statistic',
                header: 'Statistic',
                cell: ({ row }) => {
                    const progress = Math.floor(
                        (row.original.finished / row.original.size) * 100,
                    )
                    return (
                        <IconButton
                            onClick={() => handleStatisticsClick(row.original)}
                            color="primary"
                            disabled={progress > 0 ? false : true}
                            text="Statistic"
                            icon={faChartBar}
                        />
                    )
                },
            }),
            columnHelper.display({
                id: 'annotate',
                header: 'Annotate',
                cell: ({ row }) => {
                    const progress = Math.floor(
                        (row.original.finished / row.original.size) * 100,
                    )
                    return (
                        <>
                            {row.original.status === 'inProgress' ? (
                                <IconButton
                                    onClick={() => handleRowClick(row.original)}
                                    color="primary"
                                    isOutline={false}
                                    text="Annotate"
                                    icon={faPencil}
                                />
                            ) : (
                                <IconButton
                                    onClick={() => handleRowClick(row.original)}
                                    color="primary"
                                    isOutline={false}
                                    disabled
                                    text="Finished"
                                    icon={faCheck}
                                />
                            )}
                        </>
                    )
                },
            }),
        ]

        return columns
    }

    const stateAnnoTask = [
        { id: 2, label: 'In progress' },
        { id: 3, label: 'Finished' },
    ]

    const renderFilter = () => {
        return (
            <>
                {filterLabels && (
                    <>
                        <CCol>
                            <CButtonToolbar
                                // className="justify-left"
                                style={{
                                    marginBottom: 10,
                                    marginTop: 10,
                                }}
                            >
                                <DropdownInput
                                    onLabelUpdate={(label) => handleStateUpdate(label)}
                                    placeholder={'State'}
                                    options={stateAnnoTask}
                                    reset={resetFilters}
                                />
                                <CFormInput
                                    type="search"
                                    style={{ width: 200, marginLeft: 20 }}
                                    value={filteredName}
                                    onChange={(e) => {
                                        setFilteredName(e.target.value)
                                    }}
                                    relatedId={[1]}
                                    placeholder="Name"
                                />
                                <IconButton
                                    onClick={() => resetFilter()}
                                    color="danger"
                                    isOutline={false}
                                    style={{ marginLeft: 20 }}
                                    text="Reset filter"
                                    icon={<FaTrashAlt />}
                                />
                                <IconButton
                                    onClick={() => applyFilter()}
                                    color="primary"
                                    isOutline={false}
                                    style={{ marginLeft: 20 }}
                                    text="Apply filter"
                                    icon={<FaFilter />}
                                />
                            </CButtonToolbar>
                            <CButtonToolbar
                                className=" justify-content-between "
                                style={{
                                    marginBottom: 10,
                                    marginTop: 10,
                                }}
                            >
                                {/* <CCol className="d-flex">
                                    <div style={{ margin: 'auto', marginLeft: 0 }}>
                                        <SingleInputDateRangePicker
                                            style={{ marginLeft: 5 }}
                                            beginDate={beginFilterDate}
                                            endDate={endFilterDate}
                                            setBeginDate={setBeginFilterDate}
                                            setEndDate={setEndFilterDate}
                                            disabled={false}
                                            showPopUp={false}
                                        />
                                    </div>
                                </CCol> */}
                                <CCol className="justify-content-end d-flex"></CCol>
                            </CButtonToolbar>
                        </CCol>
                    </>
                )}
            </>
        )
    }

    return (
        <>
            {renderStatisticModal()}
            <CCol sm="12">{filterLabels && renderFilter()}</CCol>
            <DataTable
                className="mt-3"
                data={aTData}
                columns={defineColumns()}
                onPaginationChange={(table) => {
                    setATData([])
                    const tableState = table.getState()
                    setDatatableInfo({
                        pageSize: tableState.pagination.pageSize,
                        page: tableState.pagination.pageIndex,
                        sorted: tableState.sorting,
                        filtered: tableState.columnFilters,
                    })
                }}
                pageCount={pages}
            />
        </>
    )
}

export default MyAnnoTasks