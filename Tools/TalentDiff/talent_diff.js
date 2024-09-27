// using this to hook the calls made in the talents-dragonflight script loaded in
WH = {};
WH.setPageData = function(key, data){
  WH[key] = data;
};
WH.setPageData("specs", {
  250: {classId: 6, className: 'death-knight', specName: 'blood'},
  251: {classId: 6, className: 'death-knight', specName: 'frost'},
  252: {classId: 6, className: 'death-knight', specName: 'unholy'},
  577: {classId: 12, className: 'demon-hunter', specName: 'havoc'},
  581: {classId: 12, className: 'demon-hunter', specName: 'vengeance'},
  102: {classId: 11, className: 'druid', specName: 'balance'},
  103: {classId: 11, className: 'druid', specName: 'feral'},
  104: {classId: 11, className: 'druid', specName: 'guardian'},
  105: {classId: 11, className: 'druid', specName: 'restoration'},
  1467: {classId: 13, className: 'evoker', specName: 'devastation'},
  1468: {classId: 13, className: 'evoker', specName: 'preservation'},
  253: {classId: 3, className: 'hunter', specName: 'beast-mastery'},
  254: {classId: 3, className: 'hunter', specName: 'marksmanship'},
  255: {classId: 3, className: 'hunter', specName: 'survival'},
  62: {classId: 8, className: 'mage', specName: 'arcane'},
  63: {classId: 8, className: 'mage', specName: 'fire'},
  64: {classId: 8, className: 'mage', specName: 'frost'},
  268: {classId: 10, className: 'monk', specName: 'brewmaster'},
  270: {classId: 10, className: 'monk', specName: 'mistweaver'},
  269: {classId: 10, className: 'monk', specName: 'windwalker'},
  65: {classId: 2, className: 'paladin', specName: 'holy'},
  66: {classId: 2, className: 'paladin', specName: 'protection'},
  70: {classId: 2, className: 'paladin', specName: 'retribution'},
  256: {classId: 5, className: 'priest', specName: 'discipline'},
  257: {classId: 5, className: 'priest', specName: 'holy'},
  258: {classId: 5, className: 'priest', specName: 'shadow'},
  259: {classId: 4, className: 'rogue', specName: 'assassination'},
  260: {classId: 4, className: 'rogue', specName: 'outlaw'},
  261: {classId: 4, className: 'rogue', specName: 'subtlety'},
  262: {classId: 7, className: 'shaman', specName: 'elemental'},
  263: {classId: 7, className: 'shaman', specName: 'enhancement'},
  264: {classId: 7, className: 'shaman', specName: 'restoration'},
  265: {classId: 9, className: 'warlock', specName: 'affliction'},
  266: {classId: 9, className: 'warlock', specName: 'demonology'},
  267: {classId: 9, className: 'warlock', specName: 'destruction'},
  71: {classId: 1, className: 'warrior', specName: 'arms'},
  72: {classId: 1, className: 'warrior', specName: 'fury'},
  73: {classId: 1, className: 'warrior', specName: 'protection'},  
});

