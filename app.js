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
        this.speed = 3;
        this.x = 5;
        this.y = 3;
        this.id = id;
    }
}

Hero.list = {};
SOCKET_LIST = {};

// Map

//May not need these variables below.
const width = 800;
const height = 600;
const size = 50;
const tileX = width / size;;
const tileY = height / size;

//Map here.

var map = [
    [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
];

function isMovable(x, y){
    if (map[x][y] == 0){
        return false;
    }
    return true;
}


var io=require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id=Math.random();
    Hero.list[socket.id] = new Hero(socket.id);

    //Init pack for new connection only
    socket.emit("init", Hero.list, socket.id);
    socket.emit('mapInit', map);

    //Adding new player data to other Sockets
    for (var i in SOCKET_LIST){
        SOCKET_LIST[i].emit('addPlayer', Hero.list[socket.id]);
    }
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect', function(){
        delete Hero.list[socket.id];
        delete SOCKET_LIST[socket.id];
        for ( var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('removePlayer', socket.id);
        }
    })

    //Selecting Heroes

    socket.on('selectPlayer', function(data){
        var possibleMoves = [];
        var hero = Hero.list[data];

        //this below works but need a but we dont want hero to have too much space.
        /*var y = -hero.speed;
        for(y; y <= hero.speed; y++){
            var x = -hero.speed;
            for(x; x <= hero.speed; x++){
                possibleMoves.push([x + hero.x , y + hero.y]);
            }
        } */

        var y = -hero.speed;
        for(y; y <= hero.speed; y++){
            var x = Math.abs(y) - hero.speed;
            var length = Math.abs(x * 2) + 1;
            for(var i = 1; i <= length; i ++){
                possibleMoves.push([x + hero.x , y + hero.y]);
                x++;
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
