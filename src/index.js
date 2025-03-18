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
    constructor(name = "Мирная утка", maxPower = 2, image = undefined) {
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

        taskQueue.continueWith(continuation);
    }
}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
