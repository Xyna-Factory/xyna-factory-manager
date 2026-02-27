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
import { ChangeDetectorRef, Component, ElementRef, HostBinding, Input, NgZone, OnInit, ViewChild, inject } from '@angular/core';

import { ApiService } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcDialogService, XDSIconName } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { debounceTime, first, skip } from 'rxjs';

import { TileButtonComponent } from './tile-button/tile-button.component';
import { TileDataSource, TileItem } from './tile-data-source';


export interface ActionButtonData {
    iconName: string;
    tooltip: string;
}

@Component({
    selector: 'tile',
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss'],
    imports: [TileButtonComponent, I18nModule, XcModule]
})
export class TileComponent  implements OnInit {
    private readonly apiService = inject(ApiService);
    private readonly dialogService = inject(XcDialogService);
    private readonly i18n = inject(I18nService);
    private readonly cdref = inject(ChangeDetectorRef);
    private readonly zone = inject(NgZone);

    @ViewChild('header', { static: false })
    headerRef: ElementRef;

    readonly XDSIconName = XDSIconName;

    private _dataSource: TileDataSource;
    private _actionButton: ActionButtonData;

    @Input('tile-datasource')
    set dataSource(value: TileDataSource) {
        this._dataSource = value;
    }

    get dataSource(): TileDataSource {
        return this._dataSource;
    }

    @Input('action-button')
    set actionButton(value: ActionButtonData) {
        this._actionButton = value;
    }

    get actionButton(): ActionButtonData {
        return this._actionButton;
    }
    ngOnInit(): void {
        this.cdref.markForCheck();
    }

    hasLabel(): boolean {
        return !!this.label;
    }

    get label(): string {
        return this.dataSource.label;
    }


    select(item: TileItem) {
        if (item) {
            this.dataSource.detailItem = item;
            this.scrollTo();
        } else {
            this.dataSource.detailItem = undefined;
        }
    }


    get hasDetails(): boolean {
        return this.dataSource.hasDetail();
    }


    @HostBinding('class.left-selected')
    get isLeftSelected(): boolean {
        return this.dataSource.isLeftSelected();
    }


    @HostBinding('class.right-selected')
    get isRightSelected(): boolean {
        return this.dataSource.isRightSelected();
    }


    scrollTo() {
        // Workaround because angular material has no observer that completes when data is loaded and the table is rendered.
        // See https://github.com/angular/components/issues/8068
        this.zone.onStable.pipe(skip(2), first(), debounceTime(100)).subscribe(() => {
            this.headerRef.nativeElement.scrollIntoView(true);
            // The parent is the scroll section. Used to get a margin of 8px at the top of the card.
            const parent = this.headerRef.nativeElement.parentElement.parentElement;
            if (parent) {
                this.headerRef.nativeElement.parentElement.parentElement.scrollTop -= 8;
            }
        });
    }


    action() {
        this.dataSource.action();
    }
}
