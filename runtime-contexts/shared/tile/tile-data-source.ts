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
        const selected = this.leftItems.find(item => item === value) ?? this.rightItems.find(item => item === value);

        if (selected && this.leftItems.includes(selected)) {
            this.leftSelected = true;
        } else if (selected) {
            this.leftSelected = false;
        }

        this.selectionModel.combineOperations(() => {
            this.selectionModel.clear();
            if (selected) {
                this.selectionModel.select(selected);
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
        if (this.selectionModel.isEmpty()) {
            return false;
        }

        const selectedItem = this.selectionModel.selection[0];
        if (this.leftItems.some(item => item === selectedItem)) {
            this.leftSelected = true;
            return true;
        }
        if (this.rightItems.some(item => item === selectedItem)) {
            this.leftSelected = false;
            return true;
        }

        return false;
    }

    isLeftSelected(): boolean {
        const selectedItem = this.detailItem;
        return !!selectedItem && this.leftItems.some(item => item === selectedItem);
    }

    isRightSelected(): boolean {
        const selectedItem = this.detailItem;
        return !!selectedItem && this.rightItems.some(item => item === selectedItem);
    }

    isSelected(item: TileItem): boolean {
        return !!this.detailItem && this.detailItem === item;
    }

    isEmpty() {
        return this.leftItems.length === 0 && this.rightItems.length === 0;
    }
}
