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
import { XoCapacityInformation } from '../../xo/xo-capacity-information.model';
import { addNewCapacityModal_translations_de_DE } from './locale/add-new-capacity-modal-translations.de-DE';
import { addNewCapacityModal_translations_en_US } from './locale/add-new-capacity-modal-translations.en-US';


export interface AddNewCapacityModalComponentData {
    addWorkflow: string;
    rtc: RuntimeContext;
    apiService: ApiService;
    i18nService: I18nService;
    duplicate: XoCapacityInformation;
}

@Component({
    templateUrl: './add-new-capacity-modal.component.html',
    styleUrls: ['./add-new-capacity-modal.component.scss'],
    standalone: false
})
export class AddNewCapacityModalComponent extends XcDialogComponent<boolean, AddNewCapacityModalComponentData> {

    @ViewChild(XcFormDirective, {static: false})
    xcFormDirective: XcFormDirective;

    get invalid(): boolean {
        return this.xcFormDirective ? this.xcFormDirective.invalid : true;
    }

    busy = false;

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

    get state(): boolean {
        return this.capacity.state === 'ACTIVE';
    }

    set state(value: boolean) {
        this.capacity.state = value ? 'ACTIVE' : 'DISABLED';
    }

    capacity: XoCapacityInformation;

    constructor(injector: Injector, private readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, addNewCapacityModal_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, addNewCapacityModal_translations_en_US);

        if (this.injectedData.duplicate) {
            this.capacity = this.injectedData.duplicate.clone();
        } else {
            this.capacity = new XoCapacityInformation();
            this.capacity.cardinality = 0;
            this.state = true;
        }
    }

    add() {
        this.busy = true;
        this.injectedData.apiService.startOrder(
            this.injectedData.rtc, this.injectedData.addWorkflow, this.capacity, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe(
                result => {
                    this.busy = false;
                    if (result && result.errorMessage) {
                        this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                    } else {
                        this.dismiss(true);
                    }
                }
            );
    }

}
