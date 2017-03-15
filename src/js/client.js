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
      <b> Dungeon Level:</b>{props.mapLevel}
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
    // let gridArr = [];
    // for(var y = 0; y < height; y++) {
    //   let row = [];
    //   for(var x = 0; x < width; x++) {
    //     row.push({
    //       type: 'cell',
    //       id: '',
    //       x: x,
    //       y: y
    //     });
    //   }
    //   gridArr.push(row);
    // }
    this.state = {
      grid: [],
      width: width,
      height: height,
      rooms: [],
      roomCounter: 0,
      player: '',
      currentMessage: [],
      mapLevel: 1,
      viewAll: false
    };
  }
  componentDidMount = () => {
    window.addEventListener('keydown', this.handleKeyPress);
  };
  componentWillMount = () => {
    this.setupDungeon(null, 1);
  };
  componentWillUnmount = () => {
    window.removeEventListener('keydown', this.handleKeyPress);
  };
  toggleViewAll = () => {
    let dungeonStyle = document.getElementById('MainDungeon');
    if(dungeonStyle.className == 'MainDungeon'){
      dungeonStyle.className = 'ViewAll';
    }
    else{
      dungeonStyle.className = 'MainDungeon';
    }
    
    this.setState({
      viewAll: !this.state.viewAll
    });
  }
  checkLevel = (player) => {
    let levelArr = {
      1: 25,
      2: 50,
      3: 100,
      4: 150,
      5: 225
    }//that's where you're wrong boyo
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
  fightEnemy = (enemyX, enemyY) => {
    let grid = this.state.grid;
    let player = this.state.player;
    let messages = [];
    
    let DMGCHART = {
      'unarmed': [1,2,4],
      'shortsword': [4,5,7],
      'longsword': [5,7,9]
    }
    //Player attacks enemy
    function damageRoll() {
      let roll = Math.floor(Math.random() * DMGCHART[player.weapon].length);
      return DMGCHART[player.weapon][roll];
    }
    let damage = (0.25*player.level*player.attack) + damageRoll();
    grid[enemyY][enemyX].enemyStats.hp -= damage;
    
    messages.push('Attacked '+grid[enemyY][enemyX].enemyStats.enemyName+' for '+damage+' dmg, enemy HP: '+grid[enemyY][enemyX].enemyStats.hp);
   
    
    //Check if enemy dies
    if(grid[enemyY][enemyX].enemyStats.hp <= 0) {
      messages.push('Killed '+grid[enemyY][enemyX].enemyStats.enemyName+'!');
      player.xp += grid[enemyY][enemyX].enemyStats.xp;
      player = this.checkLevel(player);
      if (grid[enemyY][enemyX].enemyStats.drops.length > 0){
        grid[enemyY][enemyX].type = grid[enemyY][enemyX].enemyStats.drops;
      }
      else{
        grid[enemyY][enemyX].type = 'floor';
      }
      
    }
    //If enemy survived, enemy attacks player
    else{
      player.currentHp -= grid[enemyY][enemyX].enemyStats.attack;
      messages.push(grid[enemyY][enemyX].enemyStats.enemyName+' attacks for '+grid[enemyY][enemyX].enemyStats.attack+' damage!');
    }
    //Check if player dies
    if(player.currentHp <= 0) {
      messages.push('You died!');

      this.setupDungeon(null, 1);
      return;
    }
    console.log('do we res');
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

  renderRoom = (attempts, grid, rooms) => {
    let roomSizing = [3, 15];
    let roomMin = roomSizing[0];
    let roomMax = roomSizing[1];
    let gridCopy = grid;
    // var rooms = this.state.rooms;
    var roomCounter = 0;
    // var roomCounter = this.state.roomCounter;d
    
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
  setupDungeon = (experiencedPlayer, mapLevel) => {
  //Set initial grid skeleton
    console.log('generating new skeleton grid');
    var gridArr = [];
    for(let y = 0; y < this.state.height; y++) {
      let row = [];
      for(let x = 0; x < this.state.width; x++) {
        row.push({
          type: 'cell',
          id: '',
          x: x,
          y: y
        });
      }
      gridArr.push(row);
    }
    
    //Run renderRooms with n attempts at a valid room
    let rooms = [];
    var updatedArr = this.renderRoom(50, gridArr, rooms);
    gridArr = updatedArr.grid;
    rooms = updatedArr.rooms;
    var roomCounter = updatedArr.roomCounter; 
    
    //Set player starting location
    var playerStartX;
    var playerStartY;
    rooms.forEach((room) => {
      if(room.roomNum == 1){
        playerStartX = this.randomRange(room.xStart, room.xStart+room.width-1);
        playerStartY = this.randomRange(room.yStart, room.yStart+room.height-1);
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
        weapon: 'unarmed'
      }
    };

    gridArr[player.locationY][player.locationX].type = 'player';
    
    //Place enemies and items based on map level
    gridArr = this.placeEnemies(gridArr);
    gridArr = this.placeItems(gridArr);

    //Place end of level staircase
    const setFinalRoom = (grid, rooms) => {
      let finalRoom = rooms[rooms.length-1].roomNum-1;
      let randomX = this.randomRange(rooms[finalRoom].xStart, rooms[finalRoom].xStart+rooms[finalRoom].width-1);
      let randomY = this.randomRange(rooms[finalRoom].yStart, rooms[finalRoom].yStart+rooms[finalRoom].height-1);

      //If it's the final level of the dungeon, spawn the boss enemy instead of another staircase
      if(mapLevel == 3){
        grid[randomY][randomX].type = 'enemy';
        grid[randomY][randomX].enemyStats = {
          enemyName: 'chiefOrc',
          hp: 50,
          attack: 9,
          xp: 100,
          drops: 'treasure'
        }
        return grid;
      }
      else{
        grid[randomY][randomX].type = 'staircase';
        return grid;
      }
      
    };
    // console.log('test');
    gridArr = setFinalRoom(gridArr, rooms);
    //Update state
    this.setState({
      grid: gridArr,
      player: player,
      rooms: rooms,
      roomCounter: roomCounter,
      mapLevel: mapLevel
    });
  };
  placeEnemies = (grid) => {
    let numEnemies = 0;
    while(numEnemies < 5) {
      let randomX = this.randomRange(0, this.state.width-1);
      let randomY = this.randomRange(0, this.state.height-1);
      if(grid[randomY][randomX].type == 'floor'){
        grid[randomY][randomX].type = 'enemy';
        grid[randomY][randomX].enemyStats = {
          enemyName: 'slime',
          hp: 10,
          attack: 3,
          xp: 10,
          drops: (Math.random() < 0.3? 'shortsword': Math.random() < 0.3 ? 'potion' : '')
        }
        numEnemies++;
        // console.log('Slime at '+randomX+', '+randomY); 
      }
    }
    return grid;
  };
  placeItems = (grid) => {
    let weaponLevels = {
      1: ['shortsword'],
      2: ['shortsword', 'longsword'],
      3: ['longsword'],
    }
    let numPotions = 0;
    let numWeapons = 0; 
    while(numPotions < 3) {
      let randomX = this.randomRange(0, this.state.width-1);
      let randomY = this.randomRange(0, this.state.height-1);
      if(grid[randomY][randomX].type == 'floor'){
        grid[randomY][randomX].type = 'potion';
        numPotions++;
        // console.log('Slime at '+randomX+', '+randomY);
      }
    }
    while(numWeapons < 2){
      let randomX = this.randomRange(0, this.state.width-1);
      let randomY = this.randomRange(0, this.state.height-1);
      let randomWeapon = weaponLevels[this.state.mapLevel][this.randomRange(0,weaponLevels[this.state.mapLevel].length-1)];
      // console.log(randomWeapon);
      if(grid[randomY][randomX].type == 'floor'){
        grid[randomY][randomX].type = randomWeapon;
        numWeapons++;
      }
    }
    return grid;
  }
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
    // let mapLevel = this.state.mapLevel;
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

      else if (grid[nextMove.y][nextMove.x].type == 'shortsword' || grid[nextMove.y][nextMove.x].type == 'longsword') {
        player.weapon = grid[nextMove.y][nextMove.x].type;
        grid[player.locationY][player.locationX].type = 'floor';
        player.locationX = nextMove.x;
        player.locationY = nextMove.y;
        messages.push('Equipped '+grid[nextMove.y][nextMove.x].type+'!');
        grid[player.locationY][player.locationX].type = 'player';
      }
      else if(grid[nextMove.y][nextMove.x].type == 'potion') {
        //Need to implement max HP attribute for player
        let healedHp = player.currentHp + 10;
        player.currentHp = Math.min(player.maxHp, healedHp);
        grid[player.locationY][player.locationX].type = 'floor';
        player.locationX = nextMove.x;
        player.locationY = nextMove.y;
        grid[player.locationY][player.locationX].type = 'player'
        messages.push('You healed with the potion!');
      }

      else if(grid[nextMove.y][nextMove.x].type == 'enemy') {
        this.fightEnemy(nextMove.x, nextMove.y);
        return;
      }
      
      else if(grid[nextMove.y][nextMove.x].type == 'staircase') {
        var mapLevel = this.state.mapLevel+1;
        this.setupDungeon(player, mapLevel);
        return;
      }
      else if(grid[nextMove.y][nextMove.x].type == 'treasure') {
        grid[nextMove.y][nextMove.x].type = 'treasureOpen';
        messages.push('Congratulations adventurer! You have defeated the Chief Orc and recovered the hidden treasure!');
      }
      
      this.setState({
              grid: grid,
              player: player,
              currentMessage: messages,
              // mapLevel: mapLevel
        });
    }

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
    let tileComps = this.state.grid.map((row) => {
      return row.map((tile) => {
        if(!this.state.viewAll){
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
              let enemyName = (tile.enemyStats? tile.enemyStats.enemyName : '');
              let id = tile.x+','+tile.y;
              return <Tile id={id} contents={tile.type} enemyName={enemyName} />;
          }
        } 
        else{
          let enemyName = (tile.enemyStats? tile.enemyStats.enemyName : '');
          let id = tile.x+','+tile.y;
          return <Tile id={id} contents={tile.type} enemyName={enemyName} />;
        }

      });
      
    });
    return (
      <div>
        <Hud
          level={this.state.player.level}
          HP={this.state.player.currentHp}
          XP={this.state.player.xp}
          weapon = {this.state.player.weapon}
          attack={this.state.player.attack}
          items={this.state.player.inventory}
          mapLevel={this.state.mapLevel} />
        <DisplayMessage currentMessage={this.state.currentMessage} />
        <div className='MainDungeon' id='MainDungeon'>
          {tileComps}
        </div>
        <button id='toggleViewAll' onClick={this.toggleViewAll}>Toggle Entire Map</button>
      </div>
    );
  }
}

class Tile extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var tileClass;
    var playerComponent = false;
    if(this.props.contents == 'enemy'){
      tileClass = 'floor'
      return (
        <div className={tileClass} id = {this.props.id}>
          <div className={this.props.enemyName}></div>
        </div>
      )
    }
    else if(this.props.contents != 'floor' && this.props.contents != 'cell'){
      tileClass = 'floor';
      return (
        <div className={tileClass} id = {this.props.id}>
          <div className={this.props.contents}></div>
        </div>
      )
    }
    else{
      tileClass = this.props.contents;
    }


    // else if(this.props.contents =='stairsUp') {
    //   tileClass = 'StairsUp';
    // }
    // else if(this.props.contents =='treasure') {
    //   tileClass = 'Treasure';
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

