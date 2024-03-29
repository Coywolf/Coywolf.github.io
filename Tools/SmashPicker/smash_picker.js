// todo
// animation for roll

(function() {
  // grid width and height of the roster image
  const gridWidth = 13; 
  const gridHeight = 7;
  const characterTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";  // character table for encoding selections, not quite actually base64, replaced + and / to always be URL safe
  const localStorageKey = "smash-picker-settings";

  var animationSteps = 20;
  var totalTime = 0;

  var rosterImage = document.getElementById("roster-image");  // the image itself
  var container = rosterImage.parentElement;

  var isAllowList = true; // mode, either allow list or deny list
  var isFullAnimation = true; // toggle between 1 and 20 animation steps
  // the div for the random result, plus it's grid x and y. holding the x and y to be able to hide/show the selection behind it
  var randomBox, randomBoxX, randomBoxY;  

  var invalids = [78, 79, 88, 89, 90];  // indexes of the invalid spots, so the bottom left and right corners, plus the random
  var selections = [];  // user selected grid cells
  // holds the inverse of the selection, for use with the deny list mode. generated when random is rolled, cleared when selection is changed
  var denyList = [];  

  function toggleSelection(x, y, skipSave){
    var index = coordsToIndex(x, y);

    if(invalids.includes(index)) return;

    denyList = [];  // reset deny list    

    // hide the random box, so you can see what's selected again
    if(randomBox){
      randomBox.classList.add("hidden");
      setSelectionBoxHidden(randomBoxX, randomBoxY, false);
    }    

    var foundIndex = selections.indexOf(index);
    if(foundIndex >= 0){
      selections.splice(foundIndex, 1);

      var selectionBox = document.getElementById(getSelectionBoxId(x, y));
      selectionBox.remove();
    }
    else{
      selections.push(index);

      var selectionBox = document.createElement("div");
      selectionBox.id = getSelectionBoxId(x, y);
      selectionBox.classList.add("selection-box");
      selectionBox.style["grid-column"] = x+1;
      selectionBox.style["grid-row"] = y+1;
      container.appendChild(selectionBox);
    }

    if(!skipSave) save();
  }

  function pickRandom(){
    if(selections.length == 0 && isAllowList) return;

    var list;
    if(isAllowList){
      list = selections;
    }
    else{
      if(denyList.length == 0) denyList = makeDenyList();
      list = denyList;
    }

    // clear the last result and costume
    setCharacterResultBorder(false); 
    setCostumeResult();

    shuffle(list);
    totalTime = 0;
    animate_callback(list, 0);    
  }

  function animate_getTimeout(index){    
    const minTimeout = 100;
    const maxTimeout = 600;

    var x = index / (animationSteps-2);
    var t = x * x * x;  // easeInQuart https://easings.net/

    var timeout = minTimeout + ((maxTimeout - minTimeout) * t);
    //console.log(index, timeout);
    totalTime += timeout;
    return timeout;
  }

  function animate_callback(list, index){
    var characterIndex = list[index % list.length];
    var coords = indexToCoords(characterIndex);
    
    setRandomBox(coords.x, coords.y);
    setCharacterResult(characterIndex);

    if(list.length > 1 && index < animationSteps-1){
      setTimeout(animate_callback, animate_getTimeout(index), list, index+1);
    }
    else{
      //console.log(totalTime); 
      // delayed by the animation time of the text, so the border should come on when the text is done
      setTimeout(() => {
        setCharacterResultBorder(true);
        setCostumeResult(Math.floor(Math.random() * 8));
      }, 300);
    }
  }

  function makeDenyList(){
    // return the inverse of selections, so all of the characters not selected
    var list = [...Array(91).keys()];  // crazy ES6 shit? 

    for(var index of invalids.concat(selections)){
      list.splice(list.indexOf(index), 1);
    }

    return list;
  }

  function setCharacterResultBorder(visible){
    var characterBorder = document.getElementById("character-border");
    if(visible){
      // need to clear out the hidden name text to make sure it's not expanding the border
      var characterListElement = document.getElementById("character-list");
      var nameElement = characterListElement.lastElementChild;
      while(nameElement.firstChild){ nameElement.removeChild(nameElement.firstChild); }

      characterBorder.classList.add("on");

      if(randomBox){
        randomBox.classList.add("final");
      }
    }
    else{
      characterBorder.classList.remove("on");

      if(randomBox){
        randomBox.classList.remove("final");
      }
    }
  }

  function setCharacterResult(num){
    var label = roster[num];

    var characterListElement = document.getElementById("character-list");
    var oldNameElement = characterListElement.firstElementChild;
    var newNameElement = characterListElement.lastElementChild;

    // set the new name
    while(newNameElement.firstChild){ newNameElement.removeChild(newNameElement.firstChild); }
    newNameElement.appendChild(document.createTextNode(label));

    // move the new name to the top
    characterListElement.insertBefore(newNameElement, oldNameElement);

    // trigger the animation
    characterListElement.classList.remove("change");
    characterListElement.offsetWidth;
    characterListElement.classList.add("change");
  }

  function setCostumeResult(num){
    if(num >= 0){
      var label = "Costume " + (num+1);
      if(num > 0){
        label += " (" + ["", "1R", "2R", "3R", "4R", "3L", "2L", "1L"][num] + ")";
      }

      var costumeElement = document.getElementById("costume");
      while(costumeElement.firstChild){ costumeElement.removeChild(costumeElement.firstChild); }
      costumeElement.appendChild(document.createTextNode(label));

      costumeElement.style.display = "block";
    }
    else{
      var costumeElement = document.getElementById("costume");
      costumeElement.style.display = "none";
    }
  }

  function setRandomBox(x, y){
    if(!randomBox){
      randomBox = document.createElement("div");
      randomBox.id = "random-box";
      randomBox.classList.add("random-box");      
      container.appendChild(randomBox);
    }

    randomBox.classList.remove("hidden");

    setSelectionBoxHidden(randomBoxX, randomBoxY, false);

    randomBox.style["grid-column"] = x+1;
    randomBox.style["grid-row"] = y+1;
    randomBoxX = x;
    randomBoxY = y;

    setSelectionBoxHidden(randomBoxX, randomBoxY, true);
  }

  function setSelectionBoxHidden(x, y, hidden){
    var selectionBox = document.getElementById(getSelectionBoxId(randomBoxX, randomBoxY));
    if(selectionBox){
      if(hidden){
        selectionBox.classList.add("hidden");
      }
      else{
        selectionBox.classList.remove("hidden");
      }
    }
  }

  function resetSelections(skipSave){
    if(randomBox){
      randomBox.classList.add("hidden");
      setSelectionBoxHidden(randomBoxX, randomBoxY, false);
    }

    selections = [];

    var selectionBoxes = document.getElementsByClassName("selection-box");
    Array.from(selectionBoxes).forEach(function(box){
      box.remove();
    });

    if(!skipSave) save();
  }

  function shuffle(array) {
    var m = array.length, t, i;
  
    // While there remain elements to shuffle…
    while (m) {
  
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
  
    return array;
  }

  function getSelectionBoxId(x, y){
    return "box-" + x + "-" + y;
  }

  function coordsToIndex(x, y){
    return (y * gridWidth) + x;
  }

  function indexToCoords(ind){
    return {
      x: ind % gridWidth,
      y: Math.floor(ind / gridWidth)
    }
  }

  function onClick(e){    
    var imageWidth = rosterImage.clientWidth;
    var imageHeight = rosterImage.clientHeight;
    var clickX = e.offsetX;
    var clickY = e.offsetY;

    var x = Math.floor(clickX / (imageWidth / gridWidth));
    var y = Math.floor(clickY / (imageHeight / gridHeight));

    toggleSelection(x, y);
  }

  function setMode(mode, skipSave){
    isAllowList = mode;

    if(isAllowList){
      document.getElementById("al-button").classList.add("active");
      container.classList.add("allow");

      document.getElementById("dl-button").classList.remove("active");
      container.classList.remove("deny");
    }
    else{
      document.getElementById("al-button").classList.remove("active");
      container.classList.remove("allow");

      document.getElementById("dl-button").classList.add("active");
      container.classList.add("deny");
    }

    if(!skipSave) save();
  }

  function setAnimation(mode, skipSave){
    isFullAnimation = mode;

    if(isFullAnimation){
      document.getElementById("animation-button").innerText = "Full Animation";
      animationSteps = 20;
    }
    else{
      document.getElementById("animation-button").innerText = "Short Animation";
      animationSteps = 1;
    }

    if(!skipSave) save();
  }

  // parseInt(x, 2)
  // x.toString(2)
  function encode(){
    var encodedString = "";

    // sort selections list, so it can just be stepped through instead of scanning through each time
    selections.sort((a, b) => a - b);

    var selectionIndex = 0;
    var invalidIndex = 0;
    var binaryChunk = 0;
    for(var i = 0; i < gridWidth * gridHeight + 2; i++){ 
      if(i == gridWidth * gridHeight){
        // the mode and animation need to be encoded as well, so +2 on the loop and the first bit will be the mode
        binaryChunk = binaryChunk | isAllowList;
      }
      else if(i == gridWidth * gridHeight + 1){
        // the mode and animation need to be encoded as well, so +2 on the loop and the first bit will be the mode
        binaryChunk = binaryChunk | isFullAnimation;
      }
      else if(i == invalids[invalidIndex]){
        // skip over this, so this would be | 0 so no need to do anything with the chunk
        invalidIndex++;
      }
      else if(i == selections[selectionIndex]){
        // found the next selection
        binaryChunk = binaryChunk | 1;
        selectionIndex++;
      }
      // else, neither invalid nor selection, again | 0 and no need to do anything with the chunk

      if(i % 6 == 5 || i == gridWidth * gridHeight + 1){
        // need to fill out the whole last chunk to make it easier for decoding
        if(i == gridWidth * gridHeight + 1){
          binaryChunk = binaryChunk << 5 - (i % 6);
        }

        // end of the chunk or loop, convert to letter from the characterTable and reset for the next chunk
        encodedString += characterTable[binaryChunk];
        binaryChunk = 0;
      }
      else{
        // still going on this chunk, shift left
        binaryChunk = binaryChunk << 1;
      }
    }

    return encodedString;
  }

  function decode(encodedString){
    var gridSelections = [], mode, animation;
    
    var expandedString = "";
    for(var encodedCharacter of encodedString){
      var characterTableIndex = characterTable.indexOf(encodedCharacter);
      expandedString += characterTableIndex.toString(2).padStart(6, '0');
    }
    
    for(var i = 0; i < expandedString.length; i++){
      if(i == gridWidth * gridHeight){
        // done with all the selection data, this one is the mode bit
        mode = expandedString[i] == 1;
      }
      else if(i == gridWidth * gridHeight + 1){
        // this one is the animation bit
        animation = expandedString[i] == 1;
        break;
      }
      else if(expandedString[i] == 1){
        gridSelections.push(i);
      }
    }
    
    return {selections: gridSelections, isAllowList: mode, isFullAnimation: animation};
  }

  function save(){
    // encode and write to both URL and cookie
    var encodedString = encode();
    window.history.replaceState(null, 'Smash Picker', "#" + encodedString);
    localStorage.setItem(localStorageKey, encodedString);
  }

  function load(){
    // decode string found in URL if there is one, otherwise cookie if there is one
    var decoded;

    if(location.hash){
      decoded = decode(location.hash.replace("#", ""));
    }
    else {
      var storedString = localStorage.getItem(localStorageKey);

      if(storedString){
        decoded = decode(storedString);
        
        // loading from local storage which means the URL was empty, so go ahead and set the URL to the local storage value too
        window.history.replaceState(null, 'Smash Picker', "#" + storedString);
      }
    }

    if(decoded){
      setMode(decoded.isAllowList, true);
      setAnimation(decoded.isFullAnimation, true);
      resetSelections(true);

      for(var selection of decoded.selections){
        var coords = indexToCoords(selection);
        toggleSelection(coords.x, coords.y, true);
      }
    }
  }

  function init(){
    rosterImage.addEventListener("click", onClick);

    var randomButton = document.getElementById("random-button");
    randomButton.addEventListener("click", pickRandom);

    var allowListButton = document.getElementById("al-button");
    allowListButton.addEventListener("click", function(){setMode(true);} );

    var denyListButton = document.getElementById("dl-button");
    denyListButton.addEventListener("click", function(){setMode(false);} );

    var resetButton = document.getElementById("reset-button");
    resetButton.addEventListener("click", function(){resetSelections();} );

    var animationButton = document.getElementById("animation-button");
    animationButton.addEventListener("click", function(){setAnimation(!isFullAnimation);} );

    setMode(false, true);
    setAnimation(true, true);
    load();
  }

  init();
  window.setCharacterResult = setCharacterResult;
})();