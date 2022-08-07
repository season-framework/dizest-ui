config = dict()
config['db'] = dict()
config['db']['type'] = 'sqlite'

obj = dict()
obj['name'] = 'base'
obj['title'] = 'base'
obj["kernel"] = "$EXECUTABLE $LIBSPEC_PATH/python/kernel.py $PORT"
obj["package_install"] = "$EXECUTABLE -m pip install --upgrade $PACKAGE"
obj["package_list"] = "$EXECUTABLE -m pip freeze"
obj["language"] = "python"
config["kernelspec"] = [obj]

kwargs['config'] = config