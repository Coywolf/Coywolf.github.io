(function() {
  var layoutOnly = location.host != 'coywolf.github.io';

  var PlayerModel = function(channel, index){
    var self = this;

    self.channelName = channel;
    self.index = index;
    self.elementId = "ct-player-" + self.index; 

    self.playerContainerDiv = document.createElement("div");
    self.playerContainerDiv.classList.add("ct-player-container");
    if(self.index == 0){ self.playerContainerDiv.classList.add('primary'); }

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
    }
  }

  function parseStreamNames(path){
    if(path.startsWith('/')){
      path = path.substring(1);
    }

    var tokens = path.split('/');

    // not the best but just assuming that if the first token is 'twitch' that you're navigating directly to the twitch page, rather than trying to multistream the actual twitch channel
    if(tokens[0] == "twitch"){
      tokens.shift();
    }
    
    return tokens.slice(0, 4);
  }

  function init(){
    var pathname = layoutOnly ? "/twitch/vgbootcamp/vgbootcamp2/vgbootcamp3/vgbootcamp4" : location.pathname;
    var streams = parseStreamNames(pathname);

    var players = streams.map((c, i) => new PlayerModel(c, i));

    var togglePrimary = function(){
      var player = this;

      if(player.playerContainerDiv.classList.contains('primary')){
        player.playerContainerDiv.classList.remove('primary');
        document.getElementById("ct-player-container").classList.add('even');
      }
      else{
        players.forEach(p => p.playerContainerDiv.classList.remove('primary'));
        document.getElementById("ct-player-container").classList.remove('even');
        player.playerContainerDiv.classList.add('primary');
      }
    }

    players.forEach(player => {
      player.playerContainerDiv.addEventListener('click', togglePrimary.bind(player), true);
    })
  }

  init();
})();