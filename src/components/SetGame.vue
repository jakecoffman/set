<template>
  <div class="hello">
    <div v-if="connected===0" class="alert">Connecting</div>
    <div v-if="connected===2" class="alert">Disconnected, reload to rejoin</div>
    <transition-group name="bounce" id="cards">
      <div v-for="(card, index) of cards" :key="index">
        <set-card class="animate-in"
          :shape="card.s"
          :color="card.c"
          :pattern="card.p"
          :amount="card.a"
          :selected="selected"
          :index="index"
          @click.native="selectHandler(index)"/>
      </div>
    </transition-group>
    <hr/>
    <div id="info">
      <button @click="nosets()" class="button-primary">no sets (deal more)</button>
      <div id="players">
        <table>
          <thead>
          <tr>
            <th>Player</th>
            <th>Score</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="player of players">
            <td>{{player.Id}}
              <span class="aside" v-if="player.Connected === false">(offline)</span>
              <span class="aside" v-if="you === player.Id">(you)</span>
            </td>
            <td>{{player.Score}}</td>
          </tr>
          </tbody>
        </table>
      </div>
      <p>Game ID: {{gameId}}</p>
      <button @click="join('')">start a new game</button>
      <label for="join">Join a game</label>
      <div>
        <input type="number" v-model="input" placeholder="Game ID" id="join">
        <button @click="join(input)">join</button>
      </div>
    </div>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="striped-red" class="pattern" x="10" y="10" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="10" height="200" style="stroke: none; fill: #E74C3C"></rect>
        </pattern>

        <pattern id="striped-purple" class="pattern" x="10" y="10" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="10" height="200" style="stroke: none;" fill="#9B59B6"></rect>
        </pattern>

        <pattern id="striped-green" class="pattern" x="10" y="10" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="10" height="200" style="stroke: none; fill: #2ECC71"></rect>
        </pattern>
      </defs>
    </svg>
  </div>
</template>

<script>
  import SetCard from '@/components/SetCard'

  export default {
    name: 'SetGame',
    components: {
      SetCard
    },
    data() {
      return {
        ws: null,
        connected: 0,

        cards: [],
        gameId: '',
        players: [],
        version: -1,
        you: 0,
        selected: [], // selected cards (local only),

        input: ''
      }
    },
    mounted() {
      let url;
      if (location.protocol === 'https:') {
        url = 'wss://';
      } else {
        url = 'ws://';
      }
      url += location.host + location.pathname + (location.pathname.endsWith('/') ? 'ws' : '/ws');
      this.ws = new WebSocket(url);
      console.log(new Date().getTime(), 'connecting to ' + url);

      this.ws.onopen = this.onopen.bind(this);
      this.ws.onerror = this.onerror.bind(this);
      this.ws.onclose = this.onclose.bind(this);
      this.ws.onmessage = this.onmessage.bind(this);
    },
    methods: {
      onopen(e) {
        this.connected = 1;
        console.log(new Date().getTime(), 'connected');
        if (this.$route.params.id) {
          this.join(this.$route.params.id);
        } else {
          this.join('');
        }
      },
      onerror(e) {
        console.error(e);
      },
      onclose(e) {
        this.connected = 2;
      },
      onmessage(e) {
        let data = JSON.parse(e.data);
        switch (data.Type) {
          case "cookie":
            document.cookie = data.Cookie;
            console.log("Set cookie", data.Cookie);
            break;
          case 'meta':
            this.gameId = data.GameId;
            this.$router.push({path: this.gameId});
            this.version = data.Version;
            this.players = data.Players;
            this.you = data.You;
            break;
          case 'all':
            this.cards = [];
          // fallthrough
          case 'update':
            this.selected = [];
            for (let update of data.Updates) {
              if (this.cards.length <= update.Location) {
                this.cards.push({})
              }
              this.cards.splice(update.Location, 1, update.Card);
            }
            this.version = data.Version;
            this.players = data.Players;
            break;
          default:
            console.log("unknown type", data);
        }
      },
      join(id) {
        this.ws.send(JSON.stringify({Type: "join", Data: id}));
      },
      selectHandler(location) {
        const index = this.selected.indexOf(location);
        if (index >= 0) {
          this.selected.splice(index, 1);
        } else {
          this.selected.push(location);
        }
        if (this.selected.length >= 3) {
          this.ws.send(JSON.stringify({Type: "play", Data: this.selected, Version: this.version}));
          this.selected = [];
        }
      },
      nosets() {
        this.ws.send(JSON.stringify({Type: 'nosets', Version: this.version}))
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #striped-red rect {
    fill: #e74c3c;
  }

  #striped-green rect {
    fill: #2ecc71;
  }

  #striped-purple rect {
    fill: #9b59b6;
  }

  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  html {
    height: 100%;
  }

  body {
    height: 100%;
    margin: auto;
    font-family: Verdana, sans-serif;
  }

  main {
    height: 100%;
  }

  footer {
    background: #4aa3df;
  }

  #cards {
    display: flex;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    margin: auto;
  }

  @media (max-width: 600px) {
    #cards {
      width: 300px;
    }
  }

  @media (min-width: 600px) {
    #cards {
      width: 500px;
    }
  }

  #info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .alert {
    display: block;
    position: fixed;
    bottom: 10px;
    left: 10px;
    right: 10px;
    background: #303030;
    color: white;
    padding: 10px 40px 10px 20px;
    z-index: 1000;
  }

  .bounce-enter-active {
    animation: bounceIn 0.75s;
  }

  @keyframes bounceIn {
    0%, 15%, 30%, 45%, 80%, 100% {
      -webkit-transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    0% {
      -webkit-transform: scale3d(0.2, 0.2, 0.2);
      transform: scale3d(0.2, 0.2, 0.2);
    }
    15% {
      -webkit-transform: scale3d(1.37, 1.37, 1.37);
      transform: scale3d(1.37, 1.37, 1.37);
    }
    30% {
      -webkit-transform: scale3d(0.85, 0.85, 0.85);
      transform: scale3d(0.85, 0.85, 0.85);
    }
    45% {
      -webkit-transform: scale3d(1.04, 1.04, 1.04);
      transform: scale3d(1.04, 1.04, 1.04);
    }
    80% {
      -webkit-transform: scale3d(0.97, 0.97, 0.97);
      transform: scale3d(0.97, 0.97, 0.97);
    }
    100% {
      -webkit-transform: scale3d(1, 1, 1);
      transform: scale3d(1, 1, 1);
    }
  }

  .animate-in {
    -webkit-animation: bounceIn 1s both linear;
    animation: bounceIn 1s both linear;
  }

  .aside {
    font-style: italic;
  }
</style>
