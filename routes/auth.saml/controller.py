import season
import os
import datetime
from urllib.parse import urlparse
from onelogin.saml2.auth import OneLogin_Saml2_Auth

model = wiz.model("orm").use("users")

action = wiz.request.segment.action

SAML_PATH = wiz.path("config/saml/webinar")

def build_auth():
    request = wiz.request.request()
    url_data = urlparse(request.url)

    req = {
        'https': 'on' if request.scheme == 'https' else 'off',
        'http_host': request.host,
        'server_port': url_data.port,
        'script_name': request.path,
        'get_data': request.args.copy(),
        'post_data': request.form.copy(),
        'query_string': request.query_string
    }

    return OneLogin_Saml2_Auth(req, custom_base_path=SAML_PATH)

if action == 'login':
    if wiz.session.has("id"):
        wiz.response.redirect("/")
    
    redirect = wiz.request.query('redirect', '/')
    auth = build_auth()
    wiz.session.set(AuthNRequestID=auth.get_last_request_id(), SAML_REDIRECT=redirect)
    url = auth.login()
    wiz.response.redirect(url)

elif action == 'acs':
    request_id = wiz.session.get('AuthNRequestID', None)
    auth = build_auth()
    auth.process_response(request_id=request_id)
    errors = auth.get_errors()
    error_reason = auth.get_last_error_reason()

    if len(errors) == 0:
        if request_id is not None:
            wiz.session.delete('AuthNRequestID')
        
        userinfo = auth.get_attributes()

        if userinfo is not None:
            eppn = userinfo['eduPersonPrincipalName'][0]
            username = userinfo['displayName'][0]
            email = userinfo['mail'][0]
            nameid = auth.get_nameid()
            nameidformat = auth.get_nameid_format()
            nameid_nq = auth.get_nameid_nq()
            nameid_spnq = auth.get_nameid_spnq()

            user = model.rows(edupersonprincipal=eppn)
            if len(user) == 0:
                insert_data = dict()
                insert_data['idp_id'] = 'https://saml.kafe.or.kr/idp/simplesamlphp'
                insert_data['userid'] = nameid
                insert_data['edupersonprincipal'] = eppn
                insert_data['email'] = email
                insert_data['username'] = username
                insert_data['last_access'] = datetime.datetime.now()
                insert_data['role'] = 'user'
                model.insert(insert_data)
                user = model.rows(edupersonprincipal=eppn)
                user = user[0]
            else:
                user = user[0]
                insert_data = dict()
                insert_data['idp_id'] = 'https://saml.kafe.or.kr/idp/simplesamlphp'
                insert_data['userid'] = nameid
                insert_data['email'] = email
                insert_data['username'] = username
                insert_data['last_access'] = datetime.datetime.now()
                model.update(insert_data, id=user['id'])

            
            affi = eppn.split("@")[1]
            orgs = wiz.model("orm").use('options').get(key="orgs")
            try:
                orgs = orgs['value']
                orgs = orgs.split("\n")
                for i in range(len(orgs)):
                    orgs[i] = orgs[i].strip().replace(" ", "")
            except:
                orgs = []

            user['auth'] = 'premium'
            if affi in orgs:
                user['auth'] = 'normal'
            if user['role'] == 'admin':
                user['auth'] = 'premium'
 
        relaystate = wiz.request.query('RelayState')
        redirect = wiz.session.get('SAML_REDIRECT', '/')
        wiz.session.delete('SAML_REDIRECT')

        user['samlNameId'] = auth.get_nameid()
        user['samlNameIdFormat'] = auth.get_nameid_format()
        user['samlNameIdNameQualifier'] = auth.get_nameid_nq()
        user['samlNameIdSPNameQualifier'] = auth.get_nameid_spnq()
        user['samlSessionIndex'] = auth.get_session_index()
        user['name'] = user['username']
        user['code'] = user['edupersonprincipal']

        wiz.session.set(**user)
        wiz.response.redirect(redirect)

    wiz.response.redirect('/')

elif action == 'logout':
    auth = build_auth()
    name_id = wiz.session.get('samlNameId', None)
    name_id_format = wiz.session.get('samlNameIdFormat', None)
    name_id_nq = wiz.session.get('samlNameIdNameQualifier', None)
    name_id_spnq = wiz.session.get('samlNameIdSPNameQualifier', None)
    session_index = wiz.session.get('samlSessionIndex', None)
    wiz.response.redirect(auth.logout(name_id=name_id, session_index=session_index, nq=name_id_nq, name_id_format=name_id_format, spnq=name_id_spnq))

elif action == 'sls':
    auth = build_auth()
    request_id = wiz.session.get('LogoutRequestID', None)

    wiz.session.clear()
    url = auth.process_slo(request_id=request_id)

    errors = auth.get_errors()
    if len(errors) == 0:
        if url is not None:
            wiz.response.redirect(url)
    elif auth.get_settings().is_debug_active():
        auth.get_last_error_reason()
    wiz.response.redirect('/')

elif action == 'metadata':
    auth = build_auth()
    settings = auth.get_settings()
    metadata = settings.get_sp_metadata()
    errors = settings.validate_metadata(metadata)
    
    if len(errors) == 0:
        metadata = metadata.decode('utf-8')
        wiz.response.send(metadata, content_type='text/xml')
    else:
        wiz.response.send(', '.join(errors))

wiz.response.status(404)