import React from 'react';
import ReactDOM from 'react-dom';

const Hud = (props) => {
  return (
    <div className='Hud'>
      <b>Level: </b> {props.level}
      <b> HP:</b> {props.HP}
      <b> XP:</b> {props.XP}
      <b> Weapon: </b> {props.weapon}
      <b> Attack:</b> {props.attack}
      <b> Inventory:</b> {props.items.join(', ')}
      
    </div>
  );
}
const DisplayMessage = (props) => {
  let messageStr;
  if(props.currentMessage.length > 0){
    messageStr = props.currentMessage.join('...');
  }
  else {
    messageStr = 'Journal: ';
  }

  return (
    <div className='DisplayMessage'>
      <b>{messageStr}</b>
    </div>
  );
}
class MainDungeonGrid extends React.Component {
  constructor(props) {
    super(props);
    let width = this.props.width;
    let height = this.props.height;

    let gridArr = [];
    for(var y = 0; y < height; y++) {
      let row = [];
      for(var x = 0; x < width; x++) {
        row.push({
          type: 'cell',
          id: '',
          x: x,
          y: y
        });
      }
      gridArr.push(row);
    }

    this.state = {
      grid: gridArr,
      width: width,
      height: height,
      rooms: [],
      roomCounter: 0,
      player: '',
      currentMessage: [],
      darkness: true
    };
  }
  componentDidMount = () => {
    window.addEventListener('keydown', this.handleKeyPress);
  };
  componentWillMount = () => {
    this.setupDungeon();
  };
  componentWillUnmount = () => {
    window.removeEventListener('keydown', this.handleKeyPress);
  };
  toggleDarkness = () => {
    this.setState({
      darkness: !this.state.darkness
    });
  };
  checkLevel = (player) => {
    let levelArr = {
      1: 25,
      2: 50,
      3: 100,
      4: 150,
      5: 225
    }
    let levelStats = {
      1: {
        maxHp: 10,
        currentHp: 10,
        attack: 4        
      },
      2: {
        maxHp: 15,
        currentHp: 15,
        attack: 6
      },
      3: {
        maxHp: 20,
        currentHp: 20,
        attack: 10
      },
      4: {
        maxHp: 26,
        currentHp: 26,
        attack: 13
      },
      5: {
        maxHp: 32,
        currentHp: 32,
        attack: 17
      }
    }
    // let player = this.state.player; tester34ws
    if(player.xp >= levelArr[player.level]) {
      player.level++;
      player.maxHp = levelStats[player.level].maxHp;
      player.currentHp = levelStats[player.level].currentHp;
      player.attack = levelStats[player.level].attack;
    }
    return player;
  };
  fightEnemy = (enemyLocation) => {
    let grid = this.state.grid;
    let player = this.state.player;
    let messages = [];
    
    let DMGCHART = {
      'Unarmed': [1,2,4],
      'Shortsword': [4,5,7],
      'Longsword': [5,7,9]
    }
    //Player attacks enemy
    function damageRoll() {
      let roll = Math.floor(Math.random() * DMGCHART[player.weapon].length);
      return DMGCHART[player.weapon][roll];
    }
    let damage = (0.25*player.level*player.attack) + damageRoll();
    grid[enemyLocation].contents.hp -= damage;
    
    messages.push('Attacked '+grid[enemyLocation].contents.enemyName+' for '+damage+' dmg, enemy HP: '+grid[enemyLocation].contents.hp);
   
    
    //Check if enemy dies
    if(grid[enemyLocation].contents.hp <= 0) {
      messages.push('Killed '+grid[enemyLocation].contents.enemyName+'!');
      player.xp += grid[enemyLocation].contents.xp;
      player = this.checkLevel(player);
      grid[enemyLocation].contents = grid[enemyLocation].contents.drops;
    }
    //If enemy survived, enemy attacks player
    else{
      player.currentHp -= grid[enemyLocation].contents.attack;
      messages.push(grid[enemyLocation].contents.enemyName+' attacks for '+grid[enemyLocation].contents.attack+' damage!');
    }
    //Check if player dies
    if(player.currentHp <= 0) {
      messages.push('You died!');

      this.setupDungeon();
      return;
    }
    this.setState({
        grid: grid,
        player: player,
        currentMessage: messages
    });
  };

