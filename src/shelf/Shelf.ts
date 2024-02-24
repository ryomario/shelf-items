import Item from "./Item";
import ItemPosition from "./ItemPosition";
import { ShelfListener } from "./Listener";

/**
 * Max 5 rows
 * Max 3 columns
 * Max 10 items per cell
 */
export const DEFAULT_MAX_POSITION: ItemPosition = {
    row: 5,
    column: 3,
    order: 10,
}

type MapItemOrder = Map<number,Item>;
type MapShelfColumn = Map<number,MapItemOrder>;
type MapShelfRow = Map<number,MapShelfColumn>;

export default class Shelf {
    // protected items:Array<Item>;
    protected maxItemPosition: ItemPosition = DEFAULT_MAX_POSITION;

    private itemsMap:MapShelfRow;

    protected tag:String;

    private listeners:Array<ShelfListener>;

    /**
     * Create an empty shelf (without any items)
     */
    constructor(tag: String) {
        this.tag = tag;
        // this.items = new Array();
        this.listeners = new Array();
        this.itemsMap = new Map();
    }

    /**
     * addListener
     */
    public addListener(listener: ShelfListener): void {
        this.listeners.push(listener);
    }
    /**
     * removeListener
     */
    public removeListener(listener: ShelfListener): void {
        const idx = this.listeners.findIndex(inListener => inListener === listener);
        if (idx !== -1) {
            this.listeners.splice(idx,1);
        }
    }

    private _getAvailablePosition(): ItemPosition|undefined {
        for (let row = 1; row <= this.maxItemPosition.row; row++) {
            if (this.itemsMap.get(row) !== undefined){
                for (let col = 1; col <= this.maxItemPosition.column; col++) {
                    if (this.itemsMap.get(row)?.get(col) !== undefined){
                        for (let order = 1; order <= this.maxItemPosition.order; order++) {
                            if (this.itemsMap.get(row)?.get(col)?.get(order) === undefined){
                                return {
                                    row,
                                    column: col,
                                    order
                                };
                            }
                        }
                    } else {
                        return {
                            row,
                            column: col,
                            order: 1
                        };
                    }
                }
            } else {
                return {
                    row,
                    column: 1,
                    order: 1
                };
            }
        }
        return undefined;
    }
    
    private _mappingItem(item: Item, position?: ItemPosition, isPush: boolean = false): boolean {
        if (position === undefined) position = this._getAvailablePosition();
        if (position === undefined) {
            this.listeners.forEach(listener => listener.OnFailedMappingItem(item,this,'The shelf is already full!'));
            return false;
        }
        // set item position
        item.setPosition(position);

        const row = item.getPosition().row;
        if (!this.itemsMap.get(row)){ // not yet set row map
            if (row > this.maxItemPosition.row) { // over the max value
                this.listeners.forEach(listener => listener.OnFailedMappingItem(item,this,'Over size row position'));
                return false; // mapping failed
            } else {
                this.itemsMap.set(row, new Map()); // create empty row map
            }
        }
        // already set row map
        const colMap = this.itemsMap.get(row);
        if (colMap !== undefined){
            // check is column map set?
            const col = item.getPosition().column;
            if (!colMap.get(col)){ // not yet set column map
                if (col > this.maxItemPosition.column){ // over the max value
                    this.listeners.forEach(listener => listener.OnFailedMappingItem(item,this,'Over size column position'));
                    return false;
                } else {
                    colMap.set(col, new Map()); // create empty column map
                }
            }
            // already set column map
            const orderMap = colMap.get(col);
            if (orderMap !== undefined){
                // check is order map set?
                const order = item.getPosition().order;
                if (!orderMap.get(order)){ // not yet set order map
                    if (order > this.maxItemPosition.order){ // over max value
                        this.listeners.forEach(listener => listener.OnFailedMappingItem(item,this,'Over size order position'));
                        return false;
                    } else {
                        const itemIn = orderMap.get(order);
                        /**
                         * SET ITEM TO MAP
                         */
                        orderMap.set(order, item); // set item to the map 
                        if (itemIn && isPush){
                            const mapped = this._mappingItem(itemIn);
                            if (mapped) {
                                this.listeners.forEach(listener => listener.OnMovedItem(itemIn,this));
                            } else {
                                this.listeners.forEach(listener => listener.OnDeletedItem(itemIn,this));
                            }
                        }
                        this.listeners.forEach(listener => listener.OnMappedItem(item,this));
                        return true;
                    }
                }
            }
        }
        this.listeners.forEach(listener => listener.OnFailedMappingItem(item,this));
        return false;
    }

    private _removeItemMap(position: ItemPosition): boolean {
        const colMap = this.itemsMap.get(position.row);
        if (colMap !== undefined) {
            const orderMap = colMap.get(position.column);
            if (orderMap !== undefined) {
                const item = orderMap.get(position.order);
                if (item !== undefined) {
                    return orderMap.delete(position.order);
                }
            }
        }
        return false;
    }

    private _removeItem(item: Item): boolean {
        const position = item.getPosition();
        if (this._removeItemMap(position)) return true;

        const pos = this._findPosition(item);
        if (pos === undefined) return false;
    
        if (this._removeItemMap(pos)) return true;
        return false;
    }

    private _findItemByPos(position: ItemPosition): Item|undefined {
        const colMap = this.itemsMap.get(position.row);
        if (colMap !== undefined) {
            const orderMap = colMap.get(position.column);
            if (orderMap !== undefined) {
                const item = orderMap.get(position.order);
                if (item !== undefined) {
                    return item;
                }
            }
        }
        return undefined;
    }

