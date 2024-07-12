// todo
// character selection - this will probably switch to a component, need to be able to call a focus event on it
// - kinda thinking it's sort of like a typeahead mixed with the character selection screen. on focus highlight the existing value, show the character map. 
// - you can click on a character to select it, or start typing and it will highlight matching characters, as soon as there's only one match it selects it
// window needs to respond to being in focus or not, border the page or something
// highlight the active section in guided mode
// keybind help. both a reference image for the all mode, and little keybind displays on all the controls, maybe only while holding ctrl or something
// styling

import { ref } from 'vue';
import SessionTimer from "./sessionTimer.js";
import {Player, GamePlayer} from "../../models/player.js"; 
import DataStore from "../../dataStore.js";
import StageSelector from "./stageSelector.js";
import CharacterPicker from "./characterPicker.js";

const sessionThresholdMinutes = 180;
const maxPlayers = 4;
const maxCustomEvents = 11;

// holds all the keybind commands for each of the different keybind modes. commands are looked up and handled by the tracker onKeyup method
// command keys are keyup event codes. commands are formatted as "command.argument.argument"
const keyboardLayout = {
  "all": {
    "Digit1": "active.0",
    "Digit2": "character.0",
    "Digit3": "game.1.0",
    "Digit4": "game.2.0",
    "Digit5": "game.3.0",

    "KeyQ": "active.1",
    "KeyW": "character.1",
    "KeyE": "game.1.1",
    "KeyR": "game.2.1",
    "KeyT": "game.3.1",

    "KeyA": "active.2",
    "KeyS": "character.2",
    "KeyD": "game.1.2",
    "KeyF": "game.2.2",
    "KeyG": "game.3.2",

    "KeyZ": "active.3",
    "KeyX": "character.3",
    "KeyC": "game.1.3",
    "KeyV": "game.2.3",
    "KeyB": "game.3.3",

    "KeyY": "stage.0",
    "KeyU": "stage.1",
    "KeyI": "stage.2",
    "KeyH": "stage.3",
    "KeyJ": "stage.4",
    "KeyK": "stage.5",
    "KeyN": "stage.6",
    "KeyM": "stage.7",
    "Comma": "stage.8",

    "Digit6": "event.0",
    "Digit7": "event.1",
    "Digit8": "event.2",
    "Digit9": "event.3",
    "Digit0": "event.4",
    "Minus": "event.5",
    "Equal": "event.6",
    "KeyO": "event.7",
    "KeyP": "event.8",
    "BracketLeft": "event.9",
    "BracketRight": "event.10",

    "Space": "mode.player-active"
  },
  "player-active": {
    "Digit1": "active.0",
    "Digit2": "active.1",
    "Digit3": "active.2",
    "Digit4": "active.3",

    "Space": "mode.player-character",
    "Escape": "mode.all"
  },
  "player-character": {
    "Digit1": "character.0",
    "Digit2": "character.1",
    "Digit3": "character.2",
    "Digit4": "character.3",

    "Space": "mode.stage",
    "Escape": "mode.all"
  },
  "stage": {
    "Digit1": "stage.0",
    "Digit2": "stage.1",
    "Digit3": "stage.2",
    "Digit4": "stage.3",
    "Digit5": "stage.4",
    "Digit6": "stage.5",
    "Digit7": "stage.6",
    "Digit8": "stage.7",
    "Digit9": "stage.8",

    "Space": "mode.winner-player",
    "Escape": "mode.all"
  },
  "winner-player": {
    "Digit1": "winner.0",
    "Digit2": "winner.1",
    "Digit3": "winner.2",
    "Digit4": "winner.3",

    "Space": "mode.winner-stocks",
    "Escape": "mode.all"
  },
  "winner-stocks": {
    "Digit1": "stock.1",
    "Digit2": "stock.2",
    "Digit3": "stock.3",

    "Space": "mode.log",
    "Escape": "mode.all"
  }
}

class SessionEvent {
  time;

  constructor(){
    this.time = Date.now();
  }
}

class Game extends SessionEvent {
  players;
  stage;
  winningPlayerId;
  remainingStocks;

  constructor(players, stage, winningPlayerId, remainingStocks){
    super();

    this.players = players;
    this.stage = stage;
    this.winningPlayerId = winningPlayerId;
    this.remainingStocks = remainingStocks;
  }
}

class CustomEvent extends SessionEvent {
  event;

  constructor(event){
    super();

    this.event = event;
  }
}

class Session {
  startTime;
  endTime;