  randomRange = (min, max) => {
    let randomReturn = min + Math.round(Math.random() * (max-min));
    return randomReturn;
  };

  renderRoom = (attempts) => {
    let roomSizing = [3, 15];
    let roomMin = roomSizing[0];
    let roomMax = roomSizing[1];
    let gridCopy = this.state.grid;
    var rooms = this.state.rooms;
    // var roomCounter = 0;
    var roomCounter = this.state.roomCounter;
    
    //Attempt rendering rooms n times
    for(var d = 0; d < attempts; d++){
      let xStart = this.randomRange(2, this.state.width-roomMax-1);
      let yStart = this.randomRange(2, this.state.height-roomMax-1);
      let startPoint = [xStart, yStart];
      let roomHeight = this.randomRange(roomMin, roomMax);
      let roomWidth = this.randomRange(roomMin, roomMax);

      //Extending wall up roomHeight units and out roomWidth units from starting point
      if((yStart + (roomHeight)) < this.state.height-1 && (xStart + (roomWidth)) < this.state.width-1) {
        let collision = false;
        for(var y = yStart-2; y <= yStart+(roomHeight+1); y++) {
          for(var x = xStart-2; x <= xStart+(roomWidth+1); x++) {
            if(gridCopy[y][x].type !== 'cell') {
              collision = true;
              // console.log('Collision at cell '+x,y);
              break;
            }
          }
        }
        if(collision == false) {
          // console.log('No collisions, rendering room.');
          roomCounter++;
          let room = {
            xStart: xStart,
            yStart: yStart,
            height: roomHeight,
            width: roomWidth, 
            connected: false,
            roomNum: roomCounter
          };

          rooms.push(room);

          //Fill in floor row by row
          for(var y = yStart; y <= yStart+(roomHeight-1); y++) {
            for(var x = xStart; x <= xStart+(roomWidth-1); x++) {
              gridCopy[y][x].type = 'floor';
              gridCopy[y][x].id = roomCounter;
            }
          }
          //call drawPath
          gridCopy = this.drawPath(room, gridCopy, roomCounter);
        }
        else {
          // console.log('collision detected');
        }
      }

      else {
        // console.log('Room crossed grid edges');
      }
    }
    
    return {
      grid: gridCopy,
      rooms: rooms,
      roomCounter: roomCounter
    };

    // this.setState({
    //   grid: gridCopy,
    //   rooms: rooms,
    //   roomCounter: roomCounter
    // }); 
  };

