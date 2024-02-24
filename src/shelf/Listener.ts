import Item from "./Item";
import Shelf from "./Shelf";

export interface ShelfListener {
    OnAddedItem(item: Item, toShelf: Shelf): void;
    OnDeletedItem(item: Item, fromShelf: Shelf): void;
    OnMovedItem(item: Item, toShelf: Shelf): void;
    OnChangedItem(item: Item, byShelf?: Shelf): void;
    OnMappedItem(item: Item, toShelf: Shelf): void;
    
    OnFailedAddingItem(item: Item, toShelf: Shelf, reason?: String): void;
    OnFailedDeletingItem(item: Item, fromShelf: Shelf, reason?: String): void;
    OnFailedMappingItem(item: Item, onShelf: Shelf, reason?: String): void;
}

export interface ItemListener {
    OnChanged(oldValue: any, newValue: any): void;
}