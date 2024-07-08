class Stage{
    name;
    image;

    constructor(name, image){
        this.name = name;
        this.image = image;
    }
}

export default {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    data(){
        return {
            stages: [
                new Stage("Battlefield", "/Tools/SmashStatTracker/images/640px-SSBU-Battlefield.png"),
                new Stage("Small Battlefield", "/Tools/SmashStatTracker/images/640px-SSBU-Small-Battlefield.jpg"),
                new Stage("Final Destination", "/Tools/SmashStatTracker/images/640px-SSBU-Final_Destination.jpg"),
                new Stage("Pokemon Stadium 2", "/Tools/SmashStatTracker/images/640px-SSBU-Pokémon_Stadium_2.png"),
                new Stage("Smashville", "/Tools/SmashStatTracker/images/640px-SSBU-Smashville.png"),
                new Stage("Town and City", "/Tools/SmashStatTracker/images/640px-SSBU-Town_and_City.webp"),
                new Stage("Kalos League", "/Tools/SmashStatTracker/images/640px-SSBU-Kalos_Pokémon_League.png"),
                new Stage("Hollow Bastion", "/Tools/SmashStatTracker/images/640px-SSBU-Hollow_Bastion.jpg"),
                new Stage("Yoshi's Story", "/Tools/SmashStatTracker/images/640px-SSBU-Yoshi's_Story.png")
            ]
        }
    },
    computed: {
        selectedStage: {
            get(){
                return this.modelValue;
            },
            set(newValue){
                this.$emit('update:modelValue', newValue);
            }
        }
    },
    template: /*html*/`
    <div class="stage-selector">
        <label v-for="stage in stages">
            <input type="radio" v-model="selectedStage" :value="stage.name"/>
            <img :src="stage.image"/>
        </label>
    </div>
    `
}