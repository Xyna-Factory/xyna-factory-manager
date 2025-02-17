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
import { Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogService } from '@zeta/xc';

import { FM_RTC } from '../const';
import { FactoryManagerSettingsService } from '../misc/services/factory-manager-settings.service';
import { AddNewAdministrativeVetoModalComponent, AddNewAdministrativeVetoModalData } from './modal/add-new-administrative-veto-modal/add-new-administrative-veto-modal.component';
import { ADMINISTRATIVE_VETOES_ISWP, RestorableAdministrativeVetoComponent } from './restorable-administrative-vetoes.component';
import { XoAdministrativeVetoName } from './xo/xo-administrative-veto-name.mode';
import { XoAdministrativeVeto, XoAdministrativeVetoArray } from './xo/xo-administrative-veto.model';
import { filter } from 'rxjs';


const ISWP = ADMINISTRATIVE_VETOES_ISWP;

@Component({
    templateUrl: './administrative-vetoes.component.html',
    styleUrls: ['./administrative-vetoes.component.scss'],
    standalone: false
})
export class AdministrativeVetoesComponent extends RestorableAdministrativeVetoComponent {

    runtimeContextsDataWrapper: any;

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
        this.initRemoteTableDataSource(XoAdministrativeVeto, XoAdministrativeVetoArray, FM_RTC, ISWP.List);

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
                tooltip: this.i18nService.translate('fman.administrative-vetoes.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translate('fman.administrative-vetoes.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];
    }

    private getDetails(entry: XoAdministrativeVeto) {

        const request = new XoAdministrativeVetoName();
        request.name = entry.name;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, request, XoAdministrativeVeto, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoAdministrativeVeto;

        }, this.UNSPECIFIED_DETAILS_ERROR);
    }

    add(duplicated: XoAdministrativeVeto = null) {
        const data: AddNewAdministrativeVetoModalData = {
            addWorkflow: ISWP.Add,
            apiService: this.apiService,
            i18nService: this.i18nService,
            rtc: FM_RTC,
            duplicate: duplicated
        };

        this.dialogService.custom<boolean, AddNewAdministrativeVetoModalData>(AddNewAdministrativeVetoModalComponent, data).afterDismissResult()
            .pipe(filter(result => !!result))
            .subscribe(() => this.refresh());
    }

    delete(entry: XoAdministrativeVeto) {
        this.dialogService.confirm(
            this.i18nService.translate(this.FM_DELETE_ENTRY_HEADER),
            this.i18nService.translate(this.CONFIRM_DELETE, { key: '$0', value: entry.name })
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoAdministrativeVeto) {
                        const veto = new XoAdministrativeVetoName();
                        veto.name = entry.name;
                        const obs = this.apiService.startOrder(FM_RTC, ISWP.Delete, veto, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, () => {
                            this.detailsObject = null;
                            this.clearSelection();
                            this.refresh();
                        }, this.UNSPECIFIED_DETAILS_ERROR);
                    }
                }
            }
        );
    }

    duplicate(entry: XoAdministrativeVeto) {

        const request = new XoAdministrativeVetoName();
        request.name = entry.name;

        const obs = this.apiService.startOrder(FM_RTC, ISWP.Details, request, XoAdministrativeVeto, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            const detailedEntry = (output[0] || null) as XoAdministrativeVeto;
            this.add(detailedEntry);

        }, this.UNSPECIFIED_DETAILS_ERROR);

    }

    dismiss() {
        this.detailsObject = null;
        this.clearSelection();
    }

    save() {
        const obs = this.apiService.startOrder(FM_RTC, ISWP.Save, this.detailsObject.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            // console.log('save was successful?', output);
            this.dismiss();
            this.refresh();
        }, this.UNSPECIFIED_SAVE_ERROR);
    }
}
