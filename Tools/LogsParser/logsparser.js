(function() {
	function isFlask(auraName){
		return auraName == "Flask of the Currents" || auraName == "Flask of Endless Fathoms" || auraName == "Flask of the Vast Horizon" || auraName == "Flask of the Undertow";
	}

	function isFood(auraName){
		return auraName == "Well Fed";
	}

	function isPotion(auraName){
		return auraName == "Battle Potion of Intellect" || auraName == "Battle Potion of Agility" || auraName == "Battle Potion of Strength" || 
			auraName == "Battle Potion of Stamina" || auraName == "Potion of Bursting Blood" || auraName == "Steelskin Potion" || 
			auraName == "Potion of Rising Death" || auraName == "Potion of Replenishment" || auraName == "Sapphire of Brilliance";
	}

	function auraFilter(aura){
		return isFlask(aura.name) || isFood(aura.name) || isPotion(aura.name);
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

	function playerFightModel(boss, fights){
		var self = this;

		self.boss = boss;
		self.fights = fights;

		self.flaskPercent = ko.observable();
		self.foodPercent = ko.observable();
		self.combatPotPercent = ko.observable();
		self.prePotPercent = ko.observable();

		self.computePercents = function(auras){
			// todo use the auras and the fight data to compute the aura percents
			var fightCount=0,flaskCount=0,foodCount=0,combatPotCount=0,prePotCount=0;
			for(var f = 0; f < self.fights.length; f++){
				var fight = self.fights[f];
				fightCount++;

				for(var a = 0; a < auras.length; a++){
					var aura = auras[a];
					
					for(var p = 0; p < aura.bands.length; p++){
						var potion = aura.bands[p];

						// offsetting this first start, cause it seems sometimes the band doesn't start until just slightly after the boss. giving a second of leeway there
						if((fight.start_time + 1000) >= potion.startTime && fight.start_time <= potion.endTime){
							// aura covers the start of the fight, so increment the appropriate counter
							if(isFlask(aura.name)){
								flaskCount++;
							}
							else if(isFood(aura.name)){
								foodCount++;
							}
							else{
								prePotCount++;
							}
						}
						else if(isPotion(aura.name) && potion.endTime >= fight.start_time && potion.startTime <= fight.end_time){
							// it's a potion, it's not a prepot, but still overlaps the fight, so this is a combat potion
							combatPotCount++;
						}
					}					
				}
			};

			self.flaskPercent(flaskCount / fightCount * 100);
			self.foodPercent(foodCount / fightCount * 100);
			self.combatPotPercent(combatPotCount / fightCount * 100);
			self.prePotPercent(prePotCount / fightCount * 100);
		}
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
			const fightsUrl = 'https://www.warcraftlogs.com:443/v1/report/fights/' + key + '?api_key=e5f56156fe3ade200af49d7aef8af180';
			const eventsUrl = 'https://www.warcraftlogs.com:443/v1/report/tables/buffs/' + key + '?api_key=e5f56156fe3ade200af49d7aef8af180';

			var fightData = apiCall(fightsUrl).then(data=>{
				var bossFights = data.fights.filter(f => {
					return f.boss != 0;
				});
				var groupedBossFights = groupBy(bossFights, 'boss');
				self.bosses(Object.keys(groupedBossFights).map(b => {
					return {
						boss: b,
						name: groupedBossFights[b][0].name,
						fights: groupedBossFights[b],
						bossIconUrl: 'https://dmszsuqyoe6y6.cloudfront.net/img/warcraft/bosses/' + b +'-icon.jpg',
						killClass: groupedBossFights[b].reduce((acc, cur) => {return acc || cur.kill}, false) ? 'kill' : 'wipe'
					}
				}).sort((a,b) => {
					return a.fights[0].start_time - b.fights[0].start_time;
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
					f.fights = self.bosses().map(b => {
						return new playerFightModel(b.boss, b.fights); 
					});

					// gather the buffs for each player
					var buffs = apiCall(eventsUrl + '&start=' + start + '&end=' + end + '&targetid=' + f.id).then(buffData => {
						return buffData.auras.filter(auraFilter);
					}).then(auras => {
						f.fights.forEach(pFight => {
							pFight.computePercents(auras);
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