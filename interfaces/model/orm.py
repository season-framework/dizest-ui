import os

import datetime
import string as _string
import random as _random
import peewee as pw
from playhouse.shortcuts import model_to_dict, dict_to_model

class Model:
    def __init__(self, tablename=None):
        self.tablename = tablename
        self.orm = wiz.model(f"orm/{tablename}")
        
    @classmethod
    def use(cls, tablename=None):
        return cls(tablename=tablename)

    def create(self):
        self.orm.create_table()

    def random(self, length=16):
        string_pool = _string.ascii_letters + _string.digits
        result = ""
        for i in range(length):
            result += _random.choice(string_pool)
        return result.lower()

    def get(self, fields=None, **where):
        db = self.orm
        try:
            for key in where:
                field = getattr(db, key)
                db = db.get(field==where[key])
            data = model_to_dict(db)
            if fields is not None:
                obj = dict()
                fields = fields.split(",")
                for field in fields:
                    if field in data:
                        obj[field] = data[field]
                return obj
            return data
        except Exception as e:
            pass
        return None

    def count(self, like=None, **where):
        db = self.orm
        try:
            query = db.select(pw.fn.COUNT(db.id).alias("cnt"))
            if like is not None:
                like = like.split(",")
            
            for key in where:
                try:
                    field = getattr(db, key)
                    values = [where[key]]
                    if type(where[key]) == list:
                        values = where[key]

                    qo = None
                    for v in values:
                        if qo is None:
                            if like is not None and key in like:
                                qo = field.contains(v)
                            else:
                                qo = field==v
                        else:
                            if like is not None and key in like:
                                qo = (qo) | (field.contains(v))
                            else:
                                qo = (qo) | (field==v)
                    query = query.where(qo)
                except Exception as e:
                    pass

            return query[0].cnt
        except:
            pass
        return None

    def rows(self, query=None, order='ASC', orderby=None, page=None, dump=10, fields=None, like=None, **where):
        db = self.orm
        if query is None:
            query = db.select()

        if like is not None:
            like = like.split(",")

        for key in where:
            try:
                field = getattr(db, key)
                values = [where[key]]
                if type(where[key]) == list:
                    values = where[key]

                qo = None
                for v in values:
                    if qo is None:
                        if like is not None and key in like:
                            qo = field.contains(v)
                        else:
                            qo = field==v
                    else:
                        if like is not None and key in like:
                            qo = (qo) | (field.contains(v))
                        else:
                            qo = (qo) | (field==v)
                query = query.where(qo)
            except Exception as e:
                pass

        if orderby is not None:
            orderby = orderby.split(",")
            for i in range(len(orderby)):
                field = orderby[i]
                try:
                    field = getattr(db, field)
                    if order == 'DESC':
                        orderby[i] = field.desc()
                    else:
                        orderby[i] = field
                except:
                    pass
            query = query.order_by(*orderby)

        if page is not None:
            query = query.paginate(page, dump)
        rows = []

        if fields is not None:
            fields = fields.split(",")

        for row in query.dicts():
            if fields is not None:
                obj = dict()
                for field in fields:
                    if field in row:
                        obj[field] = row[field]
                rows.append(obj)
            else:
                rows.append(row)

        return rows
        
    def insert(self, *args, **data):
        if len(args) > 0: data = args[0]
        db = self.orm
        if 'id' not in data:
            obj_id = self.random()
            while self.get(id=obj_id) is not None:
                obj_id = self.random()
            data['id'] = obj_id
        else:
            obj_id = data['id']
        if self.get(id=obj_id) is not None:
            raise Exception("wizdb Error: Duplicated")
        db.create(**data)
        return obj_id

    def update(self, data, **where):
        db = self.orm
        query = db.update(**data)
        for key in where:
            field = getattr(db, key)
            query = query.where(field==where[key])
        query.execute()
        
    def delete(self, **where):
        db = self.orm
        query = db.delete()
        for key in where:
            field = getattr(db, key)
            query = query.where(field==where[key])
        query.execute()
    
    def upsert(self, data, keys="id"):
        keys = keys.split(",")
        wheres = dict()
        for key in keys:
            wheres[key] = data[key]
        check = self.get(**wheres)
        if check is not None:
            self.update(data, **wheres)
        else:
            self.insert(data)