ko.bindingHandlers.toggleClick = {
    init: function (element, valueAccessor) {
        var value = valueAccessor();

        ko.utils.registerEventHandler(element, "click", function () {
            value(!value());
        });
    }
};

(function() {
	function isFlask(auraName){
		return auraName == "Greater Flask of the Currents" || auraName == "Greater Flask of Endless Fathoms" || auraName == "Greater Flask of the Vast Horizon" || auraName == "Greater Flask of the Undertow";
		;
		//auraName == "Flask of the Currents" || auraName == "Flask of Endless Fathoms" || auraName == "Flask of the Vast Horizon" || auraName == "Flask of the Undertow"
	}

	function isFood(auraName){
		return auraName == "Well Fed";
	}

	function isPotion(auraName){
		return auraName == "Potion of Unbridled Fury" || auraName == "Potion of Wild Mending" || auraName == "Potion of Empowered Proximity" || auraName == "Potion of Focused Resolve"
			|| auraName == "Superior Battle Potion of Intellect" || auraName == "Superior Battle Potion of Agility" || auraName == "Superior Battle Potion of Strength" 
			|| auraName == "Superior Battle Potion of Stamina" || auraName == "Superior Steelskin Potion"
		;
		// old potions in case you want to write a not strict mode
		//auraName == "Battle Potion of Intellect" || auraName == "Battle Potion of Agility" || auraName == "Battle Potion of Strength" || 
		//auraName == "Battle Potion of Stamina" || auraName == "Potion of Bursting Blood" || auraName == "Steelskin Potion" || 
		//auraName == "Potion of Rising Death" || auraName == "Potion of Replenishment" || auraName == "Sapphire of Brilliance"
	}
	
	function isHealingItem(auraName){
		return auraName == ""
	}
	
	function isBattleRune(auraName){
		return auraName == "Battle-Scarred Augmentation";
	}

	function auraFilter(aura){
		return isFlask(aura.name) || isFood(aura.name) || isPotion(aura.name) || isBattleRune(aura.name);
	}
	
	function isHealingCast(castName){
		return castName == "Abyssal Healing Potion" || castName == "Healthstone"; // is healthstone as good as abyssal?
		// old
		//castName == "Coastal Healing Potion" || castName == "Silas' Vial of Continuous Curing"
	}
	
	function castFilter(cast)
	{
		return isHealingCast(cast.ability.name);
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

	function playerFightModel(boss, friendly){
		var self = this;

		self.boss = boss;
		self.friendly = friendly;
		self.fights = boss.fights;
		self.personalFights = ko.observableArray([]);
		self.presentAttempts = ko.pureComputed(function(){
			return self.personalFights().filter(f => {return !f.wasMissing()});
		})

		self.flaskPercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.hasFlask() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.foodPercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.hasFood() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
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
		self.castedHealingPercent = ko.pureComputed(function() {
			return self.personalFights().reduce((acc, cur) => {return cur.castedHealing() ? (acc + 1) : acc}, 0) / self.presentAttempts().length * 100;
		});
		self.missedEncounter = ko.pureComputed(function(){
			return self.presentAttempts() == 0;
		});

		self.computePercents = function(auras, casts){
			// todo use the auras and the fight data to compute the aura percents
			for(var f = 0; f < self.fights().length; f++){
				var fight = self.fights()[f];
				var personalFight = {
					hasFlask: ko.observable(false),
					hasFood: ko.observable(false),
					hasCombatPot: ko.observable(false),
					hasPrePot: ko.observable(false),
					wasMissing: ko.observable(!self.friendly.fights.find(i => {return i.id == fight.id})),
					hasBattleRune: ko.observable(false),
					castedHealing: ko.observable(false)
				}
				self.personalFights.push(personalFight);

				for(var a = 0; a < auras.length; a++){
					var aura = auras[a];
					
					for(var p = 0; p < aura.bands.length; p++){
						var potion = aura.bands[p];

						// offsetting this first start, cause it seems sometimes the band doesn't start until just slightly after the boss. giving a second of leeway there
						if((fight.start_time + 1000) >= potion.startTime && fight.start_time <= potion.endTime){
							// aura covers the start of the fight, so increment the appropriate counter
							if(isFlask(aura.name)){
								personalFight.hasFlask(true);
							}
							else if (isBattleRune(aura.name))
							{
								personalFight.hasBattleRune(true);
							}
							else if(isFood(aura.name)){
								personalFight.hasFood(true);
							}
							else if(isPotion(aura.name)){
								personalFight.hasPrePot(true);
							}
						}
						else if(isPotion(aura.name) && potion.endTime >= fight.start_time && potion.startTime <= fight.end_time){
							// it's a potion, it's not a prepot, but still overlaps the fight, so this is a combat potion
							personalFight.hasCombatPot(true);
						}
					}					
				}
				
				for(var a = 0; a < casts.length; a++)
				{
					var cast = casts[a];
					var castedAbility = cast.ability.name; 
					
					if(isHealingCast(castedAbility) && cast.timestamp >= fight.start_time && cast.timestamp <= fight.end_time){
						personalFight.castedHealing(true);
					}
				}
			};
		}
	}

	function bossModel(groupedFights){
		var self = this;

		self.boss = groupedFights[0].boss;
		self.name = groupedFights[0].name;
		self.fights = ko.observableArray(groupedFights.sort((a,b) => {
			return a.start_time - b.start_time;
		}));
		self.bossIconUrl = 'https://dmszsuqyoe6y6.cloudfront.net/img/warcraft/bosses/' + self.boss +'-icon.jpg';
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
					return f.type != "NPC";
				}).forEach(f => {
					// set up an array for each player that corresponds to the boss list
					f.fightModels = self.bosses().map(b => {
						return new playerFightModel(b, f); 
					});

					// gather the buffs for each player
					var buffs = apiCall(eventsUrl + '&start=' + start + '&end=' + end + '&targetid=' + f.id).then(buffData => {
						return buffData.auras.filter(auraFilter);
					})
					
					// gather the casts for each player
					var casts = apiCall(castsUrl + '&start=' + start + '&end=' + end + '&sourceid=' + f.id).then(castData => {
						return castData.events.filter(castFilter);
					});

					Promise.all([buffs,casts])
					.then(values => {
						f.fightModels.forEach(pFight => {
							pFight.computePercents(values[0], values[1]);
						})
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
		self.showFlask = ko.observable(true);
		self.showFood = ko.observable(true);
		self.showPrePot = ko.observable(true);
		self.showCombatPot = ko.observable(true);
		self.showBattleRune = ko.observable(false);
		self.showCastedHealing = ko.observable(false);

		function loadReport(key){
			window.location.hash = key;
			self.report(new reportModel(key));
		}

		self.initialize = function(){
			if(window.location.hash){
				self.reportKey(window.location.hash.substring(1));
			}
		}

		self.reportKey.subscribe(function(nv){
			loadReport(nv);
		});
	}
	
	var vm = new viewModel();
	vm.initialize();
	ko.applyBindings(vm);
})();