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
    Common: ["Icebound Fortitude","Anti-Magic Shell"],
    "Blood": [],
    "Frost": [],
    "Unholy": []
  },
  "DemonHunter": {
    Common: [],
    "Havoc": ["Blur","Netherwalk"],
    "Vengeance": []
  },
  "Druid": {
    Common: ["Barkskin","Bear Form"],
    "Balance": ["Renewal"],
    "Feral": [],
    "Guardian": [],
    "Restoration": ["Ironbark"]
  },
  "Hunter": {
    Common: ["Exhilaration","Aspect of the Turtle","Survival of the Fittest"],
    "BeastMastery": [],
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
    Common: [],
    "Brewmaster": [],
    "Mistweaver": [],
    "Windwalker": ["Fortifying Brew"]
  },
  "Paladin": {
    Common: ["Divine Shield"],
    "Holy": ["Divine Protection"],
    "Protection": [],
    "Retribution": ["Shield of Vengeance"]
  },
  "Priest": {
    Common: ["Fade"],
    "Discipline": [],
    "Holy": [],
    "Shadow": ["Vampiric Embrace","Shadow Mend","Dispersion","Desperate Prayer","Power Word: Shield"]
  },
  "Rogue": {
    Common: ["Cloak of Shadows","Crimson Vial","Evasion","Feint"],
    "Assassination": [],
    "Outlaw": [],
    "Subtlety": []
  },
  "Shaman": {
    Common: ["Astral Shift", "Earth Elemental"],
    "Elemental": [],
    "Enhancement": [],
    "Restoration": []
  },
  "Warlock": {
    Common: ["Unending Resolve", "Dark Pact"],
    "Affliction": [],
    "Demonology": [],
    "Destruction": []
  },
  "Warrior": {
    Common: ["Spell Reflection", "Enraged Regeneration"],
    "Arms": [],
    "Fury": [],
    "Protection": []
  }
}