(function() {
  const importCharList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const hashCharList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";  // replaces +/ with -_ to make it url safe
  const bitsPerChar = 6;

  const highlightSimilarities = false;  // was doing this to test, all the nodes that are the same are just white, but I don't really like it, it's too much. maybe make it optional one day idk

  var originalInput = document.getElementById("talent-string-original");
  var newInput = document.getElementById("talent-string-new");
  var runBtn = document.getElementById("compute");
  var errorText = document.getElementById("error-text");

  var talentStringParser = function(talentString){
    var self = this;

    self.talentString = talentString;

    self.version;
    self.specId;
    self.specRecord;
    
    self.values = [];               // the list of values as parsed from the base64 string
    self.valueIndex = 0;            // which value is currently being read
    self.currentValue;              // the current value being read. this is decremented as bits are read
    self.currentValueBitIndex = 0;  // the number of bits that have been read from currentValue so far

    self.extractValue = function(bitWidth){
      if (self.valueIndex >= self.values.length) {
        return null;
      }
      
      let value = 0;
      let bitsNeeded = bitWidth;
      let extractedBits = 0;

      while (bitsNeeded > 0) {
        let remainingBits = bitsPerChar - self.currentValueBitIndex;  // how many bits are left in the current value
        let bitsToExtract = Math.min(remainingBits, bitsNeeded);  // how many bits to actually read from the current value        
        self.currentValueBitIndex += bitsToExtract;

        let maxStorableValue = 1 << bitsToExtract;
        let remainder = self.currentValue % maxStorableValue; // this gets all the bits to the right of where the 1 was shifted in the above line. so this would be the bitsToExtract number of bits being read next
        self.currentValue = self.currentValue >> bitsToExtract; // shift off the bits that were just read
        value += remainder << extractedBits;  // shift the bits that were read by how many bits have been read so far. So this would be 0 for the first bit of the number

        // count how many bits were read, and decrement from how many bits were needed
        extractedBits += bitsToExtract;
        bitsNeeded -= bitsToExtract;

        // are there still bits to be read from the current value?
        if (bitsToExtract < remainingBits) {
            break
        }
        
        // if this value has been fully read, load up the next one
        self.valueIndex++;
        self.currentValueBitIndex = 0;
        self.currentValue = self.values[self.valueIndex];
      }

      return value;
    }

    self.parseHeader = function(){
      let bitWidthVersion = 8;
      let bitWidthSpec = 16;
      let bitWidthTreeHash = 128;
      let bitWidthTreeHashBlockSize = 8;

      self.version = self.extractValue(bitWidthVersion);
      self.specId = self.extractValue(bitWidthSpec);
      self.specRecord = WH["specs"][self.specId];

      for(let i = bitWidthTreeHash; i > 0; i -= bitWidthTreeHashBlockSize){
        self.extractValue(bitWidthTreeHashBlockSize);
      }
    }

    // build a dictionary of nodeId to {cell, isSpecTree}
    self.getNodeMap = function(classId, specId){
      let classTree = WH["wow.talentCalcDragonflight.live.trees"].find(t => t.id == classId);
      let specTree = WH["wow.talentCalcDragonflight.live.trees"].find(t => t.id == specId);
      let nodeMap = {};

      function mapNodes(tree, isSpecTree){
        let keys = Object.keys(tree.talents);
        for(let i = 0; i < keys.length; i++){
          let talent = tree.talents[keys[i]][0];
          nodeMap[talent.node] = {cell: talent.cell, isSpecTree: isSpecTree, spellName: talent.spells[0].name};
        }
      }
      
      mapNodes(classTree, false);
      mapNodes(specTree, true);

      return nodeMap;
    }

    self.loadValues = function(){
      for(let i = 0; i < self.talentString.length; i++){
        self.values.push(importCharList.indexOf(self.talentString[i]));
      }
      self.currentValue = self.values[0];
    }

    self.getNodes = function(){
      self.loadValues();
      self.parseHeader();

      // read out all the node selection info from the import string
      let nodes = [];
      while (self.valueIndex < self.values.length) {
        let isNodeSelected = self.extractValue(1) === 1;
        let isPurchased = false;
        let isPartiallyRanked = false;
        let ranksPurchased = 0;
        let isChoiceNode = false;
        let choiceEntryIndex = 0;

        if (isNodeSelected) {
          isPurchased = self.extractValue(1) === 1;

          if(isPurchased){
            isPartiallyRanked = self.extractValue(1) === 1;
            if (isPartiallyRanked) {
              ranksPurchased = self.extractValue(6);
            }

            isChoiceNode = self.extractValue(1) === 1;
            if (isChoiceNode) {
              choiceEntryIndex = self.extractValue(2);
            }
          }
        }

        nodes.push({
          isNodeSelected: isNodeSelected,
          isPurchased: isPurchased,
          isPartiallyRanked: isPartiallyRanked,
          partialRanksPurchased: ranksPurchased,
          isChoiceNode: isChoiceNode,
          choiceNodeSelection: choiceEntryIndex
        });
      }

      // tie in the wowhead data to get the cell corresponding to each node
      let dataNodes = WH["wow.talentCalcDragonflight.live.nodes"][self.specRecord.classId].nodes;
      let nodeMap = self.getNodeMap(self.specRecord.classId, self.specId);
      
      for(let i = 0; i < nodes.length; i++){
        let node = nodes[i];

        if(i < dataNodes.length){
          node.nodeId = dataNodes[i];
          
          let nodeMapRecord = nodeMap[node.nodeId];
          // expected to not find anything for half the nodes, as those will be the other spec trees that aren't used
          if(nodeMapRecord){
            node.cell = nodeMapRecord.cell;
            node.spellName = nodeMapRecord.spellName;
            node.isSpecTree = nodeMapRecord.isSpecTree;
          }
        }
      }

      return nodes;
    }
  }

  // check for differences betweeen the parsed nodes. Differences written to the original nodes as the color to use
  function calculateDifferences(originalNodes, newNodes){
    for(let i = 0; i < originalNodes.length; i++){
      let originalNode = originalNodes[i];
      let newNode = newNodes[i];

      if(!originalNode.cell){
        // not in one of the two trees we care about, skip it
        continue;
      }
      else if(originalNode.isNodeSelected || newNode.isNodeSelected){
        // only care if one side or the other is selected. both unselected just stays unmarked
        if(originalNode.isNodeSelected && newNode.isNodeSelected){
          if(originalNode.isChoiceNode){
            if(originalNode.choiceNodeSelection == newNode.choiceNodeSelection){
              // choice node and the choice is the same, white
              if(highlightSimilarities){
                originalNode.annotation = 2;
              }
            }
            else{
              // choice node but the choice is different, blue
              originalNode.annotation = 4;
            }
          }
          else{
            if(originalNode.isPartiallyRanked || newNode.isPartiallyRanked){
              let originalRanks = originalNode.isPartiallyRanked ? originalNode.partialRanksPurchased : 99;
              let newRanks = newNode.isPartiallyRanked ? newNode.partialRanksPurchased : 99;

              if(originalRanks == newRanks){
                // number of ranks hasn't changed, white
                if(highlightSimilarities){
                  originalNode.annotation = 2;
                }
              }
              else if(originalRanks > newRanks){
                // number of ranks went down, but the node is still selected, orange
                originalNode.annotation = 6;
              }
              else{
                // number of ranks went up, but it's still partially selected, blue
                originalNode.annotation = 4;
              }
            }
            else{
              // neither is partially ranked but they're both selected, white
              if(highlightSimilarities){
                originalNode.annotation = 2;
              }
            }
          }
        }
        else if(originalNode.isNodeSelected){
          // original is selected but new node is not, red
          originalNode.annotation = 9;
        }
        else{
          if(newNode.isPartiallyRanked){
            // original is not selected and new is partially selected, blue
            originalNode.annotation = 4;
          }
          else{
            // original is not selected and new is fully selected, green
            originalNode.annotation = 3;
          }
        }
      }
    }
  }

  // generate the wowhead annotation url for the diffed nodes
  // format is:
  // an initial character
  // 0 or 1 for annotating or not

  // number of cells to encode in the class tree
  // (for each cell to encode) one or two characters for the cell, then one character for the cell value
  // number of choices to encode in the class tree
  // (for each choice to encode) one or two characters for the choice, then one character for the choice value
  // number of connections to encode in the class tree
  // (for each connection to encode) one or two characters for the connection, then one character for the connection value

  // number of cells to encode in the spec tree
  // (for each cell to encode) one or two characters for the cell, then one character for the cell value
  // number of choices to encode in the spec tree
  // (for each choice to encode) one or two characters for the choice, then one character for the choice value
  // number of connections to encode in the spec tree
  // (for each connection to encode) one or two characters for the connection, then one character for the connection value

  // (only if pvp talents are selected)
  // number of pvp talents to encode
  // (for each pvp talent) 3 or 4 characters to encode each pvp talent
  function makeWowheadUrl(specRecord, originalParsed){
    let url = `https://www.wowhead.com/talent-calc/${specRecord.className}/${specRecord.specName}`;

    let initialHashChar = 3;
    let bitMask = (1 << bitsPerChar) - 1;
    let halfPage = 1 << bitsPerChar - 1;

    let hash = importCharList[initialHashChar]; // not sure why but they always have this initial character in the hash
    let toEncode = [1]; // always start with 1 to indicate we're annotating    

    // filter to only the nodes that have some annotation to include, and separated per tree
    let classTreeNodes = originalParsed.filter(n => n.annotation && !n.isSpecTree);
    let specTreeNodes = originalParsed.filter(n => n.annotation && n.isSpecTree);

    if(classTreeNodes.length == 0 && specTreeNodes.length == 0){
      // nothing to annotate, don't return any hash and just link to the calculator
      return url;
    }

    function encodeTree(nodes){
      nodes.sort((a, b) => a.cell - b.cell);

      let numberOfNodes = nodes.length;
      if(numberOfNodes < halfPage){
        // can just encode as a single character
        toEncode.push(numberOfNodes);
      }
      else{
        // need to encode as two base64 characters
        // right shift by the number of bits in a character, mask that down to that same number of bits just in case it's a huuuuge number, or that with the half page to make sure to set the 6th bit. so this essentially counts up from 32 for every 64
        // second number is just taking the first bitsPerChar, effectively the remainder from the paging
        toEncode.push(numberOfNodes >> bitsPerChar & bitMask | halfPage, numberOfNodes & bitMask);
      }
      
      let lastCell = -1;
      for(let i = 0; i < nodes.length; i++){
        // cells are encoded as the difference between it and the previous cell, if that difference is under 32 to save characters in the hash (don't really understand since this could be done up to 64, bug on their part?)
        // otherwise it's just encoded as the full next cell number
        let cellDelta = nodes[i].cell - lastCell - 1;
        if(cellDelta < halfPage){
          // can just encode as a single character
          toEncode.push(cellDelta);
        }
        else{
          // need to encode as two base64 characters, same as above
          toEncode.push(nodes[i].cell >> bitsPerChar & bitMask | halfPage, nodes[i].cell & bitMask);
        }
        lastCell = nodes[i].cell;
        
        // mask to make sure annotation is within a character
        toEncode.push(nodes[i].annotation & bitMask);
      }

      toEncode.push(0); // 0 to indicate not encoding any choices
      toEncode.push(0); // 0 to indicate not encoding any connections
    }

    encodeTree(classTreeNodes);
    encodeTree(specTreeNodes);
    // this is where pvp talents would go

    for(let i = 0; i < toEncode.length; i++){
      hash += hashCharList.charAt(toEncode[i]);
    }

    return `${url}/${hash}`;
  }

  function computeDiff(){
    errorText.innerHTML = "";

    if(!WH["wow.talentCalcDragonflight.live.trees"] || !WH["wow.talentCalcDragonflight.live.nodes"]){
      errorText.innerHTML = "Failed to load Wowhead spec data";
      return;
    }

    var originalTalentString = originalInput.value;
    var newTalentString = newInput.value;
    if(!originalTalentString || !newTalentString){
      errorText.innerHTML = "You must enter both an original and new import string";
      return;
    }

    var originalParser = new talentStringParser(originalTalentString);
    var originalNodes = originalParser.getNodes();
    
    var newParser = new talentStringParser(newTalentString);
    var newNodes = newParser.getNodes();

    if(!originalParser.specRecord){
      errorText.innerHTML = "Unable to find the spec record for the original import string";
      return;
    }
    if(!newParser.specRecord){
      errorText.innerHTML = "Unable to find the spec record for the new import string";
      return;
    }
    if(originalParser.version != newParser.version){
      errorText.innerHTML = `The import strings are for two different versions of the import; they must match (${originalParser.version} vs ${newParser.version})`;
      return;
    }
    if(originalParser.specId != newParser.specId){
      errorText.innerHTML = `The import strings are for two different specializations; they must match (${originalParser.specId} vs ${newParser.specId})`;
      return;
    }
    // if(originalNodes.length != newNodes.length){
    //   errorText.innerHTML = `Parsed a different number of nodes from the two import strings, most likely they are incomplete pastes (${originalNodes.length} vs ${newNodes.length})`;
    //   return;
    // }

    calculateDifferences(originalNodes, newNodes);

    var annotationUrl = makeWowheadUrl(originalParser.specRecord, originalNodes);
    window.open(annotationUrl, '_blank');
  }

  function init(){
    runBtn.addEventListener("click", computeDiff);
  }

  init();
})();