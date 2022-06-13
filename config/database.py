from season import stdClass

# use sqlite
orm = stdClass()
orm.type = 'sqlite'
orm.path = 'wiz.db'

# # for use mysql
# orm.type = 'mysql'
# orm.host = '127.0.0.1'
# orm.user = 'dbuser'
# orm.password = 'dbpass'
# orm.database = 'dbname'
# orm.charset = 'utf8'