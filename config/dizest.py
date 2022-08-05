import os
import season

def cwd():
    user_id = wiz.session.get("id")
    config = wiz.model("dizest").config()
    storage_path = None
    try:
        storage_path = config.storage_path
        if storage_path is None:
            storage_path = os.path.join(config.path, 'storage')    
    except:
        storage_path = os.path.join(season.path.project, 'storage')
    
    return os.path.join(storage_path, user_id)
