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
        this.speed = 2;
        this.x = 5;
        this.y = 3;
        this.height = 50;
        this.width = 50;
        this.id = id;
    }
}

Hero.list = {};
SOCKET_LIST = {};

var io=require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id=Math.random();
    Hero.list[socket.id] = new Hero(socket.id);
    //To remove
    console.log("New connection added");
    console.log(Hero.list);

    //Init pack for new connection only
    socket.emit("init", Hero.list, socket.id);

    //Adding new player data to other Sockets
    for (var i in SOCKET_LIST){
        SOCKET_LIST[i].emit('addPlayer', Hero.list[socket.id]);
    }
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect', function(){
        delete Hero.list[socket.id];
        //To remove
        console.log("Deleted id " + socket.id);
        console.log(Hero.list);

        delete SOCKET_LIST[socket.id];
        for ( var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('removePlayer', socket.id);
        }
    })

    //Selecting Heroes

    socket.on('selectPlayer', function(data){
        var possibleMoves = [];
        var hero = Hero.list[data];

        var y = -hero.speed;
        for(y; y <= hero.speed; y++){
            var x = -hero.speed;
            for(x; x <= hero.speed; x++){
                possibleMoves.push([x + hero.x , y + hero.y]);
            }
        }
        socket.emit('showMoves', possibleMoves);
    })

    socket.on('moveTo', function(data, id){
        Hero.list[id].x = data[0];
        Hero.list[id].y = data[1];
        for (var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('update', Hero.list[id]);
        }
    })

});