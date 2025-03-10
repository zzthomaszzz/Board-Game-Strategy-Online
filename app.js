var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use('/public', express.static(__dirname + '/public'));

serv.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });

//Game System

class Hero{
    constructor(id){
        this.speed = 5;
        this.x = 0;
        this.y = 0;
        this.height = 80;
        this.width = 40;
        this.id = id;
    }
}

Hero.list = {};
SOCKET_LIST = {};

var io=require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id=Math.random();
    Hero.list[socket.id] = new Hero(socket.id);
    console.log("New connection added");
    console.log(Hero.list);

    //Init pack for new connection only
    socket.emit("init", Hero.list);

    //Adding new player data to other Sockets
    for (var i in SOCKET_LIST){
        SOCKET_LIST[i].emit('addPlayer', Hero.list[socket.id]);
    }
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect', function(){
        delete Hero.list[socket.id];
        console.log("Deleted id " + socket.id);
        console.log(Hero.list);

        //To do 
        delete SOCKET_LIST[socket.id];
        for ( var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('removePlayer', socket.id);
        }

    })
});