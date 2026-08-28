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
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { StartOrderOptionsBuilder } from '@zeta/api';
import { XcI18nContextDirective, XcI18nTranslateDirective } from '@zeta/i18n';

import { filter } from 'rxjs';

import { AddNewAdministrativeVetoModalComponent, AddNewAdministrativeVetoModalData } from './modal/add-new-administrative-veto-modal/add-new-administrative-veto-modal.component';
import { ADMINISTRATIVE_VETOES_ISWP, RestorableAdministrativeVetoComponent } from './restorable-administrative-vetoes.component';
import { XoAdministrativeVetoName } from './xo/xo-administrative-veto-name.mode';
import { XoAdministrativeVeto, XoAdministrativeVetoArray } from './xo/xo-administrative-veto.model';
import { XcButtonComponent, XcFormInputComponent, XcFormTextareaComponent, XcIconButtonComponent, XcMasterDetailComponent, XcPanelComponent, XcTableComponent, XcTooltipDirective } from '@zeta/xc';
import { FMAN_RTC } from '@fman/factory-manager.component';


const ISWP = ADMINISTRATIVE_VETOES_ISWP;

@Component({
    templateUrl: './administrative-vetoes.component.html',
    styleUrls: ['./administrative-vetoes.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [XcButtonComponent, XcFormInputComponent, XcFormTextareaComponent, XcIconButtonComponent, XcMasterDetailComponent, XcPanelComponent, XcTableComponent, XcTooltipDirective, XcI18nContextDirective, XcI18nTranslateDirective]
})
export class AdministrativeVetoesComponent extends RestorableAdministrativeVetoComponent {

    runtimeContextsDataWrapper: any;
    readonly selectedDetails = signal<XoAdministrativeVeto | null>(null);

    constructor() {
        super();
        this.initRemoteTableDataSource(XoAdministrativeVeto, XoAdministrativeVetoArray, FMAN_RTC, ISWP.List);

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
                tooltip: this.i18nService.translateSignal('fman.administrative-vetoes.delete'),
                onAction: this.delete.bind(this)
            },
            {
                class: 'copy-action-element',
                iconName: 'copy',
                tooltip: this.i18nService.translateSignal('fman.administrative-vetoes.duplicate'),
                onAction: this.duplicate.bind(this)
            }
        ];
    }

    private getDetails(entry: XoAdministrativeVeto) {

        const request = new XoAdministrativeVetoName();
        request.name = entry.name;

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Details, request, XoAdministrativeVeto, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            this.detailsObject = (output[0] || null) as XoAdministrativeVeto;
            this.selectedDetails.set(this.detailsObject);

        }, this.UNSPECIFIED_DETAILS_ERROR);
    }

    add(duplicated: XoAdministrativeVeto = null) {
        const data: AddNewAdministrativeVetoModalData = {
            addWorkflow: ISWP.Add,
            apiService: this.apiService,
            i18nService: this.i18nService,
            rtc: FMAN_RTC,
            duplicate: duplicated
        };

        this.dialogService.custom<boolean, AddNewAdministrativeVetoModalData>(AddNewAdministrativeVetoModalComponent, data).afterDismissResult()
            .pipe(filter(result => !!result))
            .subscribe(() => this.refresh());
    }

    delete(entry: XoAdministrativeVeto) {
        this.dialogService.confirm(
            this.i18nService.translateSignal(this.FM_DELETE_ENTRY_HEADER)(),
            this.i18nService.translateSignal(this.CONFIRM_DELETE, { key: '$0', value: entry.name })()
        ).afterDismissResult().subscribe(
            value => {
                if (value) {
                    if (entry instanceof XoAdministrativeVeto) {
                        const veto = new XoAdministrativeVetoName();
                        veto.name = entry.name;
                        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Delete, veto, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
                        this.handleStartOrderResult(obs, () => {
                            this.detailsObject = null;
                            this.selectedDetails.set(null);
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

        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Details, request, XoAdministrativeVeto, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            const detailedEntry = (output[0] || null) as XoAdministrativeVeto;
            this.add(detailedEntry);

        }, this.UNSPECIFIED_DETAILS_ERROR);

    }

    dismiss() {
        this.detailsObject = null;
        this.selectedDetails.set(null);
        this.clearSelection();
    }

    save() {
        const obs = this.apiService.startOrder(FMAN_RTC, ISWP.Save, this.detailsObject.clone(), null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage);
        this.handleStartOrderResult(obs, output => {
            // console.log('save was successful?', output);
            this.dismiss();
            this.refresh();
        }, this.UNSPECIFIED_SAVE_ERROR);
    }
}
