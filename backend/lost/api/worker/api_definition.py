from flask_restx import fields
from lost.api.api import api

worker = api.model('Worker', {
    'idx': fields.Integer(readOnly=True, description='The identifier of the worker'),
    'env_name': fields.String(description="Worker environments"),
    'worker_name': fields.String(description='Worker name'),
    'timestamp': fields.DateTime(description='Worker last activity'),
    'register_timestamp': fields.DateTime(description='Worker register date'),
    'resources': fields.String(description='Worker resources'),
    'in_progress': fields.String(description='Worker jobs'),
})


worker_list = api.model('WorkerList', {
    'workers': fields.List(fields.Nested(worker)),
})
