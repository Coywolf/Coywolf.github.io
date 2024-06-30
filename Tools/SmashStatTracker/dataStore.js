import { Player } from "./models/player.js";

  // #region local storage keys
  const PLAYERS = "player-data";
  const EVENTS = "custom-events";
  // #endregion

export default {
  getPlayers(){
    var data = localStorage.getItem(PLAYERS);
    if(data){
      return JSON.parse(data);
    }

    return [];
  },
  addOrUpdatePlayer(player){
    var players = this.getPlayers();
    var existingPlayerIndex = players.findIndex(p => p.id == player.id);
    if(existingPlayerIndex >= 0){
      players.splice(existingPlayerIndex, 1, player);
    }
    else{
      players.push(player);
    }
    
    localStorage.setItem(PLAYERS, JSON.stringify(players));
  },
  getCustomEvents(){
    var data = localStorage.getItem(EVENTS);
    if(data){
      return JSON.parse(data);
    }

    return [];
  },
  updateCustomEvents(events){
    localStorage.setItem(EVENTS, JSON.stringify(events));
  }
}