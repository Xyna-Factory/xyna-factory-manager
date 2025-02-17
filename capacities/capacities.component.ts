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
import { Component, Injector, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService, XcFormDirective, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { FM_RTC } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { AddNewCapacityModalComponent, AddNewCapacityModalComponentData } from './modal/add-new-capacity-modal/add-new-capacity-modal.component';
import { CAPACITY_ISWP, RestorableCapacitiesComponent } from './restorable-capacities.component';
import { XoCapacityInformation, XoCapacityInformationArray } from './xo/xo-capacity-information.model';
import { XoCapacityName } from './xo/xo-capacity-name.model';
import { filter } from 'rxjs';


const ISWP = CAPACITY_ISWP;


@Component({
    templateUrl: './capacities.component.html',
    styleUrls: ['./capacities.component.scss'],
    standalone: false
})
export class CapacitiesComponent extends RestorableCapacitiesComponent {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : false;
    }

    get state(): boolean {
        return this.detailsObject.state === 'ACTIVE';
    }

    set state(value: boolean) {
        this.detailsObject.state = value ? 'ACTIVE' : 'DISABLED';
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
        this.initRemoteTableDataSource(XoCapacityInformation, XoCapacityInformationArray, FM_RTC, ISWP.List);

        this.remoteTableDataSource.tableInfoClass = XoRemappingTableInfoClass(
            XoTableInfo, XoCapacityInformation,
            { src: t => t.inuse, dst: t => t.tableInuseTemplate }
        );

        this.selectedEntryChange.subscribe(
            selection => {
                if (selection && selection.length) {
                    this.getDetails(selection[0]);
                }
            }
        );

        this.remoteTableDataSource.actionElements = [
            {
                class: 'delete-action-element',
                iconName: 'delete',
                tooltip: this.i18nService.translate('fman.capacities.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.capacities.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];
    }

    private getDetails(entry: XoCapacityInformation) {

        const name = new XoCapacityName();
        name.name = entry.name;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, name, XoCapacityInformation, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoCapacityInformation;
        }, this.UNSPECIFIED_DETAILS_ERROR, null);
    }

    add(duplicatedProperty: XoCapacityInformation = null) {

        const data: AddNewCapacityModalComponentData = {
            addWorkflow: ISWP.Add,
            apiService: this.apiService,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            duplicate: duplicatedProperty
        };

        this.dialogService.custom<boolean, AddNewCapacityModalComponentData>(AddNewCapacityModalComponent, data).afterDismissResult()
            .pipe(filter(result => !!result))
            .subscribe(() => this.refresh());
    }

    duplicate(entry: XoCapacityInformation) {
        this.add(entry);
    }

    delete(entry: XoCapacityInformation) {
        this.dialogService.confirm(
            this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
            this.i18nService.translate(this.CONFIRM_DELETE, {key: '$0', value: entry.name})
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoCapacityInformation) {
                        const name = new XoCapacityName();
                        name.name = entry.name;
                        const obs = this.apiService.startOrder(FM_RTC, ISWP.Delete, name, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, output => {
                            this.detailsObject = null;
                            this.clearSelection();
                            this.refresh();
                        }, this.UNSPECIFIED_DETAILS_ERROR);
                    }
                }
            }
        );
    }

    dismiss() {
        this.detailsObject = null;
        this.clearSelection();
    }

    save() {
        const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, this.detailsObject.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.dismiss();
            this.refresh();
        }, this.UNSPECIFIED_SAVE_ERROR);
    }
}
