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
        this.x = 0;
        this.y = 0;
        this.id = id;
    }

    getAllReachableTiles(){
        var reachableTiles = [];
        var y = -this.speed;
        for(y; y <= this.speed; y++){
            var x = Math.abs(y) - this.speed;
            var length = Math.abs(x * 2) + 1;
            for(var i = 1; i <= length; i ++){
                if(map.isMovable(x + this.x , y + this.y)){
                    reachableTiles.push([x + this.x , y + this.y]);
                }
                x++;
            }
        }
        return reachableTiles;
    }
}

Hero.list = {};
SOCKET_LIST = {};

// Map

class Map {
    constructor(){
        //16 * 12
        this.map = [
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
    }

    isMovable(x, y){
        if(x >= 0 && x < 16 && y >= 0 && y < 12){
            if (this.map[y][x] == 0){
                return true;
            }
        }
        return false;
    }

    inArray(x, y, array){
        for (var i in array){
            if (array[i][0] == x && array[i][1] == y){
                return true;
            }
        }
        return false;
    }

    refineMovableTiles(array){
        var finalMovableTiles = [];
        for (var i in array){
            var adj = false;
            //check right
            if (this.inArray(array[i][0] + 1, array[i][1], array)){
                adj = true;
            }
            //check left
            else if (this.inArray(array[i][0] - 1, array[i][1], array)){
                adj = true;
            }
            //check top
            else if (this.inArray(array[i][0], array[i][1] - 1, array)){
                adj = true;
            }
            //check bottom
            else if (this.inArray(array[i][0], array[i][1] + 1, array)){
                adj = true;
            }
            else{
                adj = false;
            }
            if (adj){
                finalMovableTiles.push([array[i][0], array[i][1]])
            }
        }
        return finalMovableTiles;

    }
}

var map = new Map();

var io=require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id=Math.random();
    Hero.list[socket.id] = new Hero(socket.id);

    //Init pack for new connection only
    socket.emit("init", Hero.list, socket.id);
    // socket.emit('mapInit', map);

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
        var hero = Hero.list[data];
        var reachableTiles = hero.getAllReachableTiles();
        var movableTiles = map.refineMovableTiles(reachableTiles);


        //this below works but need a but we dont want hero to have too much space.
        /*var y = -hero.speed;
        for(y; y <= hero.speed; y++){
            var x = -hero.speed;
            for(x; x <= hero.speed; x++){
                possibleMoves.push([x + hero.x , y + hero.y]);
            }
        } */

        // var y = -hero.speed;
        // for(y; y <= hero.speed; y++){
        //     var x = Math.abs(y) - hero.speed;
        //     var length = Math.abs(x * 2) + 1;
        //     for(var i = 1; i <= length; i ++){
        //         if(isMovable(x + hero.x , y + hero.y)){
        //             possibleMoves.push([x + hero.x , y + hero.y]);
        //         }
        //         x++;
        //     }
        // }

        socket.emit('showMoves', movableTiles);
    })

    socket.on('moveTo', function(data, id){
        Hero.list[id].x = data[0];
        Hero.list[id].y = data[1];
        for (var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('update', Hero.list[id]);
        }
    })
});
