// todo want to kinda 'minify' the json that gets saved. so map everything into classes where the property names are just one letter, save a little space that way

import { Player } from "./models/player.js";

  // #region local storage keys
  const PLAYERS = "player-data";
  const EVENTS = "custom-events";
  const CURRENT_SESSION = "current-session";  // holding the current/most recent session, the one that's going to be regularly changing
  const ARCHIVE_SESSIONS = "archive-sessions";  // current session is moved to the archive automatically, these are more for historical viewing rather than updates
  // #endregion

export default {
  getPlayers(){
    var data = localStorage.getItem(PLAYERS);
    if(data){
      return JSON.parse(data);
    }

    return [];
  },
  updatePlayers(players){
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
  },
  getCurrentSession(){
    var data = localStorage.getItem(CURRENT_SESSION);
    if(data){
      return JSON.parse(data);
    }

    return null;
  },
  updateCurrentSession(session, isNew){
    if(isNew){
      // new session being created, so first check if there's an existing session and move it to the archive
      var currentSession = this.getCurrentSession();
      if(currentSession){
        var archiveSessions = this.getArchiveSessions(false);
        archiveSessions.push(currentSession);
        localStorage.setItem(ARCHIVE_SESSIONS, JSON.stringify(archiveSessions));
      }
    }

    localStorage.setItem(CURRENT_SESSION, JSON.stringify(session));
  },
  getArchiveSessions(includeCurrent){
    var sessions = [];

    var archiveData = localStorage.getItem(ARCHIVE_SESSIONS);
    if(archiveData){
      sessions = JSON.parse(archiveData);
    }

    if(includeCurrent){
      var currentSession = this.getCurrentSession();
      if(currentSession){
        sessions.push(currentSession);
      }
    }

    return sessions;
  }
}