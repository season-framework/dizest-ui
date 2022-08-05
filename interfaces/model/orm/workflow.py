import peewee as pw
base = wiz.model("orm/base")

class Model(base):
    class Meta:
        db_table = 'workflow'

    id = pw.CharField(primary_key=True, max_length=16)
    user_id = pw.CharField(index=True, max_length=32)
    title = pw.CharField(index=True, max_length=96)
    version = pw.CharField(index=True, max_length=24)
    visibility = pw.CharField(index=True, max_length=16)
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
    
    logo = pw.TextField()
    featured = pw.TextField()
    description = pw.TextField()

    apps = base.JSONField()
    flow = base.JSONField()
    extra = base.JSONObject()
