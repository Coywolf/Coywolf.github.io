import { ref } from 'vue';
import SessionTimer from "./sessionTimer.js";
import {Player, GamePlayer} from "../../models/player.js";
import DataStore from "../../dataStore.js";

const sessionThresholdMinutes = 180;

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
    SessionTimer
  },
  data(){
    return {
      allPlayers: [],
      addPlayerSelection: "",
      customEvents: [],
      newCustomEvent: "",
      stages: ["Battlefield", "Small Battlefield", "Final Destination", "Pokemon Stadium 2", "Smashville", "Town and City", "Kalos League", "Hollow Bastion", "Yoshi's Story"],
      selectedStage: 'Battlefield',
      currentSession: null
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
    playerNames(){
      // convenience map of id to name
      return Object.fromEntries(this.allPlayers.map(p => [p.id, p.name]));
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
        // really bad to do it this way but just doing it for now. using a watch doesn't tell you the specific item that was updated, you just get the callback for the whole array
        // need to split the player controls out into a separate component so those can handle the updates individually
        for(var player of this.allPlayers){
          DataStore.addOrUpdatePlayer(player);
        }
      },
      deep: true
    },
    customEvents: {
      handler(){
        var unwrappedEvents = this.customEvents.map(e => e.value);
        DataStore.updateCustomEvents(unwrappedEvents);
      },
      deep: true
    }
  },
  created(){
    this.allPlayers = DataStore.getPlayers();
    this.customEvents = DataStore.getCustomEvents().map(e => ref(e));
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
      if(sessionEvent instanceof Game){
        const winningGamePlayer = sessionEvent.players.find(p => p.id == sessionEvent.winningPlayerId);
        const losingGamePlayers = sessionEvent.players.filter(p => p.id != sessionEvent.winningPlayerId);
        return `${this.formatGamePlayer(winningGamePlayer)} won over [${losingGamePlayers.map(p => this.formatGamePlayer(p)).join(', ')}] on ${sessionEvent.stage}, with ${sessionEvent.remainingStocks} stocks remaining`;
      }
      else if(sessionEvent instanceof CustomEvent){
        return `&ensp;${sessionEvent.event}`;
      }

      return "";
    }
  },
  template: '#tracker'
}