  games;
  customEvents;

  constructor(){
    this.startTime = Date.now();
    this.games = [];
    this.customEvents = [];
  }
}

export default {
  components:{
    SessionTimer,
    StageSelector,
    CharacterPicker
  },
  data(){
    return {
      dataLoaded: false,
      keybindMode: "all", // all, player-active, player-character, stage, winner-player, winner-stocks. all uses the "flat mode" keybinds, everything else is number keys for that specific section
      allPlayers: [],
      addPlayerSelection: "",
      customEvents: [],
      newCustomEvent: "",
      selectedStage: 'Battlefield',
      currentSession: null,
      winningPlayer: null, // the chosen winning player, only needed when using the guided keybind mode
      remainingStocks: null // the chosen remaining stocks, only needed when using the guided keybind mode
    }
  },
  computed:{
    selectedPlayers(){
      return this.allPlayers.filter(p => p.selected);
    },
    unselectedPlayers(){
      // for populating the dropdown list to add a new player
      return this.allPlayers.filter(p => !p.selected);
    },
    activePlayers(){
      return this.selectedPlayers.filter(p => p.active && p.name);
    },
    hasMaxPlayers(){
      return this.selectedPlayers.length >= maxPlayers;
    },
    playerNames(){
      // convenience map of id to name
      return Object.fromEntries(this.allPlayers.map(p => [p.id, p.name]));
    },
    hasMaxCustomEvents(){
      return this.customEvents.length >= maxCustomEvents;
    },
    showStartSession(){
      return !this.currentSession || this.currentSession.endTime
    },
    showResumeSession(){
      return this.currentSession && this.currentSession.endTime && this.minutesSince(this.currentSession.endTime) < sessionThresholdMinutes
    },
    showStopSession(){
      return this.currentSession && !this.currentSession.endTime;
    },
    sessionEvents(){
      if(!this.currentSession){
        return [];
      }

      var allEvents = this.currentSession.games.concat(this.currentSession.customEvents);
      allEvents.sort((a, b) => b.time - a.time);

      return allEvents;
    }
  },
  watch: {
    allPlayers: {
      handler(){
        if(this.dataLoaded){
          // it feels pretty inefficient to just send the whole list on any update, but when this is all saving in local storage, that's how it has to save anyway
          DataStore.updatePlayers(this.allPlayers);
        }
      },
      deep: true
    },
    customEvents: {
      handler(){
        if(this.dataLoaded){
          var unwrappedEvents = this.customEvents.map(e => e.value);
          DataStore.updateCustomEvents(unwrappedEvents);
        }
      },
      deep: true
    },
    currentSession: {
      handler(newValue, oldValue){
        if(this.dataLoaded){
          DataStore.updateCurrentSession(this.currentSession, oldValue == null || newValue.startTime != oldValue.startTime);
        }
      },
      deep: true
    }
  },
  created(){
    this.allPlayers = DataStore.getPlayers();
    this.customEvents = DataStore.getCustomEvents().map(e => ref(e));
    this.currentSession = DataStore.getCurrentSession();

    window.addEventListener('keyup', this.onKeyup);

    this.$nextTick(() => {  // this ensures that all of the changes to reactive props above have propagated, and so have already triggered watchers
      this.dataLoaded = true;
    });
  },  
  methods:{
    toSnakeCase(str){
      return str.toLowerCase().replace("'", "").replace(" ", "_");
    },
    msToS(ms){
      return ms / 1000;
    },
    msToM(ms){
      return this.msToS(ms) / 60;
    },    
    secondsSince(ms){
      return this.msToS(Date.now() - ms);
    },
    minutesSince(ms){
      return this.msToM(Date.now() - ms);
    },
    formatMs(msDiff){
      var totalSeconds = Math.max(this.msToS(msDiff), 0);
      var minutes = Math.trunc(totalSeconds / 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
      var seconds = Math.trunc(totalSeconds % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});

      return `${minutes}:${seconds}`;
    },
    addPlayer(){
      if(this.addPlayerSelection){
        var player = this.unselectedPlayers.find(p => p.id == this.addPlayerSelection);
        player.selected = true;
        player.active = true; // you're just adding them so assume they're active as well
        this.addPlayerSelection = "";
      }
      else{
        // just using a timestamp as the id
        // my concern is that if you somehow delete the player data from your storage but not all the event data, once you go to add new players it will fill in those events as the IDs get reused
        // using the time stamp avoids this, fixing the player data will need to be some other config page later
        var nextId = Date.now();
        this.allPlayers.push(new Player(nextId, ""));
      }
    },
    togglePlayerActive(player){
      player.active = !player.active;
    },
    removePlayer(player){
      player.selected = false;
    },
    addCustomEvent(){
      if(this.newCustomEvent){
        this.customEvents.push(ref(this.newCustomEvent));
        this.newCustomEvent = "";
      }
    },
    removeCustomEvent(event){
      this.customEvents = this.customEvents.filter(e => e.value != event);
    },
    triggerCustomEvent(event){
      this.activateSessionIfNeeded();
      
      var customEvent = new CustomEvent(event);
      this.currentSession.customEvents.push(customEvent);
    },
    logGame(winningPlayer, remainingStocks){
      if(this.activePlayers.length < 2) return; // gotta have at least two players

      this.activateSessionIfNeeded();
      
      var activePlayers = this.activePlayers.map(p => new GamePlayer(p));
      var game = new Game(activePlayers, this.selectedStage, winningPlayer.id, remainingStocks);
      this.currentSession.games.push(game);
    },
    activateSessionIfNeeded(){
      if(this.showStopSession){
        // running session, nothing to do
      }
      else if(this.showResumeSession){
        // resumable session loaded, so resume it
        this.resumeSession();
      }
      else{
        this.startSession();
      }
    },
    startSession(){
      this.currentSession = new Session();
    },
    resumeSession(){
      this.currentSession.endTime = null;
    },
    stopSession(){
      var lastEvent = this.sessionEvents[0];
      if(lastEvent){
        this.currentSession.endTime = lastEvent.time;
      }
      else{
        this.currentSession.endTime = Date.now();
      }
    },
    formatGamePlayer(gamePlayer){
      return `${this.playerNames[gamePlayer.id]} (${gamePlayer.character})`;
    },
    formatSessionEvent(sessionEvent){
      if(sessionEvent.winningPlayerId){
        const winningGamePlayer = sessionEvent.players.find(p => p.id == sessionEvent.winningPlayerId);
        const losingGamePlayers = sessionEvent.players.filter(p => p.id != sessionEvent.winningPlayerId);
        return `${this.formatGamePlayer(winningGamePlayer)} won over [${losingGamePlayers.map(p => this.formatGamePlayer(p)).join(', ')}] on ${sessionEvent.stage}, with ${sessionEvent.remainingStocks} stocks remaining`;
      }
      else if(sessionEvent.event){
        return `&ensp;${sessionEvent.event}`;
      }

      return "";
    },
    onKeyup(e){
      if (e.target.nodeName.toLowerCase() === 'input') { return; }  // ignore keybinds if typing in an input, e.g. player name
      
      var command = keyboardLayout[this.keybindMode][e.code];

      if(command){
        var commandTokens = command.split(".");

        if(commandTokens[0] == "active"){
          var player = this.selectedPlayers[commandTokens[1]];
          if(player){
            this.togglePlayerActive(player);
          }
        }
        else if(commandTokens[0] == "character"){
          var player = this.selectedPlayers[commandTokens[1]];
          if(player){
            this.$refs.characterPickers[commandTokens[1]].focus();
          }
        }
        else if(commandTokens[0] == "stage"){
          var stage = this.stages[commandTokens[1]];
          if(stage){
            this.selectedStage = stage;
          }
        }
        else if(commandTokens[0] == "event"){
          var customEvent = this.customEvents[commandTokens[1]];
          if(customEvent){
            this.triggerCustomEvent(customEvent);
          }
        }
        else if(commandTokens[0] == "game"){
          var player = this.selectedPlayers[commandTokens[2]];
          if(player){
            this.logGame(player, commandTokens[1]);
          }
        }
        else if(commandTokens[0] == "winner"){
          var player = this.selectedPlayers[commandTokens[1]];
          if(player){
            this.winningPlayer = player;
          }
        }
        else if(commandTokens[0] == "stock"){
          this.remainingStocks = commandTokens[1];
        }
        else if(commandTokens[0] == "mode"){
          var newMode = commandTokens[1];
          if(newMode == "log"){
            // not a real mode but this is essentially the confirmation to log the game
            if(this.winningPlayer && this.remainingStocks){              
              this.logGame(this.winningPlayer, this.remainingStocks)
            }
            newMode = "all";
          }

          if(newMode == "all"){
            this.winningPlayer = null;
            this.remainingStocks = null;
          }

          this.keybindMode = newMode;
        }
      }
    }
  },
  template: '#tracker'
}