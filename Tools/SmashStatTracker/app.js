// using the module version of vue, so this has to be hosted on a server. use npx serve for a simple one
import { createApp } from 'vue'
import Tracker from './components/tracker/tracker.js'

createApp({
  components:{
    Tracker
  },
  template: /*html*/ `
    <Tracker />
  `
}).mount('#app')