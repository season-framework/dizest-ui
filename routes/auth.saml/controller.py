import season
import os
import datetime
from urllib.parse import urlparse
from onelogin.saml2.auth import OneLogin_Saml2_Auth

model = wiz.model("mysql").use("user")

action = wiz.request.segment.action
SAML_PATH = wiz.path("config/saml/season")

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
        uinfodict = {'uid': 'id', 'name': 'username'}
        sessiondata = dict()
        for key in userinfo:
            try:
                v = userinfo[key][0]
                if key in uinfodict: 
                    key = uinfodict[key]
                sessiondata[key] = v
            except:
                pass

        userinfo = model.get(id=sessiondata['id'])
        if userinfo is None:
            userinfo = dict()
            userinfo['id'] = sessiondata['id']
            userinfo['username'] = sessiondata['username']
            userinfo['email'] = sessiondata['email']
            userinfo['created'] = datetime.datetime.now()
            userinfo['last_access'] = datetime.datetime.now()
            userinfo['role'] = 'user'
            model.upsert(userinfo)
        else:
            userinfo['last_access'] = datetime.datetime.now()
            model.upsert(userinfo)

        sessiondata['role'] = userinfo['role']
 
        relaystate = wiz.request.query('RelayState')
        redirect = wiz.session.get('SAML_REDIRECT', '/')
        wiz.session.delete('SAML_REDIRECT')

        sessiondata['samlNameId'] = auth.get_nameid()
        sessiondata['samlNameIdFormat'] = auth.get_nameid_format()
        sessiondata['samlNameIdNameQualifier'] = auth.get_nameid_nq()
        sessiondata['samlNameIdSPNameQualifier'] = auth.get_nameid_spnq()
        sessiondata['samlSessionIndex'] = auth.get_session_index()

        wiz.session.set(**sessiondata)
        wiz.response.redirect(redirect)

    wiz.response.redirect('/auth/error')

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