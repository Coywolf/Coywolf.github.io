(function() {
  var layoutOnly = location.host != 'coywolf.github.io';

  // settings
  var isSettingsPinned = false;
  var isLayoutHorizontal = true;
  var isAudioFocused = true;
  var focusedPlayer = null;

  var players = [];

  var PlayerModel = function(channel, index){
    var self = this;

    self.channelName = channel;
    self.index = index;
    self.elementId = "ct-player-" + self.index; 

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
      playerDiv.addEventListener('Twitch.Player.READY', function(){
        console.log(self.elementId);
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

  function initSettings(){
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

    var settingsPinButton = document.getElementById("ct-settings-bpin");
    settingsPinButton.addEventListener('click', function(e){
      isSettingsPinned = !isSettingsPinned;

      if(isSettingsPinned){
        settingsPinButton.classList.add("active");
        settings.classList.add("pinned");
      }
      else{
        settingsPinButton.classList.remove("active");
        settings.classList.remove("pinned");
      }
    });

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
    });
    settingsVerticalButton.addEventListener('click', function(e){
      isLayoutHorizontal = false;
      applyLayoutButtonChange();
    });
    applyLayoutButtonChange();  // init the buttons for the default setting

    // focus audio
    var settingsFocusNoButton = document.getElementById("ct-settings-bnfoc");
    var settingsFocusYesButton = document.getElementById("ct-settings-byfoc");
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
    });
    settingsFocusYesButton.addEventListener('click', function(e){
      isAudioFocused = true;
      updateAudioButtonStyles();
    });
    updateAudioButtonStyles();  // init the buttons for the default setting

    // players
    var togglePrimary = function(){
      var player = this;

      if(focusedPlayer == player.index){
        // this is already the focused player, so toggle off focus mode
        var playerButton = document.getElementById("ct-playerbutton-" + player.index);
        playerButton.classList.remove("active");
        player.playerContainerDiv.classList.remove('primary');

        var container = document.getElementById("ct-player-container");
        container.classList.remove("focus");
        container.classList.add("even");

        focusedPlayer = null;
      }
      else{
        // not the focused player, so either changing focus or turning focus mode on
        if(focusedPlayer != null){
          var oldPlayerButton = document.getElementById("ct-playerbutton-" + focusedPlayer);
          oldPlayerButton.classList.remove("active");
          players[focusedPlayer].playerContainerDiv.classList.remove('primary');
        }

        var newPlayerButton = document.getElementById("ct-playerbutton-" + player.index);
        newPlayerButton.classList.add("active");
        player.playerContainerDiv.classList.add('primary');

        var container = document.getElementById("ct-player-container");
        container.classList.remove("even");
        container.classList.add("focus");

        focusedPlayer = player.index;
        
        if(isAudioFocused && !layoutOnly){
          players.forEach(p => {
            p.player.setMuted(p.index != focusedPlayer);
          });
        }
      }
    }

    var playerButtonContainer = document.getElementById("ct-settings-playerbuttons");
    players.forEach(player => {
      var button = document.createElement("button");
      button.id = 'ct-playerbutton-' + player.index;
      button.append(document.createTextNode(player.channelName));

      button.addEventListener('click', togglePrimary.bind(player), true);
      playerButtonContainer.append(button);
    });

    togglePrimary.apply(players[0]);  // by default, focus the first stream
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