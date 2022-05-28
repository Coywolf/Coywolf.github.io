ko.bindingHandlers.toggleClick = {
    init: function (element, valueAccessor) {
        var value = valueAccessor();

        ko.utils.registerEventHandler(element, "click", function () {
            value(!value());
        });
    }
};

(function() {
	function isPotion(auraName){
		return auraName == "Potion of Spectral Strength" || auraName == "Potion of Spectral Stamina" || auraName == "Potion of Spectral Agility" || auraName == "Potion of Spectral Intellect"
			|| auraName == "Potion of Deathly Fixation" || auraName == "Potion of Empowered Exorcisms" || auraName == "Potion of Divine Awakening" 
			|| auraName == "Potion of Phantom Fire" || auraName == "Potion of Sacrificial Anima" || auraName == "Potion of Hardened Shadows"
		;
	}
	
	function isBattleRune(auraName){
		return auraName == "Veiled Augmentation" || auraName == "Eternal Augmentation";
	}

	function auraFilter(aura){
		return isPotion(aura.name) || isBattleRune(aura.name);
	}
	
	function isHealingCast(castName){
		return isHealthstoneCast(castName) || isHealingPotionCast(castName);
	}
	
	function isHealthstoneCast(castName){
		return castName == "Healthstone";
	}
	
	function isHealingPotionCast(castName){
		return castName == "Spiritual Healing Potion" || castName == "Cosmic Healing Potion";
	}
	
	function castFilter(cast)
	{
		return isHealingCast(cast.ability.name);
	}

	function getAbilitiesForFriendly(friendly){
		var tokens = friendly.icon.split("-");
		var className = tokens[0];
		var specName;

		if(tokens.length > 1){
			specName = tokens[1];
		}

		var abilities = [];
		var abilityList = ability_list[className];

		for(var specList in abilityList){
			if(specList == "Common" || !specName || specList == specName){
				for(var ability of abilityList[specList]){
					abilities.push({
						name: ability,
						displayName: ability + (specList == "Common" ? "" : " (" + specList + ")")
					});
				}
			}
		}

		return abilities.sort((a, b) => {
			if(a.name < b.name) { return -1; }
				if(a.name > b.name) { return 1; }
				return 0;
		});
	}

	var groupBy = function(xs, key) {
		return xs.reduce(function(rv, x) {
			(rv[x[key]] = rv[x[key]] || []).push(x);
			return rv;
		}, {});
	};

	var percentageReducer = (acc, cur) => {
		return acc + Math.max(Math.min(cur.endTime, fight.end_time) - Math.max(cur.startTime, fight.start_time), 0);
	}

	// represents a defensive ability for a player for a boss
	function abilityModel(ability){
		var self = this;

		self.ability = ability;

		self.uses = ko.observable(0);

		self.matches = function(cast){
			return cast.ability.name == self.ability.name;
		}

		self.tryAddUse = function(cast){
			if(self.matches(cast)){
				self.uses(self.uses() + 1);
				return true;
			}
			
			return false;
		}
	}

	function playerFightModel(boss, friendly){
		var self = this;

		self.boss = boss;
		self.friendly = friendly;
		self.fights = boss.fights;
		self.personalFights = ko.observableArray([]);
		self.presentAttempts = ko.pureComputed(function(){
			return self.personalFights().filter(f => {return !f.wasMissing()});
		})

		self.abilityModels = getAbilitiesForFriendly(self.friendly).map(a => {
			return new abilityModel(a);
		});

		self.combatPotPercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.hasCombatPot() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.prePotPercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.hasPrePot() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.battleRunePercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.hasBattleRune() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.castedHealthStonePercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.castedHealthStone() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.castedHealingPotionPercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.castedHealingPotion() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.missedEncounter = ko.pureComputed(function(){
			return self.presentAttempts() == 0;
		});

		self.defensiveUses = ko.pureComputed(function(){
			return self.abilityModels.reduce((acc, cur) => {return acc + cur.uses()}, 0);
		});

		self.computePercents = function(auras, casts){
			
			// todo use the auras and the fight data to compute the aura percents
			for(var f = 0; f < self.fights().length; f++){
				var fight = self.fights()[f];
				var personalFight = {
					hasCombatPot: ko.observable(false),
					hasPrePot: ko.observable(false),
					wasMissing: ko.observable(!self.friendly.fights.find(i => {return i.id == fight.id})),
					hasBattleRune: ko.observable(false),
					castedHealthStone: ko.observable(false),
					castedHealingPotion: ko.observable(false)
				}
				self.personalFights.push(personalFight);

				for(var a = 0; a < auras.length; a++){
					var aura = auras[a];
					
					for(var p = 0; p < aura.bands.length; p++){
						var potion = aura.bands[p];

						if(isBattleRune(aura.name)){
							// offsetting this first start, cause it seems sometimes the band doesn't start until just slightly after the boss. giving a second of leeway there
							if((fight.start_time + 1000) >= potion.startTime && fight.start_time <= potion.endTime){
								// aura covers the start of the fight, so increment the appropriate counter
								personalFight.hasBattleRune(true);
							}
						}
						else if(isPotion(aura.name)){
							if(potion.endTime >= fight.start_time && potion.startTime <= fight.start_time + 30000){
								// it's a potion and was active in the first 30 seconds of the fight, consider it a pre pot
								personalFight.hasPrePot(true);
							}
							else if(potion.endTime >= fight.start_time && potion.startTime <= fight.end_time){
								// it's a potion, it's not a prepot, but still overlaps the fight, so this is a combat potion
								personalFight.hasCombatPot(true);
							}
						}
					}					
				}
				
				for(var a = 0; a < casts.length; a++)
				{
					var cast = casts[a];
					var castedAbility = cast.ability.name; 
					
					if(isHealthstoneCast(castedAbility) && cast.timestamp >= fight.start_time && cast.timestamp <= fight.end_time){
						personalFight.castedHealthStone(true);
					}
					else if(isHealingPotionCast(castedAbility) && cast.timestamp >= fight.start_time && cast.timestamp <= fight.end_time){
						personalFight.castedHealingPotion(true);
					}
				}
			};
		}		

		self.computeDefensives = function(casts) {
			// filter down to just the casts matching this boss's time range
			var bossCasts = casts.filter(c => {
				return c.timestamp >= self.boss.start_time && c.timestamp <= self.boss.end_time;
			});

			// add each cast to the first matching ability model
			for(var cast of bossCasts){
				for(var model of self.abilityModels){
					if(model.tryAddUse(cast)) break;
				}
			}
		}
	}

	function bossModel(groupedFights){
		var self = this;

		self.boss = groupedFights[0].boss;
		self.name = groupedFights[0].name;
		self.fights = ko.observableArray(groupedFights.sort((a,b) => {
			return a.start_time - b.start_time;
		}));
		self.start_time = self.fights()[0].start_time;
		self.end_time = self.fights()[self.fights().length - 1].end_time;
		self.bossIconUrl = 'https://assets.rpglogs.com/img/warcraft/bosses/' + self.boss +'-icon.jpg';
		self.killClass = groupedFights.reduce((acc, cur) => {return acc || cur.kill}, false) ? 'kill' : 'wipe';

		self.canExpand = self.fights().length > 1;
		self.expanded = ko.observable(false);
		self.toggleExpand = function(){
			if(self.canExpand){
				self.expanded(!self.expanded());
			}
		}

		self.bossPercentage = ko.pureComputed(function(){
			return self.fights()[self.fights().length-1].bossPercentage;
		})
	}

	function reportModel(reportKey){
		var self = this;

		self.players = ko.observableArray();
		self.bosses = ko.observableArray();

		self.sortedPlayers = ko.pureComputed(function(){
			return self.players().sort((a, b) => {
				if(a.name < b.name) { return -1; }
			    if(a.name > b.name) { return 1; }
			    return 0;
			});
		});

		function apiCall(endpoint){
			const params = {
			};

			return fetch(endpoint, params)
			.then(data => {return data.json()});
		}

		function initialize(key){
			const warcraftLogsReportUrl = 'https://www.warcraftlogs.com:443/v1/report';
			var keyData = key + '?api_key=e5f56156fe3ade200af49d7aef8af180';
			const fightsUrl = warcraftLogsReportUrl + '/fights/' + keyData;
			const eventsUrl = warcraftLogsReportUrl + '/tables/buffs/' + keyData;
			const castsUrl = warcraftLogsReportUrl + '/events/casts/' + keyData;

			var fightData = apiCall(fightsUrl).then(data=>{
				var bossFights = data.fights.filter(f => {
					return f.boss != 0;
				});
				var groupedBossFights = groupBy(bossFights, 'boss');
				self.bosses(Object.keys(groupedBossFights).map(b => {
					return new bossModel(groupedBossFights[b]);
				}).sort((a,b) => {
					return a.fights()[0].start_time - b.fights()[0].start_time;
				}));
				
				// find the earliest start and latest end of the fights. this is used for the auras call
				var start,end;
				bossFights.forEach(f =>{
					if(!start || f.start_time < start){
						start = f.start_time;
					}
					if(!end || f.end_time > end){
						end = f.end_time;
					}
				})
				
				data.friendlies.filter(f => {
					return f.type != "NPC" && f.type != "Pet";
				}).forEach(f => {
					// set up an array for each player that corresponds to the boss list
					f.fightModels = self.bosses().map(b => {
						return new playerFightModel(b, f); 
					});

					// gather list of abilities, used for filtering casts and showing in the player name column
					f.abilityModels = getAbilitiesForFriendly(f).map(a => {
						return new abilityModel(a);
					});

					f.expandAbilities = ko.observable(true);

					// gather the buffs for each player
					var buffs = apiCall(eventsUrl + '&start=' + start + '&end=' + end + '&targetid=' + f.id).then(buffData => {
						return buffData.auras.filter(auraFilter);
					})
					
					// gather the casts for each player
					var allCasts = apiCall(castsUrl + '&options=0&start=' + start + '&end=' + end + '&sourceid=' + f.id);
					var buffsCasts = allCasts.then(castData => {
						return castData.events.filter(castFilter);
					});
					var defensivesCasts = allCasts.then(castData => {
						return castData.events.filter(c => {
							return f.abilityModels.some(a => a.matches(c));
						});
					});

					Promise.all([buffs,buffsCasts,defensivesCasts])
					.then(values => {
						f.fightModels.forEach(pFight => {
							pFight.computePercents(values[0], values[1]);							
							pFight.computeDefensives(values[2]);		
						});
					}).finally(()=>{
						self.players.push(f);
					});
					
										
				});
			});			
		}

		initialize(reportKey);
	}
	
	function viewModel(){
		var self = this;

		self.mode = ko.observable('buffs');

		self._key = ko.observable();
		self.reportKey = ko.computed({
			read: function(){
				return self._key();
			},
			write: function(nv){
				if(nv.length == 16){
					// probably just a key, go ahead and set it
					self._key(nv);
				}
				else if(nv.indexOf("warcraftlogs") >= 0){
					// probably a warcraft logs link, so try to get the report id
					var m = nv.match(/reports\/(\w*)/);
					if(m){
						self._key(m[1]);
					}
				}
			}
		});

		self.report = ko.observable();
		self.showPrePot = ko.observable(true);
		self.showCombatPot = ko.observable(true);
		self.showBattleRune = ko.observable(true);
		self.showCastedHealthStone = ko.observable(true);
		self.showCastedHealingPotion = ko.observable(true);

		function parseHash(){
			var settings = {};

			if(window.location.hash){				
				var hashString = window.location.hash.substring(1);
				var props = hashString.split("&");

				for(var prop of props){
					var tokens = prop.split("=");
					settings[tokens[0]] = tokens[1];
				}				
			}	

			return settings;		
		}

		function saveHash(){
			var settings = {};

			if(self.reportKey()){
				settings.k = self.reportKey();
			}

			if(self.mode()){
				settings.m = self.mode();
			}

			var hashString = "";

			for(var prop in settings){
				if(hashString) hashString += "&";
				hashString += prop;
				hashString += "=";
				hashString += settings[prop];
			}

			window.location.hash = hashString;
		}

		function loadReport(key){
			saveHash();
			self.report(new reportModel(key));
		}

		self.initialize = function(){
			var settings = parseHash();
			if(settings.k){
				self.reportKey(settings.k);
			}

			if(settings.m){
				self.mode(settings.m);
			}
		}

		self.reportKey.subscribe(function(nv){
			loadReport(nv);
		});

		self.mode.subscribe(function(nv){
			saveHash();
		});
	}
	
	var vm = new viewModel();
	vm.initialize();
	ko.applyBindings(vm);
})();