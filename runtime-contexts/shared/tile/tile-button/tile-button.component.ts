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
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

import { XcColor } from '@zeta/xc/shared/xc-themeable.component';
import { TileItem } from '../tile-data-source';

@Component({
    selector: 'tile-button',
    templateUrl: './tile-button.component.html',
    styleUrls: ['./tile-button.component.scss'],
    standalone: false
})
export class TileButtonComponent {

    @Input()
    item: TileItem;

    @HostBinding('class.selected')
    @Input()
    selected = false;

    @Output('select-item')
    readonly selectItem = new EventEmitter<TileItem>();


    click() {
        this.selectItem.emit(this.selected ? undefined : this.item);
    }


    get hasIcon(): boolean {
        return !!this.item.getIcon;
    }


    get color(): XcColor {
        return this.selected ? 'primary' : 'normal';
    }


    get label(): string {
        return this.item.getLabel();
    }

    get cursiveLabel(): string {
        return this.item.getCursiveLabel ? this.item.getCursiveLabel() : undefined;
    }


    get tooltip(): string {
        return this.item.getTooltip ? this.item.getTooltip() : '';
    }
}
