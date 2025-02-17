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
import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcOptionItem, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { FM_RTC } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { CreateTimeControlledOrderComponent } from './modal/create-time-controlled-order/create-time-controlled-order.component';
import { RestorableTimeControlledOrderComponent } from './restorable-time-controlled-order.component';
import { XoTCOTableFilter } from './xo/xo-tcotable-filter.model';
import { XoTimeControlledOrderTableEntry, XoTimeControlledOrderTableEntryArray } from './xo/xo-time-controlled-order-table-entry.model';
import { XoTimeControlledOrder } from './xo/xo-time-controlled-order.model';


@Component({
    selector: 'selector-name',
    templateUrl: './time-controlled-orders.component.html',
    styleUrls: ['./time-controlled-orders.component.scss'],
    standalone: false
})
export class TimeControlledOrdersComponent extends RestorableTimeControlledOrderComponent implements OnInit {
    selection: XoTimeControlledOrderTableEntry;
    private _showArchived = false;

    get showArchived(): boolean {
        return this._showArchived;
    }

    set showArchived(value: boolean) {
        this._showArchived = value;
        this.remoteTableDataSource.input = new XoTCOTableFilter('', value);
        this.remoteTableDataSource.refresh();
    }

    constructor(
        apiService: ApiService,
        dialogService: XcDialogService,
        route: ActivatedRoute,
        router: Router,
        i18nService: I18nService,
        injector: Injector,
        settings: FactoryManagerSettingsService
    ) {
        super(apiService, dialogService, route, router, i18nService, injector, settings);
        this.initRemoteTableDataSource(XoTimeControlledOrderTableEntry, XoTimeControlledOrderTableEntryArray, FM_RTC, this.WFP_GETTCOS);

        // Adding input and output
        this.remoteTableDataSource.input = new XoTCOTableFilter('', false);
        this.remoteTableDataSource.output = XoTimeControlledOrderTableEntryArray;
        this.remoteTableDataSource.refreshOnFilterChange = this.settings.tableRefreshOnFilterChange;

        // Template for archived TCOs
        const remappedTableInfo = XoRemappingTableInfoClass<XoTimeControlledOrderTableEntry>(XoTableInfo, XoTimeControlledOrderTableEntry, {
            src: t => t.id.id,
            dst: t => t.tableArchivedTemplate
        });
        this.remoteTableDataSource.tableInfoClass = remappedTableInfo;

        // Filter for status
        const filterItems: XcOptionItem[] = [
            { name: '', value: '' },
            { name: this.i18nService.translate('fman.tco.planning'), value: 'Planning' },
            { name: this.i18nService.translate('fman.tco.waiting'), value: 'Waiting' },
            { name: this.i18nService.translate('fman.tco.running'), value: 'Running' },
            { name: this.i18nService.translate('fman.tco.disabled'), value: 'Disabled' },
            { name: this.i18nService.translate('fman.tco.cancelled'), value: 'Cancelled' },
            { name: this.i18nService.translate('fman.tco.failed'), value: 'Failed' },
            { name: this.i18nService.translate('fman.tco.finished'), value: 'Finished' }
        ];
        this.remoteTableDataSource.filterEnums.set(XoTimeControlledOrderTableEntry.getAccessorMap().status, of(filterItems));
        this.remoteTableDataSource.refresh();

        // Adding action elements to delete a row
        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.tco.kill'),
                onAction: this.killTCO.bind(this),
                onShow: tco => !tco.archived
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.tco.duplicate-tco'),
                onAction: this.duplicate.bind(this)
            }
        ];

        // Adding selection change observer
        this.remoteTableDataSource.selectionModel.selectionChange.subscribe(selectionModel => {
            this.selection = selectionModel.selection[0];
        });
    }

    ngOnInit() {
        super.ngOnInit();
    }

    killTCO(timeControlledOrder: XoTimeControlledOrder) {
        this.dialogService
            .confirm(this.i18nService.translate('fman.tco.warning'), this.i18nService.translate(this.CONFIRM_KILL, { key: '$0', value: timeControlledOrder.name }))
            .afterDismissResult()
            .subscribe(value => {
                if (value) {
                    if (timeControlledOrder instanceof XoTimeControlledOrderTableEntry) {
                        this.apiService
                            .startOrder(
                                FM_RTC,
                                this.WFP_KILL_TCO,
                                timeControlledOrder.id,
                                null,
                                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
                            )
                            .pipe(
                                finalize(() => {
                                    this.remoteTableDataSource.refresh();
                                })
                            )
                            .subscribe(result => {
                                if (result.errorMessage) {
                                    this.dialogService.error(result.errorMessage, null, result.stackTrace.join('\r\n'));
                                }
                            });
                    }
                }
            });
    }

    cancelDetail() {
        this.selection = null;
        this.remoteTableDataSource.selectionModel.clear();
    }

    refresh(): void {
        this.remoteTableDataSource.refresh();
    }

    create(): void {
        this.dialogService
            .custom(CreateTimeControlledOrderComponent, {})
            .afterDismissResult()
            .subscribe(result => {
                if (result) {
                    this.refresh();
                }
            });
    }

    duplicate(timeControlledOrderTableEntry: XoTimeControlledOrderTableEntry): void {
        this.apiService
            .startOrder(
                FM_RTC,
                this.WFP_GET_TCO_DETAILS,
                timeControlledOrderTableEntry.id,
                XoTimeControlledOrder,
                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            )
            .subscribe(
                startOrderResult => {
                    if (startOrderResult.errorMessage) {
                        this.dialogService.error(startOrderResult.errorMessage, null, startOrderResult.stackTrace.join('\r\n'));
                    } else {
                        this.dialogService
                            .custom(CreateTimeControlledOrderComponent, { default: startOrderResult.output[0] as XoTimeControlledOrder })
                            .afterDismissResult()
                            .subscribe(result => {
                                if (result) {
                                    this.refresh();
                                }
                            });
                    }
                },
                error => this.dialogService.error(error)
            );
    }
}
