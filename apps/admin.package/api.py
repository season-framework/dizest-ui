import pkg_resources
import subprocess
import sys

if wiz.session.get("role") != "admin":
    wiz.response.abort(401)

package = wiz.model("dizest").package()
kernelspecs = package['kernelspec']

kernel_name = wiz.request.query("kernel_name", True)
kernel = None
for kernelspec in kernelspecs:
    if kernelspec['name'] == kernel_name:
        kernel = kernelspec
        break
if kernel is None:
    wiz.response.status(404)

EXECUTABLE = str(sys.executable)
PACKAGE_INSTALLER = ""
try:
    PACKAGE_INSTALLER = kernel['package_install'].replace("$EXECUTABLE", EXECUTABLE)
    PACKAGE_LIST = kernel['package_list'].replace("$EXECUTABLE", EXECUTABLE)
    PACKAGE_LIST = PACKAGE_LIST.split(" ")
except Exception as e:
    wiz.response.status(500)

def package_installer():
    try:
        PACKAGE_INSTALLER = kernel['package_install'].replace("$EXECUTABLE", EXECUTABLE)
        package = str(wiz.request.query("package", True))
        PACKAGE_INSTALLER = PACKAGE_INSTALLER.replace("$PACKAGE", package)
        PACKAGE_INSTALLER = PACKAGE_INSTALLER.split(" ")
        output = subprocess.run(PACKAGE_INSTALLER, capture_output=True)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200, str(output.stdout.decode("utf-8")))

def load():
    output = subprocess.run(PACKAGE_LIST, capture_output=True)
    output = output.stdout.decode("utf-8")
    output = output.split("\n")
    installed = []
    for i in range(len(output)):
        if len(output[i]) == 0: continue
        output[i] = output[i].split("==")
        if len(output[i]) == 1:
            output[i] = output[i][0].replace(" ", "").split("@")
        obj = dict()
        obj['name'] = output[i][0]
        try:
            obj['version'] = output[i][1]
        except:
            pass
        installed.append(obj)
    wiz.response.status(200, installed)
