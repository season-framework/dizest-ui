import peewee as pw
base = wiz.model("dizest/orm/base")

class Model(base):
    class Meta:
        db_table = 'app'

    id = pw.CharField(primary_key=True, max_length=32)
    user_id = pw.CharField(index=True, max_length=32)
    title = pw.CharField(index=True, max_length=96)
    version = pw.CharField(index=True, max_length=24)
    mode = pw.CharField(index=True, max_length=32)
    visibility = pw.CharField(index=True, max_length=16)
    
    description = pw.TextField()
    code = pw.TextField()
    sample = pw.TextField()
    api = pw.TextField()
    pug = pw.TextField()
    js = pw.TextField()
    css = pw.TextField()
    logo = pw.TextField()
    featured = pw.TextField()
    inputs = base.JSONField()
    outputs = base.JSONField()
    cdn = base.JSONField()
