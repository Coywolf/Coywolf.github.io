export class Player {
  id;
  name;
  character;
  selected = true;
  active = true;

  constructor(id, name){
    this.id = id;
    this.name = name;
  }
}

// smaller version of Player to store with a game event, expects a Player in the constructor
// just the id and character. Name will be looked up from player data when rendering
export class GamePlayer {
  id;
  character;

  constructor(player){
    this.id = player.id;
    this.character = player.character;
  }
}