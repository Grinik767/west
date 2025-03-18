import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card instanceof Duck;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor(name="Мирная утка", maxPower=2, image="golub.jpg") {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3, image) {
        super(name, maxPower, image);
    }

}

class Trasher extends Dog {
    constructor(name = "Громила", maxPower = 5, image = "ААА.jpg") {
        super(name, maxPower, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(Math.max(0, value - 1));
        });
    }
}

class Gatling extends Creature {
    constructor(name = "Гатлинг", maxPower = 6, image) {
        super(name, maxPower, image);
    }

    attack(gameContext, continuation) {
        let oppositeCards = gameContext.oppositePlayer.table;
        const taskQueue = new TaskQueue();

        for (let position = 0; position < oppositeCards.length; position++) {
            let oppositeCard = oppositeCards[position];
            taskQueue.push(
                onDone => {
                    if (oppositeCards[position])
                        this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                    else {
                        onDone();
                    }
                });
        }
        taskQueue.push(continuation);
    }
}

class Lad extends Dog {
    constructor(name = "Браток", maxPower = 2, image = "skeletons.gif") {
        super(name, maxPower, image);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }
y
    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(gameContext, continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(value + bonus);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(Math.max(0, value - bonus));
    }

    getDescriptions() {
        const descriptions = [];
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            descriptions.push("Чем их больше, тем они сильнее.");
        }

        return descriptions.concat(super.getDescriptions());
    }
}

class Brewer extends Duck {
    constructor(name = "Пивовар", maxPower = 2, image = "berw.png") {
        super(name, maxPower, image);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer } = gameContext;
        const allCardsOnTable = currentPlayer.table.concat(oppositePlayer.table);
        allCardsOnTable.forEach(card => {
            if (isDuck(card)) {
                card.maxPower += 1;

                card.currentPower += 2;

                card.view.signalHeal(() => {
                    card.updateView();
                });
            }
        });

        continuation();
    }
}

class Rogue extends Creature {
    constructor(name = "Изгой", maxPower = 2, image) {
        super(name, maxPower, image);
    }

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeCard = oppositePlayer.table[position];

        if (oppositeCard) {
            const prototype = Object.getPrototypeOf(oppositeCard);

            const abilitiesToSteal = ["modifyDealedDamageToCreature", "modifyDealedDamageToPlayer", "modifyTakenDamage"];

            const stolenAbilities = {};

            oppositePlayer.table.forEach(card => {
                if (card && Object.getPrototypeOf(card) === prototype) {
                    abilitiesToSteal.forEach(ability => {
                        if (card.hasOwnProperty(ability)) {
                            stolenAbilities[ability] = card[ability];
                            delete card[ability];
                        }
                    });
                }
            });

            Object.assign(this, stolenAbilities);
        }

        updateView();
        continuation();
    }
}

const seriffStartDeck = [
    new Rogue(),
    new Brewer(),
    new Duck(),
    new Duck()

];
const banditStartDeck = [
    new Trasher(),
    new Trasher(),
    new Trasher()
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
