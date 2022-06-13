import os

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
        try:
            self.orm.create_table()
        except Exception as e:
            pass

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
        except:
            pass
        return None

    def count(self, **where):
        db = self.orm
        try:
            query = db.select(pw.fn.COUNT(db.id).alias("cnt"))
            for key in where:
                field = getattr(db, key)
                query = query.where(field==where[key])
            return query[0].cnt
        except:
            pass
        return 0

    def rows(self, order='ASC', orderby=None, page=None, dump=10, fields=None, like=None, **where):
        db = self.orm
        query = db.select()

        if like is not None:
            like = like.split(",")

        for key in where:
            try:
                field = getattr(db, key)
                qo = field==where[key]
                if key in like:
                    qo = field.contains(where[key])
                query = query.where(qo)
            except:
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
        
    def insert(self, data):
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