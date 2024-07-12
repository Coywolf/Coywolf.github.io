const roster = [
    "Mario",
  "Donkey Kong",
  "Link",
  "Samus",
  "Dark Samus",
  "Yoshi",
  "Kirby",
  "Fox",
  "Pikachu",
  "Luigi",
  "Ness",
  "Captain Falcon",
  "Jigglypuff",
  "Peach",
  "Daisy",
  "Bowser",
  "Ice Climbers",
  "Sheik",
  "Zelda",
  "Dr. Mario",
  "Pichu",
  "Falco",
  "Marth",
  "Lucina",
  "Young Link",
  "Ganondorf",
  "Mewtwo",
  "Roy",
  "Chrom",
  "Mr. Game & Watch",
  "Meta Knight",
  "Pit",
  "Dark Pit",
  "Zero Suit Samus",
  "Wario",
  "Snake",
  "Ike",
  "Pokemon Trainer",
  "Diddy Kong",
  "Lucas",
  "Sonic",
  "King Dedede",
  "Olimar",
  "Lucario",
  "R.O.B.",
  "Toon Link",
  "Wolf",
  "Villager",
  "Mega Man",
  "Wii Fit Trainer",
  "Rosalin & Luma",
  "Little Mac",
  "Greninja",
  "Palutena",
  "Pac-man",
  "Robin",
  "Shulk",
  "Bowser Jr.",
  "Duck Hunt",
  "Ryu",
  "Ken",
  "Cloud",
  "Corrin",
  "Bayonetta",
  "Inkling",
  "Ridley",
  "Simon",
  "Richter",
  "King K. Rool",
  "Isabelle",
  "Incineroar",
  "Piranha Plant",
  "Joker",
  "Hero",
  "Banjo & Kazooie",
  "Terry",
  "Byleth",
  "Min Min",
  "",
  "",
  "Steve",
  "Sephiroth",
  "Pyra/Mythra",
  "Kazuya",
  "Sora",
  "Mii Brawler",
  "Mii Swordfighter",
  "Mii Gunner",
  "",
  "",
  ""
  ];

export default {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    data(){
        return {
            active: false,
            searchString: ""
        }
    },
    computed: {
        character: {
            get() {
                return this.modelValue;
            },
            set(newValue) {
                this.$emit("update:modelValue", newValue);
            }
        },
        filteredCharacters(){
            return roster.filter(c => c.toLowerCase().includes(this.searchString));
        }
    },
    methods:{
        focus(){
            this.$refs.input.focus();
        },
        onFocus(){
            this.$refs.input.select();
            this.searchString = "";
            this.active = true;
        },
        onBlur(){
            this.$refs.input.value = this.character;
            this.active = false;
        },
        onInput(event){
            this.searchString = event.target.value.toLowerCase();

            if(this.filteredCharacters.length == 1){
                this.selectCharacter(this.filteredCharacters[0], true);
            }
        },
        onTab(event){
            event.preventDefault();
            event.stopPropagation();

            if(this.filteredCharacters.length >= 1) {
                var currentIndex = this.filteredCharacters.findIndex(c => c == this.character);
                this.selectCharacter(this.filteredCharacters[(currentIndex + 1) % this.filteredCharacters.length]);
            }
        },
        selectCharacter(character, isFullSelection){
            this.$refs.input.value = character;
            this.character = character;

            // either a specific character was clicked, or there was a complete match
            if(isFullSelection){
                this.active = false;
            }
        }
    },
    template: /*html*/`
        <input class="text-input" ref="input" :value="character" @focus="onFocus" @blur="onBlur" @input="onInput" @keydown.tab="onTab" />
        <div class="roster" v-if="active">
            <img src="/Tools/SmashStatTracker/images/smash_roster.png" />
        </div>
    `
}