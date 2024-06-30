// the time is pulled out into it's own component to prevent the whole tracker from having to rerender each time this updates, once a second
export default {
  props: ['startTime', 'endTime'],
  data(){
    return {
      currentTime: Date.now()
    }
  },
  computed:{
    sessionTime(){
      if(this.startTime && this.endTime){
        return this.formatMs(this.endTime - this.startTime);
      }
      else if(this.startTime){
        return this.formatMs(this.currentTime - this.startTime);
      }
      
      return "";
    }
  },
  watch:{
    startTime(){
      // when a new start time is given, reset the current time. this avoids having it skip a second while it catches up between 1 second updates
      this.currentTime = Date.now();
    }
  },
  created(){
    this.animationFrame();
  },
  unmounted(){
    cancelAnimationFrame(this.animationFrameHandle);
  },
  methods:{
    msToS(ms){
      return ms / 1000;
    },
    formatMs(msDiff){
      var totalSeconds = Math.max(this.msToS(msDiff), 0);
      var minutes = Math.trunc(totalSeconds / 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
      var seconds = Math.trunc(totalSeconds % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});

      return `${minutes}:${seconds}`;
    },
    animationFrame(){
      if(Date.now() - this.currentTime > 1000){
        this.currentTime = Date.now();
      }
      
      this.animationFrameHandle = requestAnimationFrame(this.animationFrame);
    }
  },
  template: `{{sessionTime}}`
}