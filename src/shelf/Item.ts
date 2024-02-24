import ItemPosition from "./ItemPosition";

export default class Item {
    protected tag: String;
    protected position: ItemPosition;

    /**
     *
     */
    constructor(tag: String) {
        this.tag = tag;
        this.position = {
            row: 0,
            column: 0,
            order: 0
        }
    }

    /**
     * getTag
     */
    public getTag(): String {
        return this.tag;
    }

    /**
     * getPosition
     */
    public getPosition(): ItemPosition {
        return this.position;
    }

    /**
     * setPosition
     */
    public setPosition(newPosition: ItemPosition): void {
        this.position = newPosition;
    }

    /**
     * setPosition
     */
    public setPositionNum(row: number, col: number, order: number): void {
        this.position = {
            row,
            column: col,
            order
        };
    }

    /**
     * toString
     */
    public toString(): String {
        return this.tag + '' + this.position.column + '' + this.position.row + '' + this.position.order;
    }

    /**
     * print data
     */
    public print() {
        console.log(this.toString());
    }
}