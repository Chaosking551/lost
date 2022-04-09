import { useState, useCallback, useRef } from 'react'
import axios from 'axios'
import { API_URL } from '../../lost_settings'
import { useQuery, useMutation } from 'react-query'

// axios.defaults.headers.common.Authorization = `Bearer ${localStorage.getItem('token')}`

export const useSubmitNewPipelineTemplate = () => {
    const isUploadBreaked = useRef()
    isUploadBreaked.current = false
    const [state, setState] = useState({
        idle: true,
    })

    const breakUpload = () => {
        isUploadBreaked.current = true
    }

    const mutate = useCallback(async (obj) => {
        const formData = new FormData()
        formData.append('zip_file', obj.zip_file)
        formData.append('vis_level', obj.vis_level)
        setState({ progress: 0 })
        try {
            const cancelTokenSource = axios.CancelToken.source()
            const response = await axios.request({
                method: 'post',
                cancelToken: cancelTokenSource.token,
                url: `${API_URL}/pipeline/template/import`,
                data: formData,
                onUploadProgress: (p) => {
                    if (isUploadBreaked.current) {
                        cancelTokenSource.cancel()
                    }
                    setState({
                        progress: p.loaded / p.total,
                    })
                },
            })
            setState({
                isSuccess: response.data === 'success',
                pipelineTemplateId: response.data.idx,
            })
        } catch (error) {
            setState({ error })
        }
        setState({
            idle: true,
        })
    })
    return [state, mutate, breakUpload]
}

export const usePipelineTemplates = (visLevel) => {
    return useQuery(
        ['pipeTemplates'],
        () =>
            axios.get(`${API_URL}/pipeline/template/${visLevel}`).then((res) => res.data),
        {
            initialData: null,
        },
    )
}

export const useDeletePipelineTemplate = () => {
    return useMutation((data) =>
        axios.post(`${API_URL}/pipeline/template/delete`, data).then((res) => res.data),
    )
}
