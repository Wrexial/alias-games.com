//Wrex: Note: Most of this is taken from the demo/tutorial website of PixiJS. There's a few things I wanted to add when you win for clarity but I simply had no time this week.

const MANIFEST = {
    sprite1: 'assets/sprites/eggHead.png',
    sprite2: 'assets/sprites/flowerTop.png',
    sprite3: 'assets/sprites/helmlok.png',
    sprite4: 'assets/sprites/skully.png',
    sfxloop: 'assets/sfx/loop3.mp3',
    succesSfx: 'assets/sfx/success.mp3',
};

const SYMBOLS = [
    MANIFEST.sprite1,
    MANIFEST.sprite2,
    MANIFEST.sprite3,
    MANIFEST.sprite4
];

//Wrex: figure out how to reload the canvas dynamically...s
const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

const app = new PIXI.Application({ backgroundColor: 0x1099bb, width: width, height: height });
document.body.appendChild(app.view);

let money = 1000;
let betIndex = 3;
const BET_OPTIONS = [1, 2, 5, 10, 25, 50, 100];

let slotIds = [];
//Wrex: We'll have a sort order for the sprite icons so its easily deterministric using getNextSymbolId
const SLOT_ORDER = [
    [3, 1, 2, 0, 1, 0, 2],
    [0, 2, 1, 3, 1, 0],
    [2, 0, 1, 3],
];

//Wrex: Win multipliers depending on symbol index. Ideally this would match with the rarity of the slots order above?
const WIN_MULTIPLIERS = [5, 10, 25, 100];

const MARGIN_COUNT = 2;
const REEL_COUNT = 3;
const REEL_WIDTH = width / (REEL_COUNT + MARGIN_COUNT);

const SYMBOLS_VISIBLE = 3;
const SYMBOL_SIZE = Math.min(height / (SYMBOLS_VISIBLE + MARGIN_COUNT), REEL_WIDTH);

