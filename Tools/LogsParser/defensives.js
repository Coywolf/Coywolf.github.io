//Racials (the new troll heal)
//Covenant defensives (fleshcraft)

/* const ability_list = {
  "Death Knight": {
    Common: ["Icebound Fortitude","Anti-Magic Shell","Anti-Magic Zone","Lichborne"],
    "Blood": ["Dancing Rune Weapon","Rune Tap","Vampiric Blood"],
    "Frost": ["Death Strike"],
    "Unholy": ["Death Strike"]
  },
  "Demon Hunter": {
    Common: [],
    "Havoc": ["Blur","Darkness"],
    "Vengeance": ["Demon Spikes","Fiery Brand","Metamorphosis"]
  },
  "Druid": {
    Common: ["Barkskin","Bear Form"],
    "Balance": ["Renewal"],
    "Feral": ["Survival Instincts"],
    "Guardian": ["Survival Instincts","Frenzied Regeneration"],
    "Restoration": ["Ironbark"]
  },
  "Hunter": {
    Common: ["Exhilaration","Aspect of the Turtle","Survival of the Fittest"],
    "Beast Mastery": [],
    "Marksmanship": [],
    "Survival": []
  },
  "Mage": {
    Common: ["Alter Time","Ice Block"],
    "Arcane": ["Prismatic Barrier"],
    "Fire": ["Blazing Barrier"],
    "Frost": ["Ice Barrier"]    
  },
  "Monk": {
    Common: [],
    "Brewmaster": ["Fortifying Brew","Zen Meditation","Dampen Harm"],
    "Mistweaver": [],
    "Windwalker": ["Fortifying Brew"]    
  },
  "Paladin": {
    Common: ["Divine Shield","Lay on Hands","Blessing of Protection"],
    "Holy": ["Divine Protection"],
    "Protection": ["Guardian of Ancient Kings","Ardent Defender","Word of Glory","Shield of the Righteous"],
    "Retribution": []    
  },
  "Priest": {
    Common: [],
    "Discipline": [],
    "Holy": ["Desperate Prayer"],
    "Shadow": ["Vampiric Embrace","Shadow Mend","Fade","Dispersion","Desperate Prayer","Power Word: Shield"]    
  },
  "Rogue": {
    Common: ["Cloak of Shadows","Crimson Vial","Evasion","Feint"],
    "Assassination": [],
    "Outlaw": [],
    "Subtlety": []    
  },
  "Shaman": {
    Common: ["Astral Shift"],
    "Elemental": [],
    "Enhancement": [],
    "Restoration": []    
  },
  "Warlock": {
    Common: ["Unending Resolve"],
    "Affliction": [],
    "Demonology": [],
    "Destruction": ["Soul Leech"]    
  },
  "Warrior": {
    Common: ["Spell Reflection"],
    "Arms": [],
    "Fury": [],
    "Protection": ["Shield Wall","Last Stand","Demoralizing Shout"]    
  }
} */

const ability_list = {
  "DeathKnight": {
    Common: ["Icebound Fortitude","Anti-Magic Shell","Death Pact"],
    "Blood": ["Rune Tap", "Dancing Rune Weapon", "Tombstone", "Vampiric Blood", "Bone Shield"],
    "Frost": [],
    "Unholy": ["Lichborne"]
  },
  "DemonHunter": {
    Common: ["Darkness"],
    "Havoc": ["Blur","Netherwalk"],
    "Vengeance": ["Fel Devastation", "Fiery Brand", "Demon Spikes", "Metamorphosis"]
  },
  "Druid": {
    Common: ["Barkskin","Bear Form", "Renewal"],
    "Balance": [],
    "Feral": ["Survival Instincts"],
    "Guardian": ["Survival Instincts", "Berserk", "Iron Fur", "Frenzied Regeneration"],
    "Restoration": ["Ironbark"]
  },
  "Evoker": {
    Common: ["Obsidian Scales", "Renewing Blaze", "Zephyr"],
    "Devastation": [],
    "Preservation": []
  },
  "Hunter": {
    Common: ["Exhilaration","Aspect of the Turtle","Survival of the Fittest"],
    "BeastMastery": ["Fortitude of the Bear"],
    "Marksmanship": [],
    "Survival": []
  },
  "Mage": {
    Common: ["Alter Time","Ice Block", "Mirror Image", "Greater Invisibility"],
    "Arcane": ["Prismatic Barrier"],
    "Fire": ["Blazing Barrier"],
    "Frost": ["Ice Barrier"]
  },
  "Monk": {
    Common: ["Fortifying Brew", "Dampen Harm", "Diffuse Magic"],
    "Brewmaster": ["Purifying Brew", "Celestial Brew", "Zen Meditation", "Invoke Niuzao, the Black Ox", "Healing Elixir"],
    "Mistweaver": ["Healing Elixir"],
    "Windwalker": []
  },
  "Paladin": {
    Common: ["Divine Shield", "Blessing of Protection"],
    "Holy": ["Divine Protection"],
    "Protection": ["Shield of the Righteous", "Eye of Tyr", "Ardent Defender", "Guardian of Ancient Kings", "Sentinel"],
    "Retribution": ["Shield of Vengeance", "Divine Protection"]
  },
  "Priest": {
    Common: ["Fade", "Desperate Prayer"],
    "Discipline": [],
    "Holy": [],
    "Shadow": ["Vampiric Embrace","Shadow Mend","Dispersion","Power Word: Shield"]
  },
  "Rogue": {
    Common: ["Cloak of Shadows","Crimson Vial","Evasion","Feint"],
    "Assassination": [],
    "Outlaw": [],
    "Subtlety": []
  },
  "Shaman": {
    Common: ["Astral Shift", "Earth Shield"],
    "Elemental": [],
    "Enhancement": [],
    "Restoration": []
  },
  "Warlock": {
    Common: ["Unending Resolve", "Dark Pact", "Mortal Coil"],
    "Affliction": [],
    "Demonology": [],
    "Destruction": []
  },
  "Warrior": {
    Common: ["Spell Reflection", "Bitter Immunity", "Impending Victory", "Avatar"],
    "Arms": ["Die by the Sword", "Ignore Pain"],
    "Fury": ["Enraged Regeneration"],
    "Protection": ["Demoralizing Shout", "Last Stand", "Shield Wall", "Ignore Pain", "Shield Block"]
  }
}
