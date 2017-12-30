<template>
  <div class="hello">
    <div v-if="connected===0">Connecting</div>
    <div v-if="connected===2">Disconnected, reload to rejoin</div>
    <div id="cards">
      <div v-for="(card, index) of cards">
        <div v-if="card.s === 'n'" class="card animate-in" :class="card.classes" @click="selectHandler(index)">
          <div class="shape" v-for="a of card.a">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 106.058">
              <path
                d="M81.442,14.792c13.791,1.487,17.955,2.853,29.088,6.921c17.255,6.307,32.98,3.611,48.464-4.519c4.869-2.557,9.379-5.785,14.096-8.64c11.231-6.794,21.987-3.746,27.416,8.255c7.255,16.35,5.223,31.92-2.491,47.142c-13.492,26.623-38.203,34.367-64.534,29.43c-14.679-2.97-28.883-8.259-43.537-11.403c-17.457-3.745-33.689,.502-48.567,10.238c-3.548,2.321-7.216,4.498-10.981,6.443c-11.57,5.98-20.215,2.23-23.625-10.337C1.708,69.282,7.989,53.525,19.427,39.053C33.758,20.92,52.818,12.638,81.442,14.792z"></path>
            </svg>
          </div>
        </div>
        <div v-if="card.s === 'd'" class="card animate-in" :class="card.classes" @click="selectHandler(index)">
          <div class="shape" v-for="a of card.a">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 223.621 104.493">
              <polygon points="211.811,52.247 111.811,98.974 11.811,52.247 111.811,5.519"></polygon>
            </svg>
          </div>
        </div>
        <div v-if="card.s === 'p'" class="card animate-in" :class="card.classes" @click="selectHandler(index)">
          <div class="shape" v-for="a of card.a">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 101.429">
              <path
                d="M159.286,96.429c25.247,0,45.714-20.467,45.714-45.714S184.533,5,159.286,5H50.714C25.467,5,5,25.467,5,50.714s20.467,45.714,45.714,45.714H159.286z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div id="info">
      <p>
        <button id="nosets" class="pure-button pure-button-primary">no sets (deal more)</button>
      </p>
      <div id="players">
        <ul>
          <li v-for="player of players">
            Player {{player.Id}} - {{player.Score}} <span v-if="player.Connected === false">📴</span>
          </li>
        </ul>
      </div>
      <p>Game ID: {{gameId}}</p>
      <br/>
      <p>
        <button class="pure-button">start a new game</button>
      </p>
      <input type="number" v-model="input" placeholder="Game ID">
      <button class="pure-button" @click="join(input)">join</button>
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
  export default {
    name: 'HelloWorld',
    data() {
      return {
        ws: null,
        connected: 0,

        cards: [],
        gameId: '',
        players: [],
        version: -1,
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
        if (location.hash && location.hash.length > 1) {
          this.join(location.hash.split('#')[1]);
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
            this.version = data.Version;
            this.players = data.Players;
            break;
          case 'all':
            this.cards = [];
          // fallthrough
          case 'update':
            this.selected = [];
            for (let update of data.Updates) {
              if (this.cards.length >= update.Location) {
                this.cards.push({})
              }
              update.Card.classes = this.pattern(update.Card.p) + ' ' + this.color(update.Card.c);
              this.cards[update.Location] = update.Card
            }
            this.data = data;
            break;
          default:
            console.log("unknown type", data);
        }
      },
      join(id) {
        this.ws.send(JSON.stringify({Type: "join", Data: id}));
      },
      pattern(p) {
        if (p === "h") {
          return "hollow";
        }
        if (p === "s") {
          return "solid";
        }
        if (p === "z") {
          return "striped";
        }
      },
      color(c) {
        if (c === "r") {
          return "red"
        }
        if (c === "p") {
          return "purple"
        }
        if (c === "g") {
          return "green"
        }
      },
      selectHandler(location) {
        const index = this.selected.indexOf(location);
        if (index >= 0) {
          this.selected.splice(index, 1);
          let card = this.cards[location];
          card.classes = this.pattern(card.p) + ' ' + this.color(card.c);
          this.cards.splice(location, 1, card);
        } else {
          this.selected.push(location);
          let card = this.cards[location];
          card.classes += ' selected';
          this.cards.splice(location, 1, card);
        }
        if (this.selected.length === 3) {
          this.ws.send(JSON.stringify({Type: "play", Data: this.selected, Version: this.version}));
          for (let s of this.selected) {
            let card = this.cards[s];
            card.classes = this.pattern(card.p) + ' ' + this.color(card.c);
            this.cards.splice(s, 1, card);
          }
          this.selected = [];
        }
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .bounceIn {
    -webkit-animation-name: bounceIn;
    animation-name: bounceIn;
    -webkit-animation-duration: 0.75s;
    animation-duration: 0.75s;
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

  @keyframes select-pop {
    0% {
      -webkit-transform: scale(1);
      transform: scale(1);
    }
    50% {
      -webkit-transform: scale(0.95);
      transform: scale(0.95);
    }
    100% {
      -webkit-transform: scale(1.05);
      transform: scale(1.05);
    }
  }

  .card {
    --width: 70px;
    width: var(--width);
    height: calc(var(--width) * 1.5);
    background: #fff;
    border-radius: 6px;
    -webkit-box-shadow: 0px 1px 6px 0px rgba(0, 0, 0, 0.3);
    box-shadow: 0px 1px 6px 0px rgba(0, 0, 0, 0.3);
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-flex-direction: column;
    -ms-flex-direction: column;
    flex-direction: column;
    -webkit-justify-content: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-align-items: center;
    -ms-flex-align: center;
    align-items: center;
    cursor: pointer;
    -webkit-transition: -webkit-transform 0.2s ease-in-out;
    transition: transform 0.2s ease-in-out;
    margin: 10px;
  }

  .card.animate-in {
    -webkit-animation: bounceIn 1s both linear;
    animation: bounceIn 1s both linear;
  }

  .card:nth-child(4n + 1) {
    clear: both;
  }

  .card.selected {
    -webkit-box-shadow: 0px 0px 3px 2px #3498db;
    box-shadow: 0px 0px 3px 2px #3498db;
    -webkit-transform: scale(1.05);
    -ms-transform: scale(1.05);
    transform: scale(1.05);
    animation: 0.2s select-pop;
  }

  .card .shape {
    position: relative;
    -webkit-flex: 0 0 auto;
    -ms-flex: 0 0 auto;
    flex: 0 0 auto;
    width: 72%;
    height: 25%;
    margin-top: 3px;
    margin-bottom: 3px;
  }

  .card .shape svg {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .card.red path,
  .card.red polygon {
    stroke: #e74c3c;
    stroke-width: 8px;
  }

  .card.red.solid path,
  .card.red.solid polygon {
    fill: #e74c3c;
  }

  .card.red.striped path,
  .card.red.striped polygon {
    fill: url("#striped-red");
  }

  .card.red.hollow path,
  .card.red.hollow polygon {
    fill: transparent;
  }

  .card.green path,
  .card.green polygon {
    stroke: #2ecc71;
    stroke-width: 8px;
  }

  .card.green.solid path,
  .card.green.solid polygon {
    fill: #2ecc71;
  }

  .card.green.striped path,
  .card.green.striped polygon {
    fill: url("#striped-green");
  }

  .card.green.hollow path,
  .card.green.hollow polygon {
    fill: transparent;
  }

  .card.purple path,
  .card.purple polygon {
    stroke: #9b59b6;
    stroke-width: 8px;
  }

  .card.purple.solid path,
  .card.purple.solid polygon {
    fill: #9b59b6;
  }

  .card.purple.striped path,
  .card.purple.striped polygon {
    fill: url("#striped-purple");
  }

  .card.purple.hollow path,
  .card.purple.hollow polygon {
    fill: transparent;
  }

  #striped-red rect {
    fill: #e74c3c;
  }

  #striped-green rect {
    fill: #2ecc71;
  }

  #striped-purple rect {
    fill: #9b59b6;
  }

  .card.card--mini {
    width: 30px;
    height: 45px;
    position: relative;
    margin: 1px;
    -webkit-box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    cursor: default;
  }

  .card.card--mini .shape {
    margin: 1px 0;
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

    .card {
      width: 70px;
      --width: 70px;
    }
  }

  @media (min-width: 600px) {
    #cards {
      width: 400px;
    }

    .card {
      --width: 100px;
    }
  }

  #info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  #disconnected {
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

  #id {
    display: inline;
  }

  #submit {
    margin: -6px 0 0;
  }

</style>
