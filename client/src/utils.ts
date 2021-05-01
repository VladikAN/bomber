import { Consts } from "./consts";
import { BaseObj, Bomb, Player, Point } from "./types";

const objects: BaseObj[] = [];

export const pushObject = (obj: BaseObj) => {
    objects.push(obj);
}

export const findPlayer = (x: number, y: number): Player => {
    const players = objects.filter((obj) => obj.type == 'player' && !obj.isDead);
    const player = players.find((p) => {
        const crd = alignToWorld(p.gameObj.x, p.gameObj.y);
        return crd.x == x && crd.y == y;
    });

    return player != null ? <Player>player : null;
}

export const findBomb = (x: number, y: number): Bomb => {
    const bombs = objects.filter((obj) => obj.type == 'bomb' && !obj.isDead);
    const bomb = bombs.find((b) => {
        const crd = alignToWorld(b.gameObj.x, b.gameObj.y);
        return crd.x == x && crd.y == y;
    });

    return bomb != null ? <Bomb>bomb : null;
}

export const alignToWorld = (x: number, y: number): Point => {
    return { x: Math.floor(x / Consts.spriteFrame), y: Math.floor(y / Consts.spriteFrame) };
}