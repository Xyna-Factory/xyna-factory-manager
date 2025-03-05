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

import { ApiService, RuntimeContext, StartOrderOptionsBuilder } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcFormDirective } from '@zeta/xc';

import { FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { XoAdministrativeVeto } from '../../xo/xo-administrative-veto.model';
import { addNewAdministrativeVetoModal_translations_de_DE } from './locale/add-new-administrative-veto-modal-translations.de-DE';
import { addNewAdministrativeVetoModal_translations_en_US } from './locale/add-new-administrative-veto-modal-translations.en-US';


export interface AddNewAdministrativeVetoModalData {
    addWorkflow: string;
    apiService: ApiService;
    i18nService: I18nService;
    rtc: RuntimeContext;
    duplicate: XoAdministrativeVeto;
}

@Component({
    selector: 'app-add-new-administrative-veto-modal',
    templateUrl: './add-new-administrative-veto-modal.component.html',
    styleUrls: ['./add-new-administrative-veto-modal.component.scss'],
    standalone: false
})
export class AddNewAdministrativeVetoModalComponent extends XcDialogComponent<boolean, AddNewAdministrativeVetoModalData> {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : true;
    }

    private _error: string;
    get error(): string {
        return this._error;
    }
    set error(value: string) {
        this._error = value;
        if (value) {
            this.errorBoxFocusCandidateRef.focus();
        }
    }

    errorBoxFocusCandidateRef = FMFocusCandidateRef.getInstance();

    administrativeVeto: XoAdministrativeVeto;

    constructor(injector: Injector, i18nService: I18nService) {
        super(injector);

        i18nService.setTranslations(LocaleService.DE_DE, addNewAdministrativeVetoModal_translations_de_DE);
        i18nService.setTranslations(LocaleService.EN_US, addNewAdministrativeVetoModal_translations_en_US);

        this.administrativeVeto = new XoAdministrativeVeto();

        if (this.injectedData.duplicate) {
            this._useDuplicate(this.injectedData.duplicate.clone());
        } else {
            this.administrativeVeto = new XoAdministrativeVeto();
        }
    }

    private _useDuplicate(veto: XoAdministrativeVeto) {
        this.administrativeVeto = veto;
    }

    add() {

        const request = new XoAdministrativeVeto();

        request.name = this.administrativeVeto.name;
        request.documentation = this.administrativeVeto.documentation;

        this.injectedData.apiService.startOrder(
            this.injectedData.rtc,
            this.injectedData.addWorkflow,
            request,
            null,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        ).subscribe(
            result => {
                if (result && result.errorMessage) {
                    this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                } else {
                    this.dismiss(true);
                }
            },
            error => console.log('Add error: ', error)
        );
    }
}
