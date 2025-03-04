/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

import { Comparable } from '@zeta/base';
import { XcSelectionDataSource, XcSelectionModel, XcSortDirection, XcSortPredicate, XcTemplate } from '@zeta/xc';

import { Observable, Subject } from 'rxjs';


export interface TileItem extends Comparable {
    getDetailTemplate(): XcTemplate;
    getLabel(): string;
    getCursiveLabel?(): string;
    getTooltip?(): string;
    getIcon?(): XcTemplate;
}

export class TileDataSource extends XcSelectionDataSource<TileItem> {

    private left: TileItem[];
    private right: TileItem[];
    private _isSelected = true;
    private leftSelected = true;

    constructor(selectionModel: XcSelectionModel<TileItem>, leftItems: TileItem[], rightItems: TileItem[], public label = '') {
        super(selectionModel);
        this.leftItems = leftItems;
        this.rightItems = rightItems;
    }

    set leftItems(leftItems: TileItem[]) {
        this.left = leftItems;
        this.left.sort(XcSortPredicate(XcSortDirection.asc, t => t.uniqueKey));
    }

    get leftItems(): TileItem[] {
        return this.left;
    }

    set rightItems(rightItems: TileItem[]) {
        this.right = rightItems;
        this.right.sort(XcSortPredicate(XcSortDirection.asc, t => t.uniqueKey));
    }

    get rightItems(): TileItem[] {
        return this.right;
    }

    private readonly actionButton = new Subject<(void)>();

    get detailItem(): TileItem {
        return this.hasDetail() ? this.selectionModel.selection[0] : undefined;
    }

    set detailItem(value: TileItem) {
        let selected = this.leftItems.find(item => item.equals(value));
        if (selected) {
            this.leftSelected = true;
        } else {
            selected = this.rightItems.find(item => item.equals(value));
            this.leftSelected = false;
        }

        this.selectionModel.combineOperations(() => {
            this._isSelected = false;
            this.selectionModel.clear();
            if (selected) {
                this.selectionModel.select(selected);
                this._isSelected = true;
            }
        });
    }

    get actionPressed(): Observable<void> {
        return this.actionButton.asObservable();
    }

    action() {
        this.actionButton.next();
    }

    hasDetail(): boolean {
        if (this._isSelected && !this.selectionModel.isEmpty()) {
            if (this.leftItems.find(item => item.equals(this.selectionModel.selection[0]))) {
                this.leftSelected = true;
                return true;
            }
            if (this.rightItems.find(item => item.equals(this.selectionModel.selection[0]))) {
                this.leftSelected = false;
                return true;
            }
        }
        this._isSelected = false;
        return false;
    }

    isLeftSelected(): boolean {
        return this.hasDetail() && this.leftSelected;
    }

    isRightSelected(): boolean {
        return this.hasDetail() && !this.leftSelected;
    }

    isSelected(item: TileItem): boolean {
        return this.hasDetail() && this.detailItem.equals(item);
    }

    isEmpty() {
        return this.leftItems.length === 0 && this.rightItems.length === 0;
    }
}
