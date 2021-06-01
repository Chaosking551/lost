import datetime
from flask_ldap3_login import LDAP3LoginManager, AuthenticationResponseStatus
from lost.settings import LOST_CONFIG, FLASK_DEBUG
from flask_jwt_extended import create_access_token, create_refresh_token
from lost.db.model import User as DBUser, Group
from lost.db import roles
config = dict()

# Setup LDAP Configuration Variables. Change these to your own settings.
# All configuration directives can be found in the documentation.

# Hostname of your LDAP Server
config['LDAP_HOST'] = 'ldap_host'
config['LDAP_PORT'] = 389

# Define objectclass of group
config['LDAP_GROUP_OBJECT_FILTER'] = '(objectclass=posixGroup)'

# Base DN of your directory
config['LDAP_BASE_DN'] = 'dc=example,dc=com'

# Users DN to be prepended to the Base DN
config['LDAP_USER_DN'] = 'ou=OrganizationUnit'

# Groups DN to be prepended to the Base DN
config['LDAP_GROUP_DN'] = '' #ou=groups

# The RDN attribute for your user schema on LDAP
config['LDAP_USER_RDN_ATTR'] = 'cn'

# The Attribute you want users to authenticate to LDAP with.
config['LDAP_USER_LOGIN_ATTR'] = 'uid'

# The Username to bind to LDAP with
config['LDAP_BIND_USER_DN'] = 'cn=binduser,dc=example,dc=com'

# The Password to bind to LDAP with
config['LDAP_BIND_USER_PASSWORD'] = 'bindUserPassword'

# Specify the server connection should use SSL
config['LDAP_USE_SSL'] = False

# Instruct Flask-LDAP3-Login to not automatically add the server
config['LDAP_ADD_SERVER'] = True

config['LDAP_ACTIVE'] = True

class LoginManager():
    def __init__(self, dbm, user_name, password):
        self.dbm = dbm
        self.user_name = user_name
        self.password = password
    
    def login(self):
        if config['LDAP_ACTIVE']:
            access_token, refresh_token = self.__authenticate_ldap()
        else:
            access_token, refresh_token = self.__authenticate_flask()

        if access_token and refresh_token:
            return {
                'token': access_token,
                'refresh_token': refresh_token
            }, 200
        return {'message': 'Invalid credentials'}, 401
    
    def __get_token(self, user_id): 
        expires = datetime.timedelta(minutes=LOST_CONFIG.session_timeout)
        expires_refresh = datetime.timedelta(minutes=LOST_CONFIG.session_timeout + 2)
        if FLASK_DEBUG:
            expires = datetime.timedelta(days=365)
            expires_refresh = datetime.timedelta(days=366)
        access_token = create_access_token(identity=user_id, fresh=True, expires_delta=expires)
        refresh_token = create_refresh_token(user_id, expires_delta=expires_refresh)
        return access_token, refresh_token

    def __authenticate_flask(self):
        if self.user_name:
            user = self.dbm.find_user_by_user_name(self.user_name)
        if user and user.check_password(self.password):
            return self.__get_token(user.idx)
        return None, None
            
    def __authenticate_ldap(self):
        # auth with ldap
        ldap_manager = LDAP3LoginManager()
        ldap_manager.init_config(config)

        # Check if the credentials are correct
        response = ldap_manager.authenticate(self.user_name, self.password)
        print(response.status)
        if response.status != AuthenticationResponseStatus.success:
            # no user found in ldap, try it with db user:
            return self.__authenticate_flask()
        user_info = response.user_info
        user = self.dbm.find_user_by_user_name(self.user_name)
        # user not in db:
        if not user:
            user = self.__create_db_user(user_info)
        else:
            # user in db -> synch with ldap
            user = self.__update_db_user(user_info, user)
        return self.__get_token(user.idx)
    
    def __create_db_user(self, user_info): 
        user = DBUser(user_name=user_info['uid'], email=user_info['mail'],
                    email_confirmed_at=datetime.datetime.now(), first_name=user_info['givenName'],
                    last_name=user_info['sn'], is_external=True)
        anno_role = self.dbm.get_role_by_name(roles.ANNOTATOR)
        user.roles.append(anno_role)
        user.groups.append(Group(name=user.user_name, is_user_default=True))
        self.dbm.save_obj(user)
        return user

    def __update_db_user(self, user_info, user):
        user.email = user_info['mail']
        user.first_name = user_info['givenName']
        user.last_name = user_info['sn']
        self.dbm.save_obj(user)
        return user