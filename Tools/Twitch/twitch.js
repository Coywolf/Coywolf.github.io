(function() {
  var layoutOnly = location.host != 'coywolf.github.io';
  const clientId = "raya5nefmd441ipqcg8xo1j0mnnv6x";

  // #region local storage keys
  const SETTINGS_PINNED = "settings-pinned";
  const SETTINGS_LAYOUT = "settings-layout";
  const SETTINGS_AUDIO = "settings-audio";
  const SETTINGS_QUALITY = "settings-quality";
  const LAST_FOCUSED = "last-focused";
  const AUTH_TOKEN = "twitch-access-token";
  const AUTH_STATE = "twitch-access-state";
  const STREAMS_TEMP = "streams-temp";
  // #endregion

  // https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow
  // https://dev.twitch.tv/docs/api/reference/#get-streams    

  // settings
  var isSettingsPinned = false;
  var isLayoutHorizontal = true;
  var isAudioFocused = true;
  var focusedQuality = 'no'; // no, 480, 720

  var focusedPlayer = null;
  var mode = '';  // focus, isolate, even

  var players = [];
  var playerHandler;

  var searchModel;

  var PlayerModel = function(channel, index){
    var self = this;

    self.channelName = channel;
    self.id = index;
    self.elementId = "ct-player-" + self.id; 

    self.playerContainerDiv = document.createElement("div");
    self.playerContainerDiv.classList.add("ct-player-container");

    var playerDiv = document.createElement("div");
    playerDiv.id = self.elementId;
    playerDiv.classList.add("ct-player");
    self.playerContainerDiv.appendChild(playerDiv);    

    var container = document.getElementById("ct-player-container");
    container.appendChild(self.playerContainerDiv);

    var playerIsReady = false;  // if the player can accept commands, or if they need to be deferred
    if(layoutOnly){
      var playerText = document.createTextNode(self.channelName);
      
      playerDiv.appendChild(playerText);
    }
    else{
      var options = {
        width: '100%',
        height: '100%',
        channel: self.channelName,
        parent: ["coywolf.github.io"]
      }

      self.player = new Twitch.Player(self.elementId, options);
      self.player.addEventListener(Twitch.Embed.VIDEO_READY, function(){
        playerIsReady = true;
      }, {once: true});    
    }

    self.makePlayerButton = function(){
      var playerButtonContainer = document.getElementById("ct-settings-playerbuttons");

      var button = document.createElement("button");
      button.id = 'ct-playerbutton-' + self.id;
      button.append(document.createTextNode(self.channelName));

      button.addEventListener('click', playerHandler.bind(self), true);
      playerButtonContainer.append(button);
    }

    self.setMuted = function(isMuted){
      if(layoutOnly) return;
      
      if(playerIsReady){
        if(self.player.getMuted() == isMuted) return;

        self.player.setMuted(isMuted);
      }
      else{
        self.player.addEventListener(Twitch.Embed.VIDEO_READY, function(){
          self.setMuted(isMuted);
        }, {once: true});
      }
    }

    self.setQuality = function(quality){
      if(layoutOnly) return;

      if(playerIsReady){
        if(self.player.getQuality() == quality) return;

        self.player.setQuality(quality);
      }
      else{
        self.player.addEventListener(Twitch.Embed.VIDEO_READY, function(){
          self.setQuality(quality);
        }, {once: true});
      }
    }

    self.pause = function(){
      if(layoutOnly) return;

      if(playerIsReady){
        self.player.pause();
      }
    }
  }

  var StreamResultModel = function(result){
    var self = this;

    self.id = result.user_id;
    self.name = result.user_name;
    self.title = result.title;
    self.viewerCount = result.viewer_count + ' viewers';

    self.iconUrl = ko.observable("");
  }

  // view model for the search panel
  var SearchModel = function(){
    var self = this;

    // just hard coding the data for categories to show by default, searching will replace these
    var defaultCategories = [
      {
        "id": "504461",
        "name": "Super Smash Bros. Ultimate",
        "box_art_url": "https://static-cdn.jtvnw.net/ttv-boxart/504461_IGDB-52x72.jpg"
      },
      {
        "id": "16282",
        "name": "Super Smash Bros. Melee",
        "box_art_url": "https://static-cdn.jtvnw.net/ttv-boxart/16282_IGDB-52x72.jpg"
      },
      {
        "id": "18122",
        "name": "World of Warcraft",
        "box_art_url": "https://static-cdn.jtvnw.net/ttv-boxart/18122-52x72.jpg"
      }
    ]

    self.accessToken = ko.observable();
    self.accessTokenValidationInterval;
    self.errorMessage = ko.observable("");

    self.categoryQuery = ko.observable("").extend({ rateLimit: { timeout: 400, method: "notifyWhenChangesStop" } });
    self.categoryResults = ko.observableArray(defaultCategories);
    self.category = ko.observable();
    self.streamQuery = ko.observable("").extend({ rateLimit: { timeout: 400, method: "notifyWhenChangesStop" } });
    self.streamResults = ko.observableArray();
    self.filteredStreamResults = ko.pureComputed(() => {
      var query = self.streamQuery();

      if(query){
        query = query.toLowerCase();
        return self.streamResults().filter(s => {
          return s.name.toLowerCase().includes(query) || s.title.toLowerCase().includes(query);
        });
      }
      else{
        return self.streamResults();
      }
    });

    self.twitchAuthorize = function(){
      var hash = location.hash;
      if(hash.startsWith('#')){
        hash = hash.substring(1);
      }
  
      var state = uuid();
  
      localStorage.setItem(STREAMS_TEMP, hash);
      localStorage.setItem(AUTH_STATE, state);
  
      var authUrl = "https://id.twitch.tv/oauth2/authorize" +
        "?response_type=token" +
        "&client_id=" + clientId +
        "&redirect_uri=" + (location.origin+location.pathname) +
        "&scope=" +
        "&state=" + state;
      window.location.replace(authUrl);
    }

    self.twitchUnauthorize = function(){
      if(self.accessToken()){
        // https://dev.twitch.tv/docs/authentication/revoke-tokens/
        fetch("https://id.twitch.tv/oauth2/revoke", {
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'client_id': clientId,
            'token': self.accessToken()
          })
        });
      }
  
      self.accessToken("");
      localStorage.removeItem(AUTH_TOKEN);
      if(self.accessTokenValidationInterval) clearInterval(self.accessTokenValidationInterval); 
    }

    function startTokenValidation(){
      // https://dev.twitch.tv/docs/authentication/validate-tokens/
      const delay = 1000 * 60 * 60; // 1000 ms * 60 s * 60 m = every 1 hour
  
      var callback = function(){
        console.log("Validating access token");
        if(self.accessToken()){
          fetch("https://id.twitch.tv/oauth2/validate", {
            headers: {
              "Authorization": "OAuth " + self.accessToken()
            }
          })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            var invalidToken = data.status && data.status == "401";
            var expiresSoon = data.expires_in && data.expires_in < delay;
  
            if(invalidToken || expiresSoon){
              if(invalidToken) self.accessToken("");  // if token is actually expired now, clear it first so that the unauth method won't bother trying to revoke it
  
              twitchUnauthorize();
              setError("Access token has expired, connect with Twitch again to use search features");
            }
          });        
        }
        else{
          // no access token..how are we here? stop the interval
          clearInterval(self.accessTokenValidationInterval);
        }
      }
  
      self.accessTokenValidationInterval = setInterval(callback, delay);
      callback(); // first interval callback happens after the delay, need to also run once to start with
    }

    self.clearCategory = function(){
      self.category(null);
    }

    function processStreamResults(results){
      self.streamResults(results.map(r => new StreamResultModel(r)));

      // look up user icons
      // https://dev.twitch.tv/docs/api/reference/#get-users

      var map = {};
      for(var s of self.streamResults()){
        map[s.id] = s;
      }
      var query = Object.keys(map).map(i => 'id=' + i).join('&');
      var getUsersUrl = "https://api.twitch.tv/helix/users?" + query;

      fetch(getUsersUrl, {
        headers: {
          "Authorization": "Bearer " + self.accessToken(),
          "Client-Id": clientId
        }
      })
      .then((response) => response.json())
      .then((data) => {
        var results = data.data;
        
        if(results){
          for(var r of results){
            map[r.id].iconUrl(r.profile_image_url);
          }
        }
      });
    }

    self.addStream = function(stream){
      if(players.length < 4){
        var newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 0;
        var newPlayer = new PlayerModel(stream.name, newId);
        players.push(newPlayer);
        newPlayer.makePlayerButton();

        var container = document.getElementById("ct-player-container");
        container.classList.remove("ct-playercount-" + (players.length-1));
        container.classList.add("ct-playercount-" + players.length);

        // if this is the only stream, focus it
        if(players.length == 1){
          playerHandler.apply(newPlayer);
        }

        var newHash = "#" + players.map(p => p.channelName).join("/");
        location.hash = newHash;
      }
    }

    self.accessToken.subscribe(nv => {
      if(nv){
        startTokenValidation();
      }
    });

    self.categoryQuery.subscribe(nv => {
      if(nv){
        // https://dev.twitch.tv/docs/api/reference/#search-categories

        var categorySearchUrl = "https://api.twitch.tv/helix/search/categories?" + new URLSearchParams({
          query: nv
        }).toString();

        fetch(categorySearchUrl, {
          headers: {
            "Authorization": "Bearer " + self.accessToken(),
            "Client-Id": clientId
          }
        })
        .then((response) => response.json())
        .then((data) => {
          var results = data.data;
          if(results){
            self.categoryResults(results);
          }
          else{
            self.categoryResults([]);
          }
        });
      }
      else{
        self.categoryResults(defaultCategories);
      }
    });

    self.category.subscribe(nv => {
      if(nv){
        // https://dev.twitch.tv/docs/api/reference/#get-streams

        var streamSearchUrl = "https://api.twitch.tv/helix/streams?" + new URLSearchParams({
          game_id: nv.id,
          type: "live",
          first: "30"
        }).toString();

        fetch(streamSearchUrl, {
          headers: {
            "Authorization": "Bearer " + self.accessToken(),
            "Client-Id": clientId
          }
        })
        .then((response) => response.json())
        .then((data) => {
          var results = data.data;
          if(results){
            processStreamResults(results);
          }
          else{
            self.streamResults([]);
          }
        });
      }
      else{
        self.streamResults([]);
      }
    })
  }

  function uuid() {
    const url = URL.createObjectURL(new Blob());
    const [id] = url.toString().replaceAll("-", "").split('/').reverse();
    URL.revokeObjectURL(url);
    return id;
  }

  function parseStreamNames(path){
    if(path.startsWith('#')){
      path = path.substring(1);
    }

    if(path.length == 0){
      return [];
    }

    var tokens = path.split('/');    
    return tokens.slice(0, 4);
  }

  function saveSettings(){
    localStorage.setItem(SETTINGS_PINNED, isSettingsPinned);
    localStorage.setItem(SETTINGS_LAYOUT, isLayoutHorizontal);
    localStorage.setItem(SETTINGS_AUDIO, isAudioFocused);
    localStorage.setItem(SETTINGS_QUALITY, focusedQuality);
  }

  function loadSettings(){
    var pinSetting = localStorage.getItem(SETTINGS_PINNED);
    if(pinSetting === null){  // default
      isSettingsPinned = false;
    }
    else{
      isSettingsPinned = (pinSetting === "true");
    }

    var layoutSetting = localStorage.getItem(SETTINGS_LAYOUT);
    if(layoutSetting === null){  // default
      isLayoutHorizontal = true;
    }
    else{
      isLayoutHorizontal = (layoutSetting === "true");
    }

    var audioSetting = localStorage.getItem(SETTINGS_AUDIO);
    if(audioSetting === null){  // default
      isAudioFocused = true;
    }
    else{
      isAudioFocused = (audioSetting === "true");
    }

    var qualitySetting = localStorage.getItem(SETTINGS_QUALITY);
    if(qualitySetting === null){  // default
      focusedQuality = 'no';
    }
    else{
      focusedQuality = qualitySetting;
    }
  }  

  // figure out what's in the hash and handle it accordingly. could be an auth redirect, could be a list of streams
  // returns { streams:"", error:"", token:""}
  function handleHash(hash){
    if(hash === null || hash === undefined) return {};
    if(hash.startsWith('#') || hash.startsWith('?')){
      hash = hash.substring(1);
    }

    // hash is expected to be one of the following
    // (empty)
    // stream1/stream2/stream3/stream4
    // access_token=73d0f8mkabpbmjp921asv2jaidwxn&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls&state=c3ab8aa609ea11e793ae92361f002671&token_type=bearer
    // error=access_denied&error_description=The+user+denied+you+access&state=c3ab8aa609ea11e793ae92361f002671

    var parameters = hash
      .split("&")
      .map(t => t.split("="))
      .reduce( (pre, [key, value]) => ({...pre, [key]: value}), {});
    
    var ret = {};
    if(parameters.state){
      var savedState = localStorage.getItem(AUTH_STATE)
      localStorage.removeItem(AUTH_STATE);

      // test that the twitch redirect includes a state matching the one generated previously
      if(parameters.state == savedState){
        if(parameters.error){
          ret.error = (parameters.error_description || parameters.error).toString().replaceAll("+", " ");
        }
        else if(parameters.access_token){
          ret.token = parameters.access_token;
          localStorage.setItem(AUTH_TOKEN, parameters.access_token);
        }
        else{
          ret.error = "Unexpected response from Twitch";
        }
      }
      else{
        ret.error = "Invalid redirect state";
      }

      ret.streams = localStorage.getItem(STREAMS_TEMP);
      localStorage.removeItem(STREAMS_TEMP);
    }
    else{
      ret.streams = hash;
      ret.token = localStorage.getItem(AUTH_TOKEN);
    }

    return ret;
  }

  function initSettings(){
    loadSettings(); // load from local storage or set to defaults

    var settings = document.getElementById("ct-settings");
    settings.addEventListener('mouseenter', function(e){
      if(!isSettingsPinned){
        settings.classList.remove('collapsed');
      }
    });
    settings.addEventListener('mouseleave', function(e){
      if(!isSettingsPinned){
        settings.classList.add('collapsed');
      }
    });

    // search
    var settingsSearchButton = document.getElementById("ct-settings-search");
    var searchPanel = document.getElementById("ct-search-panel");
    settingsSearchButton.addEventListener('click', function(e){
      if(searchPanel.classList.contains("hidden")){
        searchPanel.classList.remove("hidden");
        settingsSearchButton.classList.add("active");
      }
      else{
        searchPanel.classList.add("hidden");
        settingsSearchButton.classList.remove("active");
      }
    });
    if(players.length == 0) settingsSearchButton.click();

    // set up knockout for the search panel
    ko.applyBindings(searchModel, searchPanel);

    // help
    var settingsHelpButton = document.getElementById("ct-settings-bhelp");
    var helpModal = document.getElementById("help-modal");
    settingsHelpButton.addEventListener('click', function(e){
      if(helpModal.classList.contains("hidden")){
        helpModal.classList.remove("hidden");
        settingsHelpButton.classList.add("active");
      }
      else{
        helpModal.classList.add("hidden");
        settingsHelpButton.classList.remove("active");
      }
    });
    helpModal.addEventListener('click', function(e){
      helpModal.classList.add("hidden");
      settingsHelpButton.classList.remove("active");
    });

    // pin
    var settingsPinButton = document.getElementById("ct-settings-bpin");
    var applyPin = function(){
      if(isSettingsPinned){
        settingsPinButton.classList.add("active");
        settings.classList.add("pinned");
        settings.classList.remove('collapsed');
      }
      else{
        settingsPinButton.classList.remove("active");
        settings.classList.remove("pinned");
      }
    }
    settingsPinButton.addEventListener('click', function(e){
      isSettingsPinned = !isSettingsPinned;      
      applyPin();
      saveSettings();
    });
    applyPin(); // init button and style for the initial setting

    // layout
    var settingsHorizontalButton = document.getElementById("ct-settings-bhorz");
    var settingsVerticalButton = document.getElementById("ct-settings-bvert");
    var applyLayoutButtonChange = function(){
      var container = document.getElementById("ct-player-container");
      if(isLayoutHorizontal){
        settingsVerticalButton.classList.remove("active");
        container.classList.remove("vertical");

        settingsHorizontalButton.classList.add("active");
        container.classList.add("horizontal");
      }
      else{
        settingsVerticalButton.classList.add("active");
        container.classList.add("vertical");

        settingsHorizontalButton.classList.remove("active");
        container.classList.remove("horizontal");
      }
    }
    settingsHorizontalButton.addEventListener('click', function(e){
      isLayoutHorizontal = true;
      applyLayoutButtonChange();
      saveSettings();
    });
    settingsVerticalButton.addEventListener('click', function(e){
      isLayoutHorizontal = false;
      applyLayoutButtonChange();
      saveSettings();
    });
    applyLayoutButtonChange();  // init the buttons and styles for the initial setting

    // focus audio
    var settingsFocusNoButton = document.getElementById("ct-settings-bnfoc");
    var settingsFocusYesButton = document.getElementById("ct-settings-byfoc");

    var applyFocusAudio = function(){
      if(isAudioFocused || mode == "isolate"){
        players.forEach(p => {
          p.setMuted(p.id != focusedPlayer);
        });
      }
    }

    var updateAudioButtonStyles = function(){
      if(isAudioFocused){
        settingsFocusNoButton.classList.remove("active");
        settingsFocusYesButton.classList.add("active");
      }
      else{
        settingsFocusNoButton.classList.add("active");
        settingsFocusYesButton.classList.remove("active");
      }
    }
    settingsFocusNoButton.addEventListener('click', function(e){
      isAudioFocused = false;
      updateAudioButtonStyles();
      saveSettings();
    });
    settingsFocusYesButton.addEventListener('click', function(e){
      isAudioFocused = true;
      updateAudioButtonStyles();
      applyFocusAudio();
      saveSettings();
    });
    updateAudioButtonStyles();  // init the buttons for the initial setting
    applyFocusAudio();  // apply audio focus for the initial setting

    

    // focus quality
    var settingsQualityNoButton = document.getElementById("ct-settings-bnqua");
    var settingsQuality480Button = document.getElementById("ct-settings-b480");
    var settingsQuality720Button = document.getElementById("ct-settings-b720");

    var applyFocusQuality = function(){
      players.forEach(p => {
        if(focusedQuality == 'no' || p.id == focusedPlayer){
          p.setQuality('chunked');
        }
        else if (focusedQuality == '480'){
          p.setQuality('480p30');
        }
        else if (focusedQuality == '720'){
          p.setQuality('720p60');
        }
      });
    }

    var updateQualityButtonStyles = function(){
      if(focusedQuality == 'no'){
        settingsQuality480Button.classList.remove("active");
        settingsQuality720Button.classList.remove("active");
        settingsQualityNoButton.classList.add("active");
      }
      else if (focusedQuality == '480'){
        settingsQualityNoButton.classList.remove("active");
        settingsQuality720Button.classList.remove("active");
        settingsQuality480Button.classList.add("active");
      }
      else{
        settingsQualityNoButton.classList.remove("active");
        settingsQuality480Button.classList.remove("active");
        settingsQuality720Button.classList.add("active");
      }
    }
    settingsQualityNoButton.addEventListener('click', function(e){
      focusedQuality = 'no';
      updateQualityButtonStyles();
      applyFocusQuality();
      saveSettings();
    });
    settingsQuality480Button.addEventListener('click', function(e){
      focusedQuality = '480';
      updateQualityButtonStyles();
      applyFocusQuality();
      saveSettings();
    });
    settingsQuality720Button.addEventListener('click', function(e){
      focusedQuality = '720';
      updateQualityButtonStyles();
      applyFocusQuality();
      saveSettings();
    });
    updateQualityButtonStyles();  // init button styles and quality mode for the initial setting
    applyFocusQuality(); 

    // players
    var setMode = function(newMode){
      var container = document.getElementById("ct-player-container");

      if(newMode == "even"){        
        container.classList.remove("isolate");
        container.classList.remove("focus");
        container.classList.add("even");

        if(mode == "isolate"){      
          container.classList.remove("ct-playercount-1");
          container.classList.add("ct-playercount-" + players.length);          
        }
      }
      else if (newMode == "isolate"){
        container.classList.remove("even");
        container.classList.add("focus");
        container.classList.add("isolate");
        
        if(newMode != mode){          
          container.classList.remove("ct-playercount-" + players.length);
          container.classList.add("ct-playercount-1");
        }
      }
      else{
        container.classList.remove("even");
        container.classList.remove("isolate");
        container.classList.add("focus");

        if(mode == "isolate"){      
          container.classList.remove("ct-playercount-1");
          container.classList.add("ct-playercount-" + players.length);          
        }
      }

      mode = newMode;
    }

    // set the given player to have the given style (active/isolate), and clear the style from the rest
    // either argument as null will remove active and isolate from all buttons
    var setPlayerButtons = function(id, style){
      players.forEach(player => {
        var playerButton = document.getElementById("ct-playerbutton-" + player.id);

        playerButton.classList.remove("active");
        playerButton.classList.remove("isolate");

        if(player.id == id){
          playerButton.classList.add(style);
        }
      });
    }

    // set the given container to have the primary class, remove it from all others
    // passing null will remove it from all
    var setPrimaryContainer = function(id){
      players.forEach(player => {
        if(player.id == id){
          player.playerContainerDiv.classList.add("primary");
        }
        else{
          player.playerContainerDiv.classList.remove("primary");
        }
      });
    }

    var removePlayer = function(id){
      var playerIndex = players.findIndex(p => p.id == id);      

      if(playerIndex > -1){
        var p = players[playerIndex];
        p.pause();

        var playerButton = document.getElementById("ct-playerbutton-" + p.id);
        playerButton.remove();
        p.playerContainerDiv.remove();
        
        players.splice(playerIndex, 1);        

        var streams = parseStreamNames(location.hash);
        var streamsIndex = streams.findIndex(s => s == p.channelName);

        if(streamsIndex > -1){
          streams.splice(streamsIndex, 1);
          var newHash = "#" + streams.join("/");
          location.hash = newHash;
        }

        var container = document.getElementById("ct-player-container");
        container.classList.remove("ct-playercount-" + (players.length+1));
        container.classList.add("ct-playercount-" + players.length);
      }
    }

    var setFocusPlayer = function(player){
      if(player){
        focusedPlayer = player.id;
        localStorage.setItem(LAST_FOCUSED, player.channelName);
      }
      else{
        focusedPlayer = null;
        localStorage.removeItem(LAST_FOCUSED);
      }
    }

    playerHandler = function(e){
      var player = this;
      var isolating = e && e.ctrlKey;
      var removing = e && e.shiftKey;

      var modeMatches = removing || (isolating && mode == "isolate") || (!isolating && mode == "focus");

      if(focusedPlayer == player.id && modeMatches){
        setMode("even");
        setPlayerButtons(null, null);
        setPrimaryContainer(null);
        setFocusPlayer();
      }
      else if (isolating && !removing){
        setMode("isolate");
        setPlayerButtons(player.id, "isolate");
        setPrimaryContainer(player.id);
        setFocusPlayer(player);
        applyFocusAudio();
        applyFocusQuality();
      }
      else if (!removing){
        setMode("focus");
        setPlayerButtons(player.id, "active");
        setPrimaryContainer(player.id);
        setFocusPlayer(player);
        applyFocusAudio();
        applyFocusQuality();
      }

      if(removing){
        removePlayer(player.id);
      }
    }

    players.forEach(player => {
      player.makePlayerButton();
    });

    var lastFocus = localStorage.getItem(LAST_FOCUSED);
    var lastFocusPlayer;
    if(lastFocus){
      lastFocusPlayer = players.find(p => p.channelName == lastFocus);
    }

    if(lastFocusPlayer){
      playerHandler.apply(lastFocusPlayer);  // try to focus the user's last focused stream, in case they refreshed
    }
    else{
      playerHandler.apply(players[0]);  // if they don't have one or it wasn't found, just focus the first
    }
  }

  function init(){
    searchModel = new SearchModel();

    // annoyingly, errors come back in the search, successes in the hash
    var hashOutcome = handleHash(location.search || location.hash);

    if(hashOutcome.error){
      searchModel.errorMessage(hashOutcome.error);
    }
    if(hashOutcome.token){
      searchModel.accessToken(hashOutcome.token);
    }

    var streamNames = hashOutcome.streams || "";
    window.history.replaceState(null, null, window.location.pathname)
    location.hash = streamNames;
    var streams = parseStreamNames(hashOutcome.streams || "");
    
    players = streams.map((c, i) => new PlayerModel(c, i));
    var container = document.getElementById("ct-player-container");
    container.classList.add("ct-playercount-" + players.length);
    
    initSettings();
  }

  init();
})();