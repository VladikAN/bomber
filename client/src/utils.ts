import { Consts } from "./configs";
import { BaseObj, Bomb, Player, Point } from "./types";

const objects: BaseObj[] = [];

export const pushObject = (obj: BaseObj) => {
    objects.push(obj);
}

export const findPlayer = (x: number, y: number): Player => {
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].type != 'player' || objects[i].isDead) {
            continue;
        }
        var crd = alignToWorld(objects[i].gameObj.x, objects[i].gameObj.y);
        if (crd.x == x && crd.y == y) {
            return <Player>objects[i];
        }
    }
    return null;
}

export const findBomb = (x: number, y: number): Bomb => {
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].type != 'bomb' || objects[i].isDead) {
            continue;
        }
        var crd = alignToWorld(objects[i].gameObj.x, objects[i].gameObj.y);
        if (crd.x == x  && crd.y == y ) {
            return <Bomb>objects[i];
        }
    }
    return null;
}

export const alignToWorld = (x: number, y: number): Point => {
    return { x: Math.floor(x / Consts.spriteFrame), y: Math.floor(y / Consts.spriteFrame) };
}