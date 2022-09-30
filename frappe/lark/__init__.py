import frappe
import requests
import frappe.utils.oauth
import urllib

__version__ = '0.0.1'

@frappe.whitelist(allow_guest=True)
def login():
  lark_settings = frappe.get_doc('Lark Settings')
  redirect_url = frappe.utils.get_url('/api/method/frappe.lark.login_callback')
  redirect_url = urllib.parse.quote_plus(redirect_url)

  frappe.local.response['type'] = 'redirect'
  frappe.local.response['location'] = 'https://open.larksuite.com/open-apis/authen/v1/index?redirect_uri=' + redirect_url + '&app_id=' + lark_settings.app_id
  return

@frappe.whitelist(allow_guest=True)
def login_callback():
  lark_settings = frappe.get_doc('Lark Settings')
  app_access_token = lark_settings.get_app_access_token()
  code = frappe.local.request.args.get('code')
  r = requests.post('https://open.larksuite.com/open-apis/authen/v1/access_token', json={
    'app_access_token': app_access_token,
    'grant_type': 'authorization_code',
    'code': code,
  })
  r = r.json()

  if (r['code'] == 0):
    user = r['data']

    if frappe.db.exists('User Social Login', { 'provider': 'lark', 'userid': user['open_id'] }) or lark_settings.allow_new_users:
      # Fill in sub field for OAuth compliance
      user['sub'] = user['open_id']
      user['gender'] = ''

      frappe.utils.oauth.login_oauth_user(user, provider='lark', state={
        'token': user['access_token']
      })
      return
    else:
      frappe.throw('You don\'t have permission to access this application.')

  return r

def get_lark_settings():
  settings = frappe.get_doc('Lark Settings')

  if settings and not settings.ready():
    return None

  return settings

def create_lark_user(user, method):
  if frappe.db.exists('User Social Login', { 'provider': 'lark', 'parent': user.name }):
    # User is pre-created
    return

  lark_settings = get_lark_settings()

  if lark_settings:
    tenant_access_token = lark_settings.get_tenant_access_token()
    emails = []
    mobiles = []

    if user.email:
      emails.append(user.email)

    if user.mobile_no:
      mobiles.append(user.mobile_no)

    # Find user
    r = requests.post('https://open.larksuite.com/open-apis/contact/v3/users/batch_get_id?user_id_type=open_id', headers={
      'Authorization': 'Bearer ' + tenant_access_token
    }, json={
      'emails': emails
    }).json()
    lark_user_id = ''
    lark_settings.handle_response_error(r)

    if r.get('data') and r.get('data').get('user_list') and len(r.get('data').get('user_list')):
      for lark_user in r.get('data').get('user_list'):
        if lark_user.get('user_id'):
          lark_user_id = lark_user.get('user_id')
          break

    if not lark_user_id:
      # Fall back to creating the user
      r = requests.post('https://open.larksuite.com/open-apis/contact/v3/users', headers={
        'Authorization': 'Bearer ' + tenant_access_token
      }, json={
        'name': user.full_name,
        'email': user.email,
        'mobile': user.mobile_no,
        'employee_type': 1,
        'department_ids': [0]
      }).json()

      lark_settings.handle_response_error(r)
      lark_user_id = r.get('data').get('user').get('open_id')

    user.append('social_logins', {
      'provider': 'lark',
      'userid': lark_user_id,
    })
    user.save(ignore_permissions=True)

  frappe.db.commit()

def delete_lark_user(user, method):
  for login in user.social_logins:
    if login.provider == 'lark':
      lark_settings = get_lark_settings()

      if lark_settings:
        tenant_access_token = lark_settings.get_tenant_access_token()
        r = requests.delete('https://open.larksuite.com/open-apis/contact/v3/users/' + login.get('userid'), headers={
          'Authorization': 'Bearer ' + tenant_access_token
        }).json()
        lark_settings.handle_response_error(r)

      return
