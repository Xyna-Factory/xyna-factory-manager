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

import { ApiService, RuntimeContext, StartOrderOptionsBuilder, XoRuntimeContext } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcDialogComponent } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { FMFocusCandidateDirective, FMFocusCandidateRef } from '../../../misc/directives/fm-focus-candidate.directive';
import { XoDeploymentItemIdArray } from '../../xo/xo-deployment-item-id.model';
import { XoDeploymentItemArray } from '../../xo/xo-deployment-item.model';
import { deployModal_translations_de_DE } from './locale/deploy-modal-translations.de-DE';
import { deployModal_translations_en_US } from './locale/deploy-modal-translations.en-US';


export interface DeployModalComponentData {
    rtc: RuntimeContext;
    apiService: ApiService;
    i18nService: I18nService;
    deployWorkflow: string;
    items: XoDeploymentItemArray;
    runtimeContext: XoRuntimeContext;
    UNSPECIFIED_DEPLOY_ERROR: string;
    applyButton: string;
}

@Component({
    templateUrl: './deploy-modal.component.html',
    styleUrls: ['./deploy-modal.component.scss'],
    imports: [XcModule, I18nModule, FMFocusCandidateDirective]
})
export class DeployModalComponent extends XcDialogComponent<boolean, DeployModalComponentData> {

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

    constructor(injector: Injector) {
        super(injector);

        this.injectedData.i18nService.setTranslations(LocaleService.DE_DE, deployModal_translations_de_DE);
        this.injectedData.i18nService.setTranslations(LocaleService.EN_US, deployModal_translations_en_US);
    }

    deploy() {

        const ids = new XoDeploymentItemIdArray();
        this.injectedData.items.data.forEach(item => ids.data.push(item.id));

        this.busy = true;

        this.injectedData.apiService.startOrder(
            this.injectedData.rtc,
            this.injectedData.deployWorkflow,
            [ids, this.injectedData.runtimeContext],
            null,
            StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
        ).subscribe({
            next: result => {
                if (result && !result.errorMessage) {
                    this.dismiss(true);
                } else {
                    this.error = this.injectedData.i18nService.translateErrorCode(result.errorMessage);
                }
            },
            error: () => this.error = this.injectedData.UNSPECIFIED_DEPLOY_ERROR,
            complete: () => this.busy = false
        });
    }

}
