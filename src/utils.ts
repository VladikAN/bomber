import { Consts } from './consts';
import { BaseObj, Bomb, ObjType, Player, Point } from './types';

const objects: BaseObj[] = [];

export const pushObject = (obj: BaseObj): void => {
    objects.push(obj);
};

export const findPlayers = (x: number, y: number): Player[] => {
    const allPlayers = objects.filter((obj) => obj.type == ObjType.player && !obj.isDead);
    const inTile = allPlayers.filter((p) => {
        const crd = alignToWorld(p.gameObj.x, p.gameObj.y);
        return crd.x == x && crd.y == y;
    });

    return inTile.map((p) => <Player>p);
};

export const findBombs = (x: number, y: number): Bomb[] => {
    const allBombs = objects.filter((obj) => obj.type == ObjType.bomb && !obj.isDead);
    const inTile = allBombs.filter((b) => {
        const crd = alignToWorld(b.gameObj.x, b.gameObj.y);
        return crd.x == x && crd.y == y;
    });

    return inTile.map((b) => <Bomb>b);
};

export const alignToWorld = (x: number, y: number): Point => {
    return { x: Math.floor(x / Consts.spriteFrame), y: Math.floor(y / Consts.spriteFrame) };
};