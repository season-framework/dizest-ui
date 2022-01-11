# import datetime

# class Controller:
#     def __init__(self, wiz):
#         print("master")
#         self.cache = wiz.cache
#         self.room = "public"
        
#     def join(self, wiz, data):
#         wiz.flask_socketio.join_room(self.room, namespace=wiz.socket.namespace)
#         msg = dict()
#         msg["type"] = "init"
#         msg["data"] = self.cache.get("message", [])
#         wiz.socket.emit("message", msg, to=self.room, broadcast=True)

#     def message(self, wiz, data):
#         message = data["message"]
#         user_id = wiz.lib.util.randomstring(6)
#         msg = dict()
#         msg["type"] = "message"
#         msg["user"] = user_id
#         msg["message"] = message
#         msg["time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#         with self.cache.open("message", []) as cache:
#             try:
#                 cache['message'].append(msg)
#                 cache['message'] = cache['message'][-100:]
#             except:
#                 cache['message'] = []
#                 cache['message'].append(msg)
#                 cache['message'] = cache['message'][-100:]

#         wiz.socket.emit("message", msg, to=self.room)
    
#     def connect(self, wiz, data):
#         pass

#     def disconnect(self, wiz, data):            
#         msg = dict()
#         msg["type"] = "users"
#         wiz.socket.emit("message", msg, to=self.room, broadcast=True)
