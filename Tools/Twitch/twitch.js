(function() {
  var layoutOnly = location.host != 'coywolf.github.io';

  // settings
  var isSettingsPinned = false;
  var isLayoutHorizontal = true;
  var isAudioFocused = true;
  var focusedQuality = 'no'; // no, 480, 720

  var focusedPlayer = null;
  var mode = '';  // focus, isolate, even

  var players = [];

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
        self.player.setQuality('chunked');
        self.player.setMuted(index != 0);
      }, {once: true});    
    }
  }

  function parseStreamNames(path){
    if(path.startsWith('#')){
      path = path.substring(1);
    }

    var tokens = path.split('/');
    
    return tokens.slice(0, 4);
  }

  function saveSettings(){
    localStorage.setItem("settings-pinned", isSettingsPinned);
    localStorage.setItem("settings-layout", isLayoutHorizontal);
    localStorage.setItem("settings-audio", isAudioFocused);
    localStorage.setItem("settings-quality", focusedQuality);
  }

  function loadSettings(){
    var pinSetting = localStorage.getItem("settings-pinned");
    if(pinSetting === null){  // default
      isSettingsPinned = false;
    }
    else{
      isSettingsPinned = (pinSetting === "true");
    }

    var layoutSetting = localStorage.getItem("settings-layout");
    if(layoutSetting === null){  // default
      isLayoutHorizontal = true;
    }
    else{
      isLayoutHorizontal = (layoutSetting === "true");
    }

    var audioSetting = localStorage.getItem("settings-audio");
    if(audioSetting === null){  // default
      isAudioFocused = true;
    }
    else{
      isAudioFocused = (audioSetting === "true");
    }

    var qualitySetting = localStorage.getItem("settings-quality");
    if(qualitySetting === null){  // default
      focusedQuality = 'no';
    }
    else{
      focusedQuality = qualitySetting;
    }
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
      if((isAudioFocused || mode == "isolate") && !layoutOnly){
        players.forEach(p => {
          p.player.setMuted(p.id != focusedPlayer);
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
      if(!layoutOnly){
        players.forEach(p => {
          if(focusedQuality == 'no' || p.id == focusedPlayer){
            p.player.setQuality('chunked');
          }
          else if (focusedQuality == '480'){
            p.player.setQuality('480p30');
          }
          else if (focusedQuality == '720'){
            p.player.setQuality('720p60');
          }
        });
      }
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

        if(p.player){
          p.player.pause();
        }

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

    var playerHandler = function(e){
      var player = this;
      var isolating = e && e.ctrlKey;
      var removing = e && e.shiftKey;

      var modeMatches = removing || (isolating && mode == "isolate") || (!isolating && mode == "focus");

      if(focusedPlayer == player.id && modeMatches){
        setMode("even");
        setPlayerButtons(null, null);
        setPrimaryContainer(null);
        focusedPlayer = null;
      }
      else if (isolating && !removing){
        setMode("isolate");
        setPlayerButtons(player.id, "isolate");
        setPrimaryContainer(player.id);
        focusedPlayer = player.id;
        applyFocusAudio();
        applyFocusQuality();
      }
      else if (!removing){
        setMode("focus");
        setPlayerButtons(player.id, "active");
        setPrimaryContainer(player.id);
        focusedPlayer = player.id;
        applyFocusAudio();
        applyFocusQuality();
      }

      if(removing){
        removePlayer(player.id);
      }
    }

    var playerButtonContainer = document.getElementById("ct-settings-playerbuttons");
    players.forEach(player => {
      var button = document.createElement("button");
      button.id = 'ct-playerbutton-' + player.id;
      button.append(document.createTextNode(player.channelName));

      button.addEventListener('click', playerHandler.bind(player), true);
      playerButtonContainer.append(button);
    });

    playerHandler.apply(players[0]);  // by default, focus the first stream
  }

  function init(){
    var streams = parseStreamNames(location.hash);
    
    players = streams.map((c, i) => new PlayerModel(c, i));
    var container = document.getElementById("ct-player-container");
    container.classList.add("ct-playercount-" + players.length);
    
    initSettings();
  }

  init();
})();