  drawPath = (room, grid, roomNum) => {
    let directions = [
            {direction: 'up',
            'axis': 'y',
              calc: -1},
            {direction: 'down',
            'axis': 'y',
              calc: 1},
            {direction: 'left',
            'axis': 'x',
            calc: -1},
            {direction: 'right',
            'axis': 'x',
            calc: 1}];

      let pathX = this.randomRange(room.xStart, room.xStart+room.width-1);
      let pathY = this.randomRange(room.yStart, room.yStart+room.height-1);
      let currentPath = {'x': pathX, 'y': pathY};
      //start loop
      if(roomNum > 1){
        while(!room.connected){
          //Random direction
          let randomDirection = this.randomRange(0,directions.length-1);

          //Random number of spaces and css again and again
          let nSpaces = this.randomRange(2, 11);

          //Draw n spaces in specified direction, checking for connection
          for(let n = 0; n < nSpaces; n++) {
            //Make sure it stays within grid edges
            let axis = directions[randomDirection].axis;

            let nextMove = JSON.parse(JSON.stringify(currentPath));
            nextMove[axis] += directions[randomDirection].calc;

            if(grid[nextMove['y']] != undefined && grid[nextMove['y']][nextMove['x']]){
              currentPath[axis] += directions[randomDirection].calc;

              if(grid[currentPath['y']][currentPath['x']].type == 'floor' && grid[currentPath['y']][currentPath['x']].id != roomNum)
                {
                  // console.log('Path successfully connected');
                  room.connected = true;
                }
              else{
                grid[currentPath['y']][currentPath['x']].type = 'floor';
                grid[currentPath['y']][currentPath['x']].id = roomNum;
              }
            }
            else {
              // console.log('went over grid edges');
              break;
            }        
          }

        }
      }
    return grid;

  };
  setupDungeon = (experiencedPlayer) => {
    // //Iterate through tilemap and create objects for each tile + its contents
    // let gridArr = [];
    // for(var x = 0; x < tileMaps[this.state.mapLevel].length; x++) {
    //   let contents = '';
    //   if(tileMaps[this.state.mapLevel][x] == 1) {
    //     contents = 'wall';    
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 2) {
    //     contents = 'door';
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 4) {
    //     contents = 'key';
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 3) {
        
    //     contents =  {
    //       type: 'enemy',
    //       enemyName: 'Slime',
    //       hp: 10,
    //       attack: 2,
    //       xp: 10,
    //       drops: (Math.random() < 0.3? 'Shortsword': Math.random() < 0.6 ? 'key' : '')
    //     }
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 8) {
    //     contents =  {
    //       type: 'enemy',
    //       enemyName: 'Chief Orc',
    //       hp: 50,
    //       attack: 10,
    //       xp: 50,
    //       drops: (Math.random() < 0.75? 'Longsword': 'potion')
    //     }
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 5) {
    //     contents = 'potion';
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 6) {
    //     contents = 'stairsUp';
    //   }
    //   else if(tileMaps[this.state.mapLevel][x] == 7) {
    //     contents = 'treasure';
    //   }
      
    //   gridArr.push({
    //     contents: contents,
    //     id: x,
    //     dark: true
    //   });
    // }
    
    //Run renderRooms with n attempts
    var gridArr = this.state.grid;
    var updatedArr = this.renderRoom(50);
    gridArr = updatedArr.grid;
    var rooms = updatedArr.rooms;
    var roomCounter = updatedArr.roomCounter; 
    
    //Set player starting location
    var playerStartX;
    var playerStartY;
    rooms.forEach((room) => {
      if(room.roomNum == 1){
        playerStartX = this.randomRange(room.xStart, room.xStart+room.width-1);
        playerStartY = this.randomRange(room.yStart, room.yStart+room.height-1);
        // console.log('playerStartX: '+playerStartX);
        // console.log('playerStartY: '+playerStartY); 
      }
    });
   //Starting player object
    let player;
    if(experiencedPlayer){
      player = experiencedPlayer;
      player.locationX = playerStartX;
      player.locationY = playerStartY;
    }
    else{
      player = {
        locationX: playerStartX,
        locationY: playerStartY,
        maxHp: 10,
        currentHp: 10,
        attack: 4,
        xp: 0,
        level: 1,
        inventory: [],
        weapon: 'Unarmed'
      }
    };

    gridArr[player.locationY][player.locationX].type = 'player';
    
    //Place enemies and items based on map level
    // gridArr = this.placeEnemies(gridArr);

    //Update state
    this.setState({
      grid: gridArr,
      player: player,
      rooms: rooms,
      roomCounter: roomCounter
    });
  };
  placeEnemies = (grid) => {
    let numEnemies = 0;
    while(numEnemies < 5) {
      let randomX = this.randomRange(0, this.state.width-1);
      let randomY = this.randomRange(0, this.state.height-1);
      if(grid[randomY][randomX].type == 'floor'){
        grid[randomY][randomX].type = 'slime';
        numEnemies++;
        console.log('Slime at '+randomX+', '+randomY);
      }
    }
    return grid;
  };
  handleMove = (grid, player, direction) => {
    let directions = [
            {direction: 'up',
            'axis': 'y',
              calc: -1},
            {direction: 'down',
            'axis': 'y',
              calc: 1},
            {direction: 'left',
            'axis': 'x',
            calc: -1},
            {direction: 'right',
            'axis': 'x',
            calc: 1}];
    let messages = [];
    let currentLocation = {'x': player.locationX, 'y': player.locationY};
    let nextMove = JSON.parse(JSON.stringify(currentLocation));
    var directionObj;
    directions.forEach((obj) => {
      if(obj.direction == direction) {
        directionObj = obj;
      }
    });
    nextMove[directionObj.axis] += directionObj.calc;

    if(grid[nextMove['y']] != undefined && grid[nextMove['y']][nextMove['x']] && grid[nextMove['y']][nextMove['x']].type != 'cell') {
      if(grid[nextMove.y][nextMove.x].type == 'floor') {
        grid[currentLocation.y][currentLocation.x].type = 'floor';
        player.locationX = nextMove.x;
        player.locationY = nextMove.y;
        grid[player.locationY][player.locationX].type = 'player';
      }
      // else if(grid[nextMove.y][nextMove.x].type == 'path') {
      //   grid[currentLocation.y][currentLocation.x].type = 'path';
      //   player.locationX = nextMove.x;
      //   player.locationY = nextMove.y;
      //   grid[player.locationY][player.locationX].type = 'player';
      // }
      // else if(grid[player.location+directions[direction]].contents == 'key') {
      //   grid[player.location].contents = '';
      //   player.location += directions[direction];
      //   player.inventory.push(grid[player.location].contents);
      //   messages.push('Picked up '+grid[player.location].contents+'!');
      //   grid[player.location].contents = 'player';
      // }
      // else if (grid[player.location+directions[direction]].contents == 'Shortsword' ||
      //          grid[player.location+directions[direction]].contents == 'Longsword') {
      //   player.weapon = grid[player.location+directions[direction]].contents;
      //   grid[player.location].contents = '';
      //   player.location += directions[direction];
      //   messages.push('Equipped '+grid[player.location].contents+'!');
      //   grid[player.location].contents = 'player';
      // }
      // else if(grid[player.location+directions[direction]].contents == 'door') {
      //   let keyIndex = player.inventory.indexOf('key');
      //   if(keyIndex !== -1){
      //     messages.push('You unlocked the door!');
      //     grid[player.location].contents = '';
      //     player.location += directions[direction];
      //     grid[player.location].contents = 'player'
          
      //     //Delete key from inventory
      //     player.inventory.splice(keyIndex, 1);
      //   }
      //   else {
      //     messages.push("You don't have the key!");
      //   }
      // }
      // else if(grid[player.location+directions[direction]].contents.type == 'enemy') {
      //   let enemyLocation = player.location+directions[direction];
      //   this.fightEnemy(enemyLocation);
      //   return;
      // }
      // else if(grid[player.location+directions[direction]].contents == 'potion') {
      //   //Need to implement max HP attribute for player
      //   let healedHp = player.currentHp + 10;
      //   player.currentHp = Math.min(player.maxHp, healedHp);
      //   grid[player.location].contents = '';
      //   player.location += directions[direction];
      //   grid[player.location].contents = 'player'
      // }
      // else if(grid[player.location+directions[direction]].contents == 'stairsUp') {
      //   this.setState({
      //     mapLevel: this.state.mapLevel+1
      //   })
      //   this.setupDungeon(player);
      //   return;
      // }
      // else if(grid[player.location+directions[direction]].contents == 'treasure') {
      //   messages.push("Congratulations, you have defeated the boss and found the treasure!");
      // }
      // grid = this.fogOfWar(grid, player);
      
      this.setState({
              grid: grid,
              player: player,
              currentMessage: messages
        });
    }
    // else {das
    // }
  };
  handleKeyPress = (e) => {
    let player = this.state.player;
    let grid = this.state.grid;
    e.preventDefault();
    switch(e.key) {
      case 'ArrowUp':
        this.handleMove(grid, player, 'up');
        break;
      case 'ArrowDown':
        this.handleMove(grid, player, 'down');
        break;
      case 'ArrowLeft':
        this.handleMove(grid, player, 'left');
        break;
      case 'ArrowRight':
        this.handleMove(grid, player, 'right');
        break;
    }
  };
  render() {
    let player = this.state.player;
    let camera = {
      startX: player.locationX -12,
      startY: player.locationY -12,
      endX: player.locationX +12,
      endY: player.locationY +12
    };
    let tileCount = 0;
    let tileComps = this.state.grid.map((row) => {
      return row.map((tile) => {
        // console.log('tile.x: '+tile.x);
        // console.log('camera.startX: '+camera.startX);
        if(player.locationX < 12){
          camera.startX = 0;
          camera.endX = 24;
        }
        else if(player.locationX >= 49-12) {
          camera.endX = 49;
          camera.startX = 25;
        }
        if(player.locationY < 12){
          camera.startY = 0;
          camera.endY = 24;
        }
        else if(player.locationY >= 49-12) {
          camera.endY = 49;
          camera.startY = 25;
        }
        if(tile.x >= camera.startX &&
          tile.x <= camera.endX &&
          tile.y >= camera.startY &&
          tile.y <= camera.endY) {
            tileCount++;
            // console.log('dwgh: tile');
            let id = tile.x+','+tile.y;
            return <Tile id={id} contents={tile.type} dark={tile.dark}/>;
        }
        // else{
        //   let id = tile.x+','+tile.y;
        //   return <Tile id={id} contents={'dark'} />;
        // }
        // let id = tile.x+','+tile.y;
        // return <Tile id={id} contents={tile.type} dark={tile.dark}/>;
      });
      
    });
    // console.log(tileCount);
    return (
      <div>
        <Hud
          level={this.state.player.level}
          HP={this.state.player.currentHp}
          XP={this.state.player.xp}
          weapon = {this.state.player.weapon}
          attack={this.state.player.attack}
          items={this.state.player.inventory} />
        <DisplayMessage currentMessage={this.state.currentMessage} />
        <div className='MainDungeon'>
          {tileComps}
        </div>
        <button id='toggleDark' onClick={this.toggleDarkness}>Toggle Darkness</button>
      </div>
    );
  }
}
const PlayerComp = (props) => {
  return (
    <div className = 'player' id={props.id}>

    </div>
  )
}
class Tile extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var tileClass;
    var playerComponent = false;
    if(this.props.contents == 'player'){
      tileClass = 'floor';
      return (
        <div className={tileClass} id = {this.props.id}>
          <PlayerComp id={this.props.id} />
        </div>
      )
    }
    else{
      tileClass = this.props.contents;
    }

    // if(this.props.dark) {
    //   tileClass = 'Dark';
    // }
    // else if(this.props.contents == 'player') {
    //   tileClass = 'Player';
    // }
    // else if(this.props.contents == 'floor') {
    //   tileClass = 'floor';
    // }
    // else if(this.props.contents == 'cell') {
    //   tileClass = 'Wall';
    // }
    // else if(this.props.contents == 'key') {
    //   tileClass = 'Key';
    // }
    // else if(this.props.contents == 'door') {
    //   tileClass = 'Door';
    // }
    // else if(this.props.contents == 'Shortsword') {
    //   tileClass = 'ShortSword';
    // }
    // else if(this.props.contents == 'Longsword') {
    //   tileClass = 'LongSword'
    // }
    // else if(this.props.contents.enemyName == 'Slime') {
    //   tileClass = 'Slime';
    // }
    // else if(this.props.contents.enemyName == 'Chief Orc') {
    //   tileClass = 'ChiefOrc';
    // }
    // else if(this.props.contents == 'potion') {
    //   tileClass = 'Potion';
    // }
    // else if(this.props.contents =='stairsUp') {
    //   tileClass = 'StairsUp';
    // }
    // else if(this.props.contents =='treasure') {
    //   tileClass = 'Treasure';
    // }
    
    // else {
    //   tileClass='Tile';sdea
    // } 
    return (
      <div className={tileClass} id = {this.props.id}></div>
    );
  }
}    
               
ReactDOM.render(
  <MainDungeonGrid width={50} height={50}/>,
  document.getElementById('app')
);