PIXI.Assets.addBundle('demo', MANIFEST);
PIXI.Assets.loadBundle('demo').then((resources) => {
    for (let i = 0; i < REEL_COUNT; i++) {
        slotIds[i] = 0;
    }

    let slotTextures = [];
    for (let i = 0; i < SYMBOLS.length; i++) {
        slotTextures.push(PIXI.Texture.from(SYMBOLS[i]));
    }

    let sound = PIXI.sound.Sound.from(MANIFEST.sfxloop);
    sound.play({
        loop: true,
        singleInstance: true,
        volume: 0.01, //For everyone's sanity
    });

    const reels = [];
    const reelsData = [];
    const reelsVisibilityIndex = [];
    const reelContainer = new PIXI.Container();
    for (let i = 0; i < REEL_COUNT; i++) {
        const rc = new PIXI.Container();
        rc.x = (i + 1) * REEL_WIDTH;
        reelContainer.addChild(rc);

        const reel = {
            container: rc,
            symbols: [],
            position: 0,
            previousPosition: 0,
            blur: new PIXI.filters.BlurFilter(),
        };
        reel.blur.blurX = 0;
        reel.blur.blurY = 0;
        rc.filters = [reel.blur];

        const reelData = [];
        //Wrex: +1 being a buffer to show the future one while overscrolling
        for (let j = 0; j < SYMBOLS_VISIBLE + 1; j++) {
            const symbolId = getNextSymbolId(i);
            const symbol = new PIXI.Sprite(slotTextures[symbolId]);
            // Scale the symbol to fit symbol area.
            symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
            symbol.x = (REEL_WIDTH * 0.5) - (symbol.width * 0.5);
            symbol.y = j * SYMBOL_SIZE;
            reel.symbols.push(symbol);
            rc.addChild(symbol);

            reelData.push(symbolId);
            reelsVisibilityIndex[i] = j;
        }
        reels.push(reel);
        reelsData.push(reelData);
    }

    function getNextSymbolId(reelId) {
        const nextSymbolId = slotIds[reelId];
        const symbolId = SLOT_ORDER[reelId][nextSymbolId];
        slotIds[reelId]++;
        slotIds[reelId] %= SLOT_ORDER[reelId].length;
        return symbolId;
    }

    // Build top & bottom covers and position reelContainer
    const margin = (app.screen.height - SYMBOL_SIZE * 3) * 0.5;
    reelContainer.x = Math.round(app.screen.width - REEL_WIDTH * (REEL_COUNT + MARGIN_COUNT));
    reelContainer.y = margin;

    const top = new PIXI.Graphics();
    top.beginFill(0, 1);
    top.drawRect(0, 0, app.screen.width, margin);

    const bottom = new PIXI.Graphics();
    bottom.beginFill(0, 1);
    bottom.drawRect(0, SYMBOL_SIZE * 3 + margin, app.screen.width, margin);

    const left = new PIXI.Graphics();
    left.beginFill(0, 1);
    left.drawRect(0, 0, REEL_WIDTH, app.screen.height);

    const right = new PIXI.Graphics();
    right.beginFill(0, 1);
    right.drawRect(app.screen.width - REEL_WIDTH, 0, REEL_WIDTH, app.screen.height);

    // Add play text
    const titleStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 32,
        fontStyle: 'italic',
        fontWeight: 'bold',
        fill: ['#ffff00', '#00ff99'], // gradient
        stroke: '#18501e',
        strokeThickness: 5,
        dropShadow: true,
        dropShadowColor: '#06360b',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
        wordWrap: true,
        wordWrapWidth: REEL_WIDTH * 3,
    });

    const infoStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fontStyle: 'italic',
        fontWeight: 'bold',
        fill: '#ffff00',
        stroke: '#18501e',
        strokeThickness: 5,
    });

    const headerText = new PIXI.Text('WREX\'S SUPER SIMPLE SLOT', titleStyle);
    headerText.x = Math.round((top.width - headerText.width) * 0.5);
    headerText.y = Math.round((margin - headerText.height) * 0.5);
    top.addChild(headerText);

    const playText = new PIXI.Text('Spin to Play!', titleStyle);
    playText.x = Math.round((bottom.width - playText.width) * 0.5);
    playText.y = app.screen.height - margin + Math.round((margin - playText.height) * 0.5);
    bottom.addChild(playText);

    //Wrex: Change this to image
    const muteText = new PIXI.Text('mute', infoStyle);
    muteText.x = muteText.width * 0.5;
    muteText.y = muteText.height * 0.5;
    muteText.interactive = true;
    muteText.buttonMode = true;
    muteText.on('pointerdown', () => {
        const muted = PIXI.sound.toggleMuteAll();
        muteText.text = muted ? 'unmute' : 'mute';
    });
    left.addChild(muteText);

    const moneyText = new PIXI.Text('$' + money, infoStyle);
    moneyText.x = app.screen.width - REEL_WIDTH + REEL_WIDTH * 0.5 - moneyText.width * 0.5;
    moneyText.y = margin + moneyText.height * 0.5;
    right.addChild(moneyText);

    const currentBetText = new PIXI.Text('Bet: ' + getCurrentBet(), infoStyle);
    currentBetText.x = app.screen.width - REEL_WIDTH + REEL_WIDTH * 0.5 - currentBetText.width * 0.5;
    currentBetText.y = margin + moneyText.height + currentBetText.height * 0.5;

    currentBetText.interactive = true;
    currentBetText.buttonMode = true;
    currentBetText.on('pointerdown', () => {
        onBetClicked(currentBetText);
    });

    right.addChild(currentBetText);

    app.stage.addChild(reelContainer);
    app.stage.addChild(top);
    app.stage.addChild(bottom);
    app.stage.addChild(left);
    app.stage.addChild(right);


    // Set the interactivity.
    bottom.interactive = true;
    bottom.buttonMode = true;
    bottom.addListener('pointerdown', () => {
        startPlay();
    });

    let running = false;

    function onBetClicked(currentBetText) {
        if (running) return;
        betIndex++;
        betIndex %= BET_OPTIONS.length;
        currentBetText.text = 'Bet: ' + getCurrentBet();
    }

    function getCurrentBet() {
        return BET_OPTIONS[betIndex];
    }

    // Function to start playing.
    function startPlay() {
        if (running) return;
        const betAmount = getCurrentBet();
        if (money < betAmount) return;
        running = true;

        playText.text = "Good Luck!";
        playText.x = Math.round((bottom.width - playText.width) * 0.5);

        money -= betAmount;
        moneyText.text = '$' + money; //This should probably be a function by now... we have it used 3 places

        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            //Wrex: This should be some sort of smart formula...
            const extra = Math.floor(Math.random() * 3);
            const target = r.position + 10 + (i * 5) + extra;
            const time = 2500 + (i * 1500) + (extra * 600);
            tweenTo(r, 'position', target, time, backout(0.5), null, i === reels.length - 1 ? reelsComplete : reelComplete);
        }
    }

    // Single Reel done handler.
    function reelComplete() {
        //Wrex: if we wanna do something on a single reel finishing its animation.... code it here.
    }

    // All Reels ares done handler.
    function reelsComplete() {
        let data = getCurrentReelsVisibilityData();

        //Wrex: I know this isnt scalable with the REEL_COUNT...Rework this if we actually would have a scalable game...
        //Check horizontal
        const matchH0 = checkMatch(data[0][0], data[1][0], data[2][0]);
        const matchH1 = checkMatch(data[0][1], data[1][1], data[2][1]);
        const matchH2 = checkMatch(data[0][2], data[1][2], data[2][2]);

        //Check diagonal
        const matchD0 = checkMatch(data[0][0], data[1][1], data[2][2]);
        const matchD1 = checkMatch(data[0][2], data[1][1], data[2][0]);

        const multiplier = matchH0 + matchH1 + matchH2 + matchD0 + matchD1;
        if (multiplier > 0) {
            const reward = getCurrentBet() * multiplier;
            money += reward;
            moneyText.text = '$' + money;

            let sound = PIXI.sound.Sound.from(MANIFEST.succesSfx);
            sound.play({
                volume: 0.2 //sound is  too loud
            });

            //Wrex: do some gratification ui here. ngl, i dont have time.
            playText.text = "Winner: x" + multiplier + " multiplier for $" + reward + ". Spin to Play!";
            playText.x = Math.round((bottom.width - playText.width) * 0.5);
            //Delay it a bit for that sexy ui, than set running false again ...  For now... set it immediately
            running = false;
        } else {
            playText.text = "Better luck next time. Spin to Play!";
            playText.x = Math.round((bottom.width - playText.width) * 0.5);
            running = false;
        }
    }

    function getCurrentReelsVisibilityData() {
        const data = [];
        for (let i = 0; i < REEL_COUNT; i++) {
            const dataReel = [];
            for (let j = 1; j < SYMBOLS_VISIBLE + 1; j++) {
                const index = mod(reelsVisibilityIndex[i] + j, SYMBOLS_VISIBLE + 1);
                const symbolId = reelsData[i][index];
                dataReel.push(symbolId);
            }
            data.push(dataReel);
        }
        return data;
    }

    function checkMatch(index1, index2, index3) {
        if (index1 === index2 && index2 === index3) {
            return WIN_MULTIPLIERS[index1];
        }

        return 0;
    }

    app.ticker.add((delta) => {
        for (let i = 0; i < reels.length; i++) {
            const reel = reels[i];
            // Update blur filter y amount based on speed.
            // This would be better if calculated with time in mind also. Now blur depends on frame rate.
            reel.blur.blurY = (reel.position - reel.previousPosition) * 8;
            reel.previousPosition = reel.position;

            for (let j = 0; j < reel.symbols.length; j++) {
                const symbol = reel.symbols[j];
                const previousY = symbol.y;
                symbol.y = ((reel.position + j) % reel.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                if (symbol.y < 0 && previousY > SYMBOL_SIZE) {
                    const symbolId = getNextSymbolId(i);
                    reelsData[i][j] = symbolId;
                    symbol.texture = slotTextures[symbolId];
                    symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.texture.width, SYMBOL_SIZE / symbol.texture.height);
                    symbol.x = (REEL_WIDTH * 0.5) - (symbol.width * 0.5);

                    reelsVisibilityIndex[i] = j;
                }
            }
        }
    });
});

// Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
const tweening = [];
function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };

    tweening.push(tween);
    return tween;
}

// Listen for animate update.
app.ticker.add((delta) => {
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < tweening.length; i++) {
        const t = tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);

        t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1) {
            t.object[t.property] = t.target;
            if (t.complete) t.complete(t);
            remove.push(t);
        }
    }
    for (let i = 0; i < remove.length; i++) {
        tweening.splice(tweening.indexOf(remove[i]), 1);
    }
});

// Basic lerp funtion.
function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
}

// Backout function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
function backout(amount) {
    return (t) => (--t * t * ((amount + 1) * t + amount) + 1);
}

//Wrex: lifted from https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
function mod(a, b) {
    return ((a % b) + b) % b;
}