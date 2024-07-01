// todo limit on selected players (4) and custom events (depends on keybinds but maybe 12)
// todo keybinds
// - thinking two modes - flat layout where there's a keybind for everything, as well as guided where it will activate different sections in order and use simpler keybinds for each
// - probably need to consider how character change will work. Maybe that's just always up to mouse use, or maybe needs to do typeaheads or something
// - for flat layout, thinking 1-4 toggles active on selected players, QWER,ASDF,ZXCV for stocks. TYU,GHJ,BNM for stages, IOP[] KL;' ,./ for custom events
// - for guided, spacebar to start and continue from each section. first section is players, 1-4 for active, next section is stage, 1-9, next is winning player 1-4, next is remaining stocks 1-3

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
      dataLoaded: false,
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
    }
  },
  template: '#tracker'
}