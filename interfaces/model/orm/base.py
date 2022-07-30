import os
import season
import peewee as pw
import bcrypt
import json

class Model(pw.Model):
    class Meta:
        config = wiz.model("dizest").config()
        dbconfig = config.db
        if dbconfig.config is None: dbconfig.config = dict()
        if dbconfig.type == 'mysql':
            database = pw.MySQLDatabase(dbconfig.database, **dbconfig.config)
        else:
            BASEPATH = season.path.project
            sqlitedb = os.path.realpath(os.path.join(BASEPATH, '..', 'dizest.db'))
            database = pw.SqliteDatabase(sqlitedb)

    class PasswordField(pw.TextField):
        def db_value(self, value):
            value = bcrypt.hashpw(value.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            return value

        def python_value(self, value):
            if value is None:
                return None
            value = value.encode('utf-8')
            def check_password(password):
                password = password.encode('utf-8')
                return bcrypt.checkpw(password, value)
            return check_password

    class JSONField(pw.TextField):
        def db_value(self, value):
            return json.dumps(value)

        def python_value(self, value):
            try:
                if value is not None:
                    return json.loads(value)
            except Exception as e:
                pass
            return []
