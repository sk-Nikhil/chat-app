const path = require('path')

const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = 3000;
const publicDirectory = path.join(__dirname,"../public")

app.use(express.static(publicDirectory))

// let count = 0;

// server(emit) --> client(receive)  - countUpdated
// client(emit) --> server(receive)  -increment

io.on('connection', (socket)=>{
    console.log("new websocket connection") 


    socket.on('join', ({username, room}, callback)=>{
        const {error, user} = addUser({ id:socket.id, username, room })
        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome!!   ', 'Admin'))
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined`, 'Admin'))

        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback()
        // io.to.emit
    })

    // server receives the message emitted by client
    // client  -->  server --> io
    socket.on('sendMessage', (message, acknowledge)=>{
        const {username, room} = getUser(socket.id)

        const filter = new Filter()
        filter.addWords("sachin")
        if(filter.isProfane(message)) {
            return acknowledge("vulgar language is not allowed")
        }

        // client emits the message to all connections
        io.to(room).emit('message', generateMessage(message, username))
        acknowledge()
    })

    // client -->  server  --> io
    socket.on('sendLocation', (location, acknowledge)=>{
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage',generateLocationMessage(`https://google.com/maps?q=${location.latitude},${location.longitude}`, user.username))
        acknowledge()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
            
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, ()=>console.log(`server is up on port ${port}`))