    private _findPosition(item: Item): ItemPosition|undefined {

        for (let row = 1; row <= this.maxItemPosition.row; row++) {
            if (this.itemsMap.get(row) !== undefined){
                for (let col = 1; col <= this.maxItemPosition.column; col++) {
                    if (this.itemsMap.get(row)?.get(col) !== undefined){
                        for (let order = 1; order <= this.maxItemPosition.order; order++) {
                            const itemIn = this.itemsMap.get(row)?.get(col)?.get(order);
                            if (itemIn !== undefined && item === itemIn){
                                return {
                                    row,
                                    column: col,
                                    order
                                };
                            }
                        }
                    }
                }
            }
        }
        return undefined;
    }

    private _getSize(): number {
        let count = 0;
        for (let row = 1; row <= this.maxItemPosition.row; row++) {
            if (this.itemsMap.get(row) !== undefined){
                for (let col = 1; col <= this.maxItemPosition.column; col++) {
                    if (this.itemsMap.get(row)?.get(col) !== undefined){
                        for (let order = 1; order <= this.maxItemPosition.order; order++) {
                            const itemIn = this.itemsMap.get(row)?.get(col)?.get(order);
                            if (itemIn !== undefined){
                                count += 1;
                            }
                        }
                    }
                }
            }
        }
        return count;
    }

    private _getItemsInRow(row: number): Array<Array<Item|null>>|undefined {
        const map = this.itemsMap.get(row);
        const arr:Array<Array<Item|null>> = new Array();
        for (let col = 1; col <= this.maxItemPosition.column; col++) {
            for (let order = 1; order <= this.maxItemPosition.order; order++) {
                const itemIn = map?.get(col)?.get(order);
                if (itemIn !== undefined){
                    arr[col-1][order-1] = itemIn;
                } else {
                    arr[col-1][order-1] = null;
                }
            }
        }
        return arr;
    }
    private _getItemsInCol(col: number): Array<Array<Item|null>>|undefined {
        const arr:Array<Array<Item|null>> = new Array();
        for (let row = 1; row <= this.maxItemPosition.row; row++) {
            for (let order = 1; order <= this.maxItemPosition.order; order++) {
                const itemIn = this.itemsMap.get(row)?.get(col)?.get(order);
                if (itemIn !== undefined){
                    arr[row-1][order-1] = itemIn;
                } else {
                    arr[row-1][order-1] = null;
                }
            }
        }
        return arr;
    }
    private _getItemsInCell(row: number, col: number): Array<Item|null>|undefined {
        const map = this.itemsMap.get(row)?.get(col);
        const arr:Array<Item|null> = new Array();
        for (let order = 1; order <= this.maxItemPosition.order; order++) {
            const itemIn = map?.get(order);
            if (itemIn !== undefined){
                arr[order-1] = itemIn;
            } else {
                arr[order-1] = null;
            }
        }
        return arr;
    }
    private _getItemInPos(row: number, col: number, order: number): Item|null {
        const item = this.itemsMap.get(row)?.get(col)?.get(order);
        if (item !== undefined) return item;
        return null;
    }

    private itemsMapping(items: Array<Item>): void {
        this.itemsMap.clear();
        const itemsMappingThen = new Array<Item>();
        for (const item of items) {
            if (!this._mappingItem(item)){
                itemsMappingThen.push(item);
            }
        }
        // Mapping items in queue
        for (const item of itemsMappingThen) {
            if(!this._mappingItem(item)){
                this.listeners.forEach(listener => listener.OnFailedMappingItem(item,this,'Full, no position available'));
            }
        }
    }

    /**
     * addItem and push available item
     */
    public async addItem(item: Item, itemPosition?: ItemPosition): Promise<void> {
        if (this._mappingItem(item, itemPosition, true)){
            // this.items.push(item);
            this.listeners.forEach(listener => listener.OnAddedItem(item, this));
        } else {
            this.listeners.forEach(listener => listener.OnFailedAddingItem(item,this,'Mapping failed'));
        }
    }

    /**
     * deleteItem
     */
    public async deleteItem(item: Item): Promise<void> {
        const res = this._removeItem(item);
        if (res) {
            this.listeners.forEach(listener => listener.OnDeletedItem(item, this));
        } else {
            this.listeners.forEach(listener => listener.OnFailedDeletingItem(item, this, 'Item not found'));
        }
    }

    /**
     * set an Item on spesific position
     */
    public async setItem(item: Item, position?: ItemPosition): Promise<void> {
        const res = this._removeItem(item);
        if (res) {
            this.listeners.forEach(listener => listener.OnDeletedItem(item, this));
        } else {
            this.listeners.forEach(listener => listener.OnFailedDeletingItem(item, this, 'Item not found'));
        }
    }

    /**
     * size
     */
    public size() {
        return this._getSize();
    }

    /**
     * toString
     */
    public toString(): String {
        const size = this.size();
        let sizeStr = size + ' item';
        if (size > 1) sizeStr = size + ' items';
        return this.tag + ' (' + sizeStr + ')';
    }

    /**
     * print data
     */
    public print(): void {
        const itemsMap = {};
        for(let row = 1; row <= this.maxItemPosition.row; row++) {
            for(let col = 1; col <= this.maxItemPosition.column; col++) {
                for(let order = 1; order <= this.maxItemPosition.order; order++){
                    if(!itemsMap[row]) itemsMap[row] = {};
                    if(!itemsMap[row][col]) itemsMap[row][col] = [];
                    const item = this.itemsMap.get(row)?.get(col)?.get(order);
                    itemsMap[row][col].push(item?.getTag());
                }
            }
        }

        console.table(itemsMap);
